import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { MigrationService } from '@/server/services/migrationService';
import { z } from 'zod';

const UploadCSVSchema = z.object({
  filename: z.string().min(1),
  csvData: z.string().min(1),
  type: z.enum(['organizations', 'contacts', 'assets', 'invoices', 'work_orders', 'fuel', 'dvir']),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = UploadCSVSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { filename, csvData, type } = validation.data;

    // Upload CSV
    const result = await MigrationService.uploadCSV(
      orgId,
      userId,
      filename,
      csvData,
      type
    );

    // Audit log
    await auditService.logBinderEvent({
      action: 'migration.csv.upload',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(201).json({
      status: 'ok',
      result: {
        id: result.id,
        version: 1,
      },
      upload: {
        id: result.id,
        filename: result.filename,
        recordCount: result.recordCount,
        headers: result.headers,
        sampleData: result.sampleData,
      },
      audit_id: `AUD-MIG-${result.id}`,
      cost: {
        ai_tokens: 0,
        cents: 0,
      },
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    await auditService.logBinderEvent({
      action: 'migration.csv.upload.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to upload CSV',
    });
  }
}

export default withAudience('tenant', handler);
