import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { MigrationService } from '@/server/services/migrationService';
import { z } from 'zod';

const ExecuteSchema = z.object({
  uploadId: z.string().min(1),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = ExecuteSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { uploadId } = validation.data;

    // Execute migration
    const result = await MigrationService.executeMigration(
      orgId,
      userId,
      uploadId
    );

    // Audit log
    await auditService.logBinderEvent({
      action: 'migration.execute',
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
      migration: {
        imported: result.imported,
        errorCount: result.errors.length,
        // Only return first 10 errors to avoid large responses
        errors: result.errors.slice(0, 10),
        hasMoreErrors: result.errors.length > 10,
        successRate: Math.round((result.imported / (result.imported + result.errors.length)) * 100),
      },
      audit_id: `AUD-EXE-${uploadId}`,
      cost: {
        ai_tokens: 0,
        cents: result.imported * 0.1, // 0.1 cents per imported record
      },
    });
  } catch (error) {
    console.error('Error executing migration:', error);
    await auditService.logBinderEvent({
      action: 'migration.execute.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to execute migration',
    });
  }
}

export default withAudience('tenant', handler);
