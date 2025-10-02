/**
 * Idempotency Service
 * Binder1: Idempotency key enforcement for all POST routes
 * 
 * Ensures that duplicate requests with the same idempotency key
 * return the same result without re-executing the operation.
 */

import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

export interface IdempotencyRecord {
  id: string;
  key: string;
  orgId: string;
  endpoint: string;
  requestHash: string;
  responseStatus: number;
  responseBody: any;
  createdAt: Date;
  expiresAt: Date;
}

export interface IdempotencyCheckResult {
  exists: boolean;
  record?: IdempotencyRecord;
  conflict?: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

export class IdempotencyService {
  /**
   * Check if an idempotency key has been used before
   * Returns the previous response if found
   */
  async check(
    key: string,
    orgId: string,
    endpoint: string,
    requestBody: any
  ): Promise<IdempotencyCheckResult> {
    // Find existing record
    const existing = await prisma.idempotencyKey.findUnique({
      where: {
        orgId_key: {
          orgId,
          key,
        },
      },
    });

    if (!existing) {
      return { exists: false };
    }

    // Check if expired
    if (existing.expiresAt < new Date()) {
      // Expired, can be reused
      await prisma.idempotencyKey.delete({
        where: { id: existing.id },
      });
      return { exists: false };
    }

    // Check if request body matches (detect conflicts)
    const requestHash = this.hashRequest(requestBody);
    const conflict = existing.requestHash !== requestHash;

    return {
      exists: true,
      record: existing as IdempotencyRecord,
      conflict,
    };
  }

  /**
   * Store a successful response for an idempotency key
   */
  async store(
    key: string,
    orgId: string,
    endpoint: string,
    requestBody: any,
    responseStatus: number,
    responseBody: any,
    ttlHours: number = 24
  ): Promise<void> {
    const requestHash = this.hashRequest(requestBody);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    await prisma.idempotencyKey.upsert({
      where: {
        orgId_key: {
          orgId,
          key,
        },
      },
      create: {
        orgId,
        key,
        endpoint,
        requestHash,
        responseStatus,
        responseBody: responseBody as any,
        expiresAt,
      },
      update: {
        endpoint,
        requestHash,
        responseStatus,
        responseBody: responseBody as any,
        expiresAt,
      },
    });
  }

  /**
   * Delete an idempotency key (for testing or manual cleanup)
   */
  async delete(key: string, orgId: string): Promise<void> {
    await prisma.idempotencyKey.deleteMany({
      where: {
        orgId,
        key,
      },
    });
  }

  /**
   * Clean up expired idempotency keys
   */
  async cleanup(): Promise<number> {
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Hash request body for conflict detection
   */
  private hashRequest(requestBody: any): string {
    // Simple hash using JSON stringify
    // In production, use a proper hash function like SHA-256
    const str = JSON.stringify(requestBody, Object.keys(requestBody).sort());
    return Buffer.from(str).toString('base64');
  }
}

// Export singleton instance
export const idempotencyService = new IdempotencyService();

