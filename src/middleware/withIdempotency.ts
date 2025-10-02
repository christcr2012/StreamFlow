/**
 * Idempotency Middleware
 * Binder1: Enforce idempotency on all POST routes
 * 
 * Checks X-Idempotency-Key header and returns cached response
 * if the same key was used before with the same request body.
 * Returns 409 Conflict if key was used with different request body.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { idempotencyService } from '@/server/services/idempotencyService';
import { getUserInfo } from './withAudience';

/**
 * Middleware to enforce idempotency on POST requests
 * 
 * Usage:
 * export default withIdempotency(
 *   withAudience(AUDIENCE.CLIENT_ONLY, handler)
 * );
 */
export function withIdempotency(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only apply to POST requests
    if (req.method !== 'POST') {
      return handler(req, res);
    }

    // Get idempotency key from header
    const idempotencyKey = req.headers['x-idempotency-key'] as string;

    // If no idempotency key, proceed normally
    if (!idempotencyKey) {
      return handler(req, res);
    }

    try {
      const { orgId } = getUserInfo(req);
      const endpoint = req.url || 'unknown';

      // Check if key was used before
      const check = await idempotencyService.check(
        idempotencyKey,
        orgId,
        endpoint,
        req.body
      );

      if (check.exists && check.record) {
        // Key was used before
        if (check.conflict) {
          // Different request body - conflict
          return res.status(409).json({
            error: 'Conflict',
            message: 'Idempotency key was used with different request body',
            details: {
              idempotencyKey,
              previousEndpoint: check.record.endpoint,
              previousTimestamp: check.record.createdAt,
            },
          });
        }

        // Same request body - return cached response
        return res
          .status(check.record.responseStatus)
          .json(check.record.responseBody);
      }

      // Key not used before - proceed with handler
      // Intercept response to store it
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      let responseStatus = 200;
      let responseBody: any = null;

      // Override status to capture it
      res.status = function (code: number) {
        responseStatus = code;
        return originalStatus(code);
      };

      // Override json to capture response and store idempotency record
      res.json = function (body: any) {
        responseBody = body;

        // Store idempotency record for successful responses (2xx)
        if (responseStatus >= 200 && responseStatus < 300) {
          idempotencyService
            .store(
              idempotencyKey,
              orgId,
              endpoint,
              req.body,
              responseStatus,
              responseBody
            )
            .catch((error) => {
              console.error('Failed to store idempotency record:', error);
            });
        }

        return originalJson(body);
      };

      // Call handler
      return handler(req, res);
    } catch (error) {
      console.error('Error in withIdempotency:', error);
      return res.status(500).json({
        error: 'Internal',
        message: 'Idempotency check failed',
      });
    }
  };
}

