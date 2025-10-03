import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddEstimateLineSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    estimate_id: z.string(),
    description: z.string().min(1),
    quantity: z.number().min(0),
    unit_price: z.number().min(0),
    tax_rate: z.number().min(0).max(1).optional().default(0),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const userId = req.headers['x-user-id'] as string || 'user_test';

    // Validate request body
    const validation = AddEstimateLineSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    // Extract estimate ID
    const estimateId = payload.estimate_id.replace('BIL-', '');
    if (!estimateId) {
      return res.status(400).json({
        error: 'INVALID_ESTIMATE_ID',
        message: 'Estimate ID must be in format BIL-000001',
      });
    }

    // Verify estimate exists and is in draft status
    const estimate = await prisma.quote.findFirst({
      where: { 
        id: estimateId, 
        orgId,
        status: 'draft', // Only allow adding lines to draft estimates
      },
    });

    if (!estimate) {
      return res.status(404).json({
        error: 'ESTIMATE_NOT_FOUND',
        message: 'Estimate not found or not in draft status',
      });
    }

    // Calculate line total
    const lineTotal = payload.quantity * payload.unit_price;
    const taxAmount = lineTotal * payload.tax_rate;
    const totalWithTax = lineTotal + taxAmount;

    // Create new line item
    const newLineItem = {
      id: `line_${Date.now()}`,
      description: payload.description,
      quantity: payload.quantity,
      unit_price: payload.unit_price,
      tax_rate: payload.tax_rate,
      line_total: lineTotal,
      tax_amount: taxAmount,
      total_amount: totalWithTax,
    };

    // Get current items and add new line
    const currentItems = Array.isArray(estimate.items) ? estimate.items as any[] : [];
    const updatedItems = [...currentItems, newLineItem];

    // Calculate new totals
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.line_total, 0);
    const newTax = updatedItems.reduce((sum, item) => sum + item.tax_amount, 0);
    const newTotal = newSubtotal + newTax;

    // Update estimate with new line and totals
    const updatedEstimate = await prisma.quote.update({
      where: { id: estimateId },
      data: {
        items: updatedItems,
        subtotal: newSubtotal,
        tax: newTax,
        total: newTotal,
      },
    });

    const lineId = `LINE-${newLineItem.id}`;

    // Audit log
    await auditService.logBinderEvent({
      action: 'billing.estimate.line.add',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    return res.status(201).json({
      status: 'ok',
      result: {
        id: lineId,
        version: 1,
      },
      line: {
        id: lineId,
        estimate_id: payload.estimate_id,
        description: newLineItem.description,
        quantity: newLineItem.quantity,
        unit_price: newLineItem.unit_price,
        tax_rate: newLineItem.tax_rate,
        line_total: newLineItem.line_total,
        tax_amount: newLineItem.tax_amount,
        total_amount: newLineItem.total_amount,
        created_at: new Date(),
      },
      estimate_total: newTotal,
      audit_id: `AUD-LINE-${newLineItem.id}`,
    });
  } catch (error) {
    console.error('Error adding estimate line:', error);
    await auditService.logBinderEvent({
      action: 'billing.estimate.line.add.error',
      tenantId: req.headers['x-org-id'] as string || 'org_test',
      path: req.url,
      error: String(error),
      ts: Date.now(),
    });
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to add estimate line',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
