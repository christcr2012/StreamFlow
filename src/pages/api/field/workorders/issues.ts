import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ReportIssueSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    issue_type: z.enum(['equipment', 'safety', 'customer', 'access', 'weather', 'other']),
    issue_title: z.string().min(1),
    issue_description: z.string().min(1),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    photos: z.array(z.string()).optional(),
    requires_escalation: z.boolean().default(false),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }).optional(),
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

    const validation = ReportIssueSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;
    const workOrderId = payload.work_order_id.replace('WO-', '');

    const workOrder = await prisma.workOrder.findFirst({
      where: { id: workOrderId, orgId },
      include: { assignments: true },
    });

    if (!workOrder) {
      return res.status(404).json({
        error: 'WORK_ORDER_NOT_FOUND',
        message: 'Work order not found',
      });
    }

    const isAssigned = workOrder.assignments.some(
      assignment => assignment.employeeId === userId && !assignment.unassignedAt
    );

    if (!isAssigned) {
      return res.status(403).json({
        error: 'NOT_ASSIGNED',
        message: 'User is not assigned to this work order',
      });
    }

    // Create issue using Note model
    const issue = await prisma.note.create({
      data: {
        orgId,
        entityType: 'workorder',
        entityId: workOrderId,
        userId,
        body: `ISSUE [${payload.severity.toUpperCase()}] ${payload.issue_title}: ${payload.issue_description}${payload.requires_escalation ? ' [ESCALATED]' : ''}`,
        isPinned: payload.severity === 'critical' || payload.requires_escalation,
      },
    });

    // If escalation required, create additional note for tracking
    if (payload.requires_escalation) {
      await prisma.note.create({
        data: {
          orgId,
          entityType: 'workorder',
          entityId: workOrderId,
          userId,
          body: `ESCALATION NOTICE: Issue "${payload.issue_title}" has been escalated due to ${payload.severity} severity. Manager notification required.`,
          isPinned: true,
        },
      });
    }

    await auditService.logBinderEvent({
      action: 'workorder.issue.report',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'report_issue',
        resource: `workorder:${workOrderId}`,
        meta: {
          issue_type: payload.issue_type,
          severity: payload.severity,
          requires_escalation: payload.requires_escalation,
          photos_count: payload.photos?.length || 0,
          location: payload.location,
        },
      },
    });

    const issueId = `ISSUE-${issue.id.substring(0, 6)}`;
    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: issueId,
        version: 1,
      },
      issue: {
        id: issueId,
        work_order_id: workOrderIdFormatted,
        issue_type: payload.issue_type,
        issue_title: payload.issue_title,
        issue_description: payload.issue_description,
        severity: payload.severity,
        status: payload.requires_escalation ? 'ESCALATED' : 'OPEN',
        requires_escalation: payload.requires_escalation,
        photos: payload.photos,
        reported_by: userId,
        reported_at: issue.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-ISSUE-${issue.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error reporting issue:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to report issue',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
