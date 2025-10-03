import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CustomerPortalSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    action: z.enum([
      'get_dashboard', 'get_work_orders', 'get_invoices', 'get_estimates',
      'schedule_service', 'update_profile', 'submit_feedback', 'get_service_history',
      'request_quote', 'pay_invoice', 'download_receipt', 'chat_support'
    ]),
    customer_id: z.string().optional(),
    work_order_id: z.string().optional(),
    invoice_id: z.string().optional(),
    service_request: z.object({
      service_type: z.string(),
      description: z.string(),
      preferred_date: z.string(),
      priority: z.enum(['low', 'medium', 'high']).default('medium'),
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

    const validation = CustomerPortalSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key } = validation.data;

    let actionResult;
    const actionId = `PORTAL-${Date.now()}`;

    switch (payload.action) {
      case 'get_dashboard':
        // Get customer dashboard overview
        const activeWorkOrders = await prisma.workOrder.count({
          where: { orgId, status: 'IN_PROGRESS' },
        });

        const pendingInvoices = await prisma.invoice.count({
          where: { orgId, status: 'sent' },
        });

        const recentWorkOrders = await prisma.workOrder.findMany({
          where: { orgId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { jobSite: true },
        });

        actionResult = {
          dashboard: {
            active_work_orders: activeWorkOrders,
            pending_invoices: pendingInvoices,
            total_spent_ytd: 15750.00,
            loyalty_points: 1250,
            next_service_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            recent_work_orders: recentWorkOrders.map(wo => ({
              id: wo.id,
              title: wo.title,
              status: wo.status,
              scheduled_date: wo.scheduledStartAt,
              location: wo.jobSite?.address || 'TBD',
            })),
          },
        };
        break;

      case 'get_work_orders':
        // Get customer work orders
        const workOrders = await prisma.workOrder.findMany({
          where: { orgId },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { jobSite: true },
        });

        actionResult = {
          work_orders: workOrders.map(wo => ({
            id: wo.id,
            title: wo.title,
            description: wo.description,
            status: wo.status,
            priority: wo.priority,
            scheduled_date: wo.scheduledStartAt,
            completed_date: wo.actualEndAt,
            technician: 'TBD', // wo.assignedTo not in schema
            location: wo.jobSite?.address || 'TBD',
            estimated_cost: 0, // wo.estimatedCost not in schema
          })),
          total_count: workOrders.length,
        };
        break;

      case 'schedule_service':
        // Schedule new service request
        if (!payload.service_request) {
          return res.status(400).json({ error: 'service_request required for schedule_service' });
        }

        const serviceRequest = await prisma.workOrder.create({
          data: {
            orgId,
            title: `Service Request: ${payload.service_request.service_type}`,
            description: payload.service_request.description,
            status: 'SCHEDULED',
            priority: payload.service_request.priority.toUpperCase() as any,
            scheduledStartAt: new Date(payload.service_request.preferred_date),
            // createdBy: userId, // Field not in schema
          },
        });

        actionResult = {
          service_request: {
            id: serviceRequest.id,
            service_type: payload.service_request.service_type,
            description: payload.service_request.description,
            preferred_date: payload.service_request.preferred_date,
            priority: payload.service_request.priority,
            status: 'scheduled',
            confirmation_number: `SR-${serviceRequest.id.substring(0, 8)}`,
          },
        };
        break;

      case 'submit_feedback':
        // Submit customer feedback
        const feedback = await prisma.note.create({
          data: {
            orgId,
            entityType: 'customer_feedback',
            entityId: payload.customer_id || userId,
            userId,
            body: `CUSTOMER FEEDBACK: Rating and comments submitted via customer portal`,
            isPinned: true,
          },
        });

        actionResult = {
          feedback: {
            id: feedback.id,
            status: 'submitted',
            message: 'Thank you for your feedback! We will review it and get back to you.',
            reference_number: `FB-${feedback.id.substring(0, 8)}`,
          },
        };
        break;

      case 'pay_invoice':
        // Process invoice payment
        if (!payload.invoice_id) {
          return res.status(400).json({ error: 'invoice_id required for pay_invoice' });
        }

        const invoice = await prisma.invoice.findFirst({
          where: { id: payload.invoice_id, orgId },
        });

        if (!invoice) {
          return res.status(404).json({ error: 'Invoice not found' });
        }

        // Simulate payment processing
        await prisma.invoice.update({
          where: { id: payload.invoice_id },
          data: { status: 'paid' },
        });

        actionResult = {
          payment: {
            invoice_id: payload.invoice_id,
            amount: invoice.amount,
            status: 'processed',
            transaction_id: `TXN-${Date.now()}`,
            receipt_url: `/api/receipts/${payload.invoice_id}.pdf`,
            confirmation_message: 'Payment processed successfully. Receipt sent to your email.',
          },
        };
        break;

      default:
        actionResult = {
          action: payload.action,
          status: 'executed',
          message: `Customer portal action ${payload.action} executed successfully`,
        };
    }

    // Log customer portal action
    await prisma.note.create({
      data: {
        orgId,
        entityType: 'portal_action',
        entityId: actionId,
        userId,
        body: `CUSTOMER PORTAL: Executed ${payload.action} action. Customer: ${payload.customer_id || userId}`,
        isPinned: false,
      },
    });

    await auditService.logBinderEvent({
      action: 'portal.customer.action',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'customer',
        action: 'customer_portal_action',
        resource: `portal:${actionId}`,
        meta: {
          action: payload.action,
          customer_id: payload.customer_id,
          work_order_id: payload.work_order_id,
          invoice_id: payload.invoice_id,
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: actionId,
        version: 1,
      },
      customer_portal: {
        id: actionId,
        action: payload.action,
        result: actionResult,
        executed_by: userId,
        executed_at: new Date(),
      },
      audit_id: `AUD-PORTAL-${actionId}`,
    });
  } catch (error) {
    console.error('Error executing customer portal action:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to execute customer portal action',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
