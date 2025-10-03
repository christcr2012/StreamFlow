import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    message_type: z.enum(['text', 'photo', 'voice', 'location']).default('text'),
    message_content: z.string().min(1),
    recipient_type: z.enum(['dispatch', 'customer', 'team', 'manager']).default('dispatch'),
    attachments: z.array(z.string()).optional(),
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

    const validation = ChatMessageSchema.safeParse(req.body);
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

    // Create chat message using Note model
    const chatMessage = await prisma.note.create({
      data: {
        orgId,
        entityType: 'workorder',
        entityId: workOrderId,
        userId,
        body: `CHAT [${payload.recipient_type.toUpperCase()}] ${payload.message_type}: ${payload.message_content}${payload.attachments?.length ? ` (${payload.attachments.length} attachments)` : ''}`,
        isPinned: payload.recipient_type === 'manager' || payload.message_type === 'voice',
      },
    });

    // In a real implementation, you would:
    // 1. Route message to appropriate recipient(s)
    // 2. Send push notifications
    // 3. Store in real-time chat system
    // 4. Handle file uploads for attachments

    await auditService.logBinderEvent({
      action: 'workorder.chat.send',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'send_chat',
        resource: `workorder:${workOrderId}`,
        meta: {
          message_type: payload.message_type,
          recipient_type: payload.recipient_type,
          message_length: payload.message_content.length,
          attachments_count: payload.attachments?.length || 0,
          location: payload.location,
        },
      },
    });

    const messageId = `MSG-${chatMessage.id.substring(0, 6)}`;
    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(201).json({
      status: 'ok',
      result: {
        id: messageId,
        version: 1,
      },
      chat_message: {
        id: messageId,
        work_order_id: workOrderIdFormatted,
        message_type: payload.message_type,
        message_content: payload.message_content,
        recipient_type: payload.recipient_type,
        attachments: payload.attachments,
        status: 'SENT',
        sent_by: userId,
        sent_at: chatMessage.createdAt,
        location: payload.location,
      },
      audit_id: `AUD-MSG-${chatMessage.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to send chat message',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
