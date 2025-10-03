import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { MigrationService } from '@/server/services/migrationService';
import { z } from 'zod';

const ValidateSchema = z.object({
  uploadId: z.string().min(1),
  sampleSize: z.number().min(1).max(1000).default(100),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = ValidateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { uploadId, sampleSize } = validation.data;

    // Validate sample
    const result = await MigrationService.validateSample(
      orgId,
      userId,
      uploadId,
      sampleSize
    );

    // Check if validation failed (>10% errors)
    const errorRate = result.errors.length / result.totalRecords;
    if (errorRate > 0.1) {
      return res.status(422).json({
        error: 'VALIDATION_FAILED',
        message: 'Too many validation errors (>10%)',
        validation: result,
        audit_id: `AUD-VAL-${uploadId}`,
      });
    }

    // Audit log
    await auditService.logBinderEvent({
      action: 'migration.validate',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: uploadId,
        version: 1,
      },
      validation: {
        valid: result.valid,
        totalRecords: result.totalRecords,
        validRecords: result.validRecords,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        errorRate: Math.round(errorRate * 100),
        // Only return first 10 errors/warnings to avoid large responses
        errors: result.errors.slice(0, 10),
        warnings: result.warnings.slice(0, 10),
        hasMoreErrors: result.errors.length > 10,
        hasMoreWarnings: result.warnings.length > 10,
      },
      audit_id: `AUD-VAL-${uploadId}`,
      cost: {
        ai_tokens: 0,
        cents: 0,
      },
    });
  } catch (error) {
    console.error('Error validating migration:', error);
    await auditService.logBinderEvent({
      action: 'migration.validate.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to validate migration',
    });
  }
}

export default withAudience('tenant', handler);
