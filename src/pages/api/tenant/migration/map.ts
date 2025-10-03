import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { auditService } from '@/lib/auditService';
import { MigrationService } from '@/server/services/migrationService';
import { z } from 'zod';

const FieldMappingSchema = z.object({
  csvField: z.string().min(1),
  targetField: z.string().min(1),
  transformation: z.string().optional(),
  required: z.boolean().default(false),
});

const MapFieldsSchema = z.object({
  uploadId: z.string().min(1),
  mappings: z.array(FieldMappingSchema),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = MapFieldsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { uploadId, mappings } = validation.data;

    // Map fields
    const result = await MigrationService.mapFields(
      orgId,
      userId,
      uploadId,
      mappings
    );

    // Audit log
    await auditService.logBinderEvent({
      action: 'migration.fields.map',
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
      mapping: {
        success: result.success,
        suggestions: result.suggestions,
        mappedFields: mappings.length,
      },
      audit_id: `AUD-MAP-${uploadId}`,
      cost: {
        ai_tokens: result.suggestions ? 150 : 0, // AI suggestions cost tokens
        cents: 0,
      },
    });
  } catch (error) {
    console.error('Error mapping fields:', error);
    await auditService.logBinderEvent({
      action: 'migration.fields.map.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to map fields',
    });
  }
}

export default withAudience('tenant', handler);
