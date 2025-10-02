// src/lib/idempotency.ts
import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * 🔄 SERVER-SIDE IDEMPOTENCY MANAGEMENT
 * 
 * This module handles idempotency for API requests to prevent duplicate
 * operations when offline clients replay their operation queues.
 * 
 * Features:
 * - Idempotency key validation and storage
 * - Conflict detection with updatedAt timestamps
 * - Automatic cleanup of old idempotency records
 * - 409 responses for conflicts requiring manual resolution
 */

// ===================================================================
// TYPES & INTERFACES
// ===================================================================

export interface IdempotencyResult {
  isIdempotent: boolean;
  existingResponse?: any;
  shouldProceed: boolean;
  conflictInfo?: {
    serverUpdatedAt: string;
    clientUpdatedAt: string;
    requiresManualResolution: boolean;
  };
}

export interface IdempotencyOptions {
  ttlHours?: number; // How long to keep idempotency records (default: 24)
  enableConflictDetection?: boolean; // Check updatedAt for conflicts (default: true)
  allowedMethods?: string[]; // Which HTTP methods to handle (default: POST, PUT, PATCH)
}

// ===================================================================
// IDEMPOTENCY SERVICE
// ===================================================================

export class IdempotencyService {
  private prisma: PrismaClient;
  private options: Required<IdempotencyOptions>;

  constructor(prisma: PrismaClient, options: IdempotencyOptions = {}) {
    this.prisma = prisma;
    this.options = {
      ttlHours: options.ttlHours || 24,
      enableConflictDetection: options.enableConflictDetection ?? true,
      allowedMethods: options.allowedMethods || ['POST', 'PUT', 'PATCH']
    };
  }

  /**
   * Check if request is idempotent and handle accordingly
   */
  async handleIdempotency(
    req: NextApiRequest,
    orgId: string,
    entityType: string,
    entityId?: string,
    clientUpdatedAt?: string
  ): Promise<IdempotencyResult> {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    const method = req.method || 'GET';

    // Skip if method not in allowed list
    if (!this.options.allowedMethods.includes(method)) {
      return { isIdempotent: false, shouldProceed: true };
    }

    // Skip if no idempotency key provided
    if (!idempotencyKey) {
      return { isIdempotent: false, shouldProceed: true };
    }

    // Validate idempotency key format
    if (!this.isValidIdempotencyKey(idempotencyKey)) {
      throw new Error('Invalid idempotency key format');
    }

    try {
      // Check for existing idempotency record
      const existingRecord = await this.prisma.idempotencyKey.findUnique({
        where: {
          orgId_key: {
            orgId,
            key: idempotencyKey
          }
        }
      });

      if (existingRecord) {
        // Request has been processed before - return cached response
        return {
          isIdempotent: true,
          existingResponse: existingRecord.responseBody,
          shouldProceed: false
        };
      }

      // Check for conflicts if entity exists and conflict detection is enabled
      if (this.options.enableConflictDetection && entityId && clientUpdatedAt) {
        const conflictInfo = await this.checkForConflicts(entityType, entityId, clientUpdatedAt);
        if (conflictInfo) {
          return {
            isIdempotent: false,
            shouldProceed: false,
            conflictInfo
          };
        }
      }

      // No existing record, proceed with operation
      return { isIdempotent: false, shouldProceed: true };

    } catch (error) {
      console.error('Error checking idempotency:', error);
      throw error;
    }
  }

  /**
   * Store idempotency record after successful operation
   */
  async storeIdempotencyRecord(
    idempotencyKey: string,
    entityType: string,
    entityId: string,
    response: any,
    orgId: string
  ): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.options.ttlHours);

      await this.prisma.idempotencyKey.create({
        data: {
          key: idempotencyKey,
          endpoint: entityType,
          requestHash: entityId,
          responseStatus: 200,
          responseBody: response as any,
          orgId,
          expiresAt,
        }
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Error storing idempotency record:', error);
    }
  }

  /**
   * Check for conflicts between client and server versions
   */
  private async checkForConflicts(
    entityType: string,
    entityId: string,
    clientUpdatedAt: string
  ): Promise<IdempotencyResult['conflictInfo']> {
    try {
      let serverRecord: any = null;

      // Get server record based on entity type
      switch (entityType.toLowerCase()) {
        case 'lead':
          serverRecord = await this.prisma.lead.findUnique({
            where: { id: entityId },
            select: { updatedAt: true }
          });
          break;
        case 'workorder':
          serverRecord = await this.prisma.workOrder.findUnique({
            where: { id: entityId },
            select: { updatedAt: true }
          });
          break;
        case 'timesheet':
          // Note: Timesheet model may not exist yet in schema
          // This is a placeholder for future implementation
          serverRecord = null;
          break;
        default:
          // Unknown entity type, skip conflict detection
          return undefined;
      }

      if (!serverRecord) {
        // Entity doesn't exist on server, no conflict
        return undefined;
      }

      const serverUpdatedAt = serverRecord.updatedAt.toISOString();
      const clientUpdatedAtDate = new Date(clientUpdatedAt);
      const serverUpdatedAtDate = new Date(serverUpdatedAt);

      // Check if server version is newer than client version
      if (serverUpdatedAtDate > clientUpdatedAtDate) {
        return {
          serverUpdatedAt,
          clientUpdatedAt,
          requiresManualResolution: true
        };
      }

      return undefined;
    } catch (error) {
      console.error('Error checking for conflicts:', error);
      return undefined;
    }
  }

  /**
   * Validate idempotency key format
   */
  private isValidIdempotencyKey(key: string): boolean {
    // Key should be a reasonable length and contain only safe characters
    return /^[a-zA-Z0-9\-_]{10,128}$/.test(key);
  }

  /**
   * Clean up expired idempotency records
   */
  async cleanupExpiredRecords(): Promise<number> {
    try {
      const result = await this.prisma.idempotencyKey.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired idempotency records:', error);
      return 0;
    }
  }

  /**
   * Get idempotency statistics
   */
  async getStats(): Promise<{
    totalRecords: number;
    expiredRecords: number;
    recordsByEntityType: Record<string, number>;
  }> {
    try {
      const [totalRecords, expiredRecords, recordsByType] = await Promise.all([
        this.prisma.idempotencyKey.count(),
        this.prisma.idempotencyKey.count({
          where: { expiresAt: { lt: new Date() } }
        }),
        this.prisma.idempotencyKey.groupBy({
          by: ['endpoint'],
          _count: { endpoint: true }
        })
      ]);

      const recordsByEntityType: Record<string, number> = {};
      recordsByType.forEach((group: any) => {
        recordsByEntityType[group.endpoint] = group._count.endpoint;
      });

      return {
        totalRecords,
        expiredRecords,
        recordsByEntityType
      };
    } catch (error) {
      console.error('Error getting idempotency stats:', error);
      return {
        totalRecords: 0,
        expiredRecords: 0,
        recordsByEntityType: {}
      };
    }
  }
}

// ===================================================================
// MIDDLEWARE HELPER
// ===================================================================

/**
 * Express/Next.js middleware for handling idempotency
 */
export function withIdempotency(
  prisma: PrismaClient,
  options: IdempotencyOptions = {}
) {
  const service = new IdempotencyService(prisma, options);

  return async function idempotencyMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => Promise<void>,
    entityType: string,
    entityId?: string,
    clientUpdatedAt?: string
  ) {
    try {
      const orgId = req.headers['x-org-id'] as string || 'org_test';
      const result = await service.handleIdempotency(req, orgId, entityType, entityId, clientUpdatedAt);

      if (result.conflictInfo) {
        // Return 409 Conflict with details
        return res.status(409).json({
          error: 'Conflict detected',
          message: 'Server has a newer version of this resource',
          conflictInfo: result.conflictInfo,
          code: 'RESOURCE_CONFLICT'
        });
      }

      if (result.isIdempotent && result.existingResponse) {
        // Return cached response
        return res.status(200).json(result.existingResponse);
      }

      if (!result.shouldProceed) {
        // Some other reason not to proceed
        return res.status(400).json({
          error: 'Request cannot be processed',
          message: 'Idempotency check failed'
        });
      }

      // Store service instance for later use
      (req as any).idempotencyService = service;
      
      // Proceed with normal request processing
      await next();

    } catch (error) {
      console.error('Idempotency middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Idempotency check failed'
      });
    }
  };
}

// ===================================================================
// UTILITY FUNCTIONS
// ===================================================================

/**
 * Store idempotency record after successful API response
 */
export async function storeIdempotencyRecord(
  req: NextApiRequest,
  entityType: string,
  entityId: string,
  response: any,
  orgId: string
): Promise<void> {
  const service = (req as any).idempotencyService as IdempotencyService;
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (service && idempotencyKey) {
    await service.storeIdempotencyRecord(idempotencyKey, entityType, entityId, response, orgId);
  }
}

/**
 * Daily cleanup job for expired idempotency records
 */
export async function cleanupExpiredIdempotencyRecords(prisma: PrismaClient): Promise<number> {
  const service = new IdempotencyService(prisma);
  return service.cleanupExpiredRecords();
}
