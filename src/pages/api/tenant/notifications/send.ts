import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Notification System
const SendNotificationSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    recipient_type: z.enum(['user', 'customer', 'vendor', 'all_employees']),
    recipient_ids: z.array(z.string()).optional(),
    notification_type: z.enum(['email', 'sms', 'push', 'in_app']),
    subject: z.string(),
    message: z.string(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    scheduled_at: z.string().optional(),
    template_id: z.string().optional(),
    template_variables: z.record(z.any()).optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = SendNotificationSchema.safeParse(req.body);
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
        message: 'Only managers and owners can send notifications',
      });
    }

    let recipients: any[] = [];

    // Determine recipients based on type
    switch (payload.recipient_type) {
      case 'user':
        if (!payload.recipient_ids || payload.recipient_ids.length === 0) {
          return res.status(400).json({
            error: 'RECIPIENT_IDS_REQUIRED',
            message: 'Recipient IDs required for user notifications',
          });
        }
        recipients = await prisma.user.findMany({
          where: { id: { in: payload.recipient_ids }, orgId },
          select: { id: true, name: true, email: true, metadata: true },
        });
        break;

      case 'customer':
        if (!payload.recipient_ids || payload.recipient_ids.length === 0) {
          return res.status(400).json({
            error: 'RECIPIENT_IDS_REQUIRED',
            message: 'Recipient IDs required for customer notifications',
          });
        }
        recipients = await prisma.customer.findMany({
          where: { id: { in: payload.recipient_ids }, orgId },
          select: { id: true, primaryName: true, primaryEmail: true, primaryPhone: true },
        });
        break;

      case 'all_employees':
        recipients = await prisma.user.findMany({
          where: { orgId, roleScope: 'employee', status: 'active' },
          select: { id: true, name: true, email: true, metadata: true },
        });
        break;
    }

    if (recipients.length === 0) {
      return res.status(404).json({
        error: 'NO_RECIPIENTS_FOUND',
        message: 'No valid recipients found',
      });
    }

    const notificationId = `NOTIF-${Date.now()}`;

    // Create notification record
    const notification = await prisma.note.create({
      data: {
        orgId,
        entityType: 'notification',
        entityId: notificationId,
        userId: actor.user_id,
        body: `NOTIFICATION SENT: ${payload.subject} - ${payload.message} (${payload.notification_type}, ${payload.priority} priority) to ${recipients.length} recipients`,
        isPinned: true,
      },
    });

    // Simulate sending notifications (in real implementation, integrate with email/SMS services)
    const deliveryResults = recipients.map(recipient => ({
      recipient_id: recipient.id,
      recipient_name: recipient.name || (recipient as any).primaryName,
      recipient_email: recipient.email || (recipient as any).primaryEmail,
      recipient_phone: (recipient as any).metadata?.phone || (recipient as any).primaryPhone,
      status: 'sent',
      sent_at: new Date().toISOString(),
    }));

    await auditService.logBinderEvent({
      action: 'tenant.notification.send',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'send_notification',
        resource: `notification:${notificationId}`,
        meta: { 
          recipient_type: payload.recipient_type,
          notification_type: payload.notification_type,
          subject: payload.subject,
          priority: payload.priority,
          recipient_count: recipients.length 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: notificationId,
        version: 1,
      },
      notification: {
        id: notificationId,
        recipient_type: payload.recipient_type,
        notification_type: payload.notification_type,
        subject: payload.subject,
        message: payload.message,
        priority: payload.priority,
        recipient_count: recipients.length,
        scheduled_at: payload.scheduled_at,
        sent_at: new Date().toISOString(),
        status: 'sent',
      },
      delivery_results: deliveryResults,
      audit_id: `AUD-${notificationId}`,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to send notification',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
