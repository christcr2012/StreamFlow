import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Button 7: DVIR — Time Clock (Drive) (line 902)
const TimeClockDriveSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    vehicle_id: z.string(),
    started_at: z.string(),
    ended_at: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = TimeClockDriveSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: validation.error.errors,
      });
    }

    const { request_id, payload, idempotency_key, actor } = validation.data;

    if (!['EMPLOYEE', 'MANAGER'].includes(actor.role)) {
      return res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Only employees and managers can log drive time',
      });
    }

    // Validate time range
    const startTime = new Date(payload.started_at);
    const endTime = payload.ended_at ? new Date(payload.ended_at) : null;

    if (endTime && endTime <= startTime) {
      return res.status(422).json({
        error: 'INVALID_TIME_RANGE',
        message: 'End time must be after start time',
      });
    }

    const driveTimeId = `DRV-${Date.now()}`;

    const driveTime = await prisma.note.create({
      data: {
        orgId,
        entityType: 'drive_time',
        entityId: driveTimeId,
        userId: actor.user_id,
        body: `DRIVE TIME: Vehicle ${payload.vehicle_id} - ${payload.started_at} to ${payload.ended_at || 'ongoing'}`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'field.fleet.time_clock_drive',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'log_drive_time',
        resource: `drive_time:${driveTime.id}`,
        meta: { 
          vehicle_id: payload.vehicle_id,
          started_at: payload.started_at,
          ended_at: payload.ended_at,
          duration_minutes: endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : null 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `DVI-${driveTime.id.substring(0, 6)}`,
        version: 1,
      },
      drive_time: {
        id: driveTime.id,
        drive_time_id: driveTimeId,
        vehicle_id: payload.vehicle_id,
        driver_id: actor.user_id,
        started_at: payload.started_at,
        ended_at: payload.ended_at,
        duration_minutes: endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 60000) : null,
        status: payload.ended_at ? 'completed' : 'in_progress',
        created_at: driveTime.createdAt.toISOString(),
      },
      audit_id: `AUD-DVI-${driveTime.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error logging drive time:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to log drive time',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
