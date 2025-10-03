import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Appointment Management
const CreateAppointmentSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    customer_id: z.string(),
    appointment_type: z.enum(['consultation', 'estimate', 'service', 'follow_up', 'inspection']),
    title: z.string(),
    description: z.string().optional(),
    scheduled_date: z.string(),
    duration_minutes: z.number().positive().default(60),
    assigned_to: z.string(),
    location: z.object({
      type: z.enum(['customer_site', 'office', 'remote']),
      address: z.string().optional(),
    }),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    reminder_minutes: z.number().positive().default(30),
    notes: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateAppointmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['EMPLOYEE', 'MANAGER', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    // Validate customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: payload.customer_id, orgId },
    });

    if (!customer) {
      return res.status(404).json({
        error: 'CUSTOMER_NOT_FOUND',
        message: 'Customer not found',
      });
    }

    // Validate assigned user exists
    const assignedUser = await prisma.user.findFirst({
      where: { id: payload.assigned_to, orgId },
    });

    if (!assignedUser) {
      return res.status(404).json({
        error: 'ASSIGNED_USER_NOT_FOUND',
        message: 'Assigned user not found',
      });
    }

    // Check for scheduling conflicts
    const scheduledDate = new Date(payload.scheduled_date);
    const endTime = new Date(scheduledDate.getTime() + (payload.duration_minutes * 60 * 1000));

    const conflictingAppointments = await prisma.note.findMany({
      where: {
        orgId,
        entityType: 'appointment',
        userId: payload.assigned_to,
        createdAt: {
          gte: new Date(scheduledDate.getTime() - (60 * 60 * 1000)), // 1 hour buffer
          lte: new Date(endTime.getTime() + (60 * 60 * 1000)), // 1 hour buffer
        },
      },
    });

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({
        error: 'SCHEDULING_CONFLICT',
        message: 'Assigned user has conflicting appointments',
        conflicts: conflictingAppointments.length,
      });
    }

    const appointmentNumber = `APT-${Date.now()}`;

    const appointment = await prisma.note.create({
      data: {
        orgId,
        entityType: 'appointment',
        entityId: appointmentNumber,
        userId: payload.assigned_to,
        body: `APPOINTMENT: ${payload.title} - ${payload.description} (${payload.appointment_type}) - ${payload.scheduled_date}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.appointment.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_appointment',
        resource: `appointment:${appointment.id}`,
        meta: { 
          customer_id: payload.customer_id,
          appointment_type: payload.appointment_type,
          title: payload.title,
          scheduled_date: payload.scheduled_date,
          duration_minutes: payload.duration_minutes,
          assigned_to: payload.assigned_to 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `APT-${appointment.id.substring(0, 6)}`,
        version: 1,
      },
      appointment: {
        id: appointment.id,
        appointment_number: appointmentNumber,
        customer_id: payload.customer_id,
        customer_name: customer.primaryName || customer.company || 'Unknown',
        appointment_type: payload.appointment_type,
        title: payload.title,
        description: payload.description,
        scheduled_date: payload.scheduled_date,
        duration_minutes: payload.duration_minutes,
        assigned_to: payload.assigned_to,
        assigned_to_name: assignedUser.name,
        location: payload.location,
        priority: payload.priority,
        reminder_minutes: payload.reminder_minutes,
        notes: payload.notes,
        status: 'scheduled',
        created_at: appointment.createdAt.toISOString(),
      },
      audit_id: `AUD-APT-${appointment.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create appointment',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
