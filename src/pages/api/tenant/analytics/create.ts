import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Analytics Dashboard
const CreateAnalyticsReportSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    report_name: z.string(),
    report_type: z.enum(['operational', 'financial', 'performance', 'compliance', 'custom']),
    description: z.string().optional(),
    data_sources: z.array(z.enum(['work_orders', 'customers', 'employees', 'inventory', 'financials', 'assets'])),
    metrics: z.array(z.object({
      name: z.string(),
      type: z.enum(['count', 'sum', 'average', 'percentage', 'ratio']),
      field: z.string(),
      filters: z.array(z.object({
        field: z.string(),
        operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'between']),
        value: z.any(),
      })).default([]),
    })),
    time_period: z.object({
      start_date: z.string(),
      end_date: z.string(),
      granularity: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('daily'),
    }),
    visualization: z.object({
      chart_type: z.enum(['line', 'bar', 'pie', 'table', 'gauge', 'heatmap']),
      grouping: z.array(z.string()).default([]),
      sorting: z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc']).default('desc'),
      }).optional(),
    }),
    schedule: z.object({
      frequency: z.enum(['manual', 'daily', 'weekly', 'monthly']).default('manual'),
      recipients: z.array(z.string()).default([]),
      format: z.enum(['pdf', 'excel', 'csv', 'email']).default('pdf'),
    }).optional(),
    access_level: z.enum(['private', 'team', 'organization']).default('private'),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateAnalyticsReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only managers and owners can create analytics reports',
      });
    }

    // Validate time period
    const startDate = new Date(payload.time_period.start_date);
    const endDate = new Date(payload.time_period.end_date);

    if (endDate <= startDate) {
      return res.status(422).json({
        error: 'INVALID_TIME_PERIOD',
        message: 'End date must be after start date',
      });
    }

    // Validate metrics
    if (payload.metrics.length === 0) {
      return res.status(400).json({
        error: 'NO_METRICS',
        message: 'Report must have at least one metric',
      });
    }

    // Validate recipients if scheduled
    if (payload.schedule && payload.schedule.frequency !== 'manual' && payload.schedule.recipients.length > 0) {
      const recipients = await prisma.user.findMany({
        where: { id: { in: payload.schedule.recipients }, orgId },
      });

      if (recipients.length !== payload.schedule.recipients.length) {
        return res.status(404).json({
          error: 'RECIPIENTS_NOT_FOUND',
          message: 'One or more recipients not found',
        });
      }
    }

    const reportId = `RPT-${Date.now()}`;

    const analyticsReport = await prisma.note.create({
      data: {
        orgId,
        entityType: 'analytics_report',
        entityId: reportId,
        userId: actor.user_id,
        body: `ANALYTICS REPORT: ${payload.report_name} - ${payload.report_type} (${payload.metrics.length} metrics)`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.analytics.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_analytics_report',
        resource: `analytics_report:${analyticsReport.id}`,
        meta: { 
          report_name: payload.report_name,
          report_type: payload.report_type,
          data_sources: payload.data_sources,
          metrics_count: payload.metrics.length,
          time_period: payload.time_period,
          access_level: payload.access_level 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `RPT-${analyticsReport.id.substring(0, 6)}`,
        version: 1,
      },
      analytics_report: {
        id: analyticsReport.id,
        report_id: reportId,
        report_name: payload.report_name,
        report_type: payload.report_type,
        description: payload.description,
        data_sources: payload.data_sources,
        metrics: payload.metrics,
        metrics_count: payload.metrics.length,
        time_period: payload.time_period,
        visualization: payload.visualization,
        schedule: payload.schedule,
        access_level: payload.access_level,
        status: 'draft',
        created_at: analyticsReport.createdAt.toISOString(),
      },
      audit_id: `AUD-RPT-${analyticsReport.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating analytics report:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create analytics report',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
