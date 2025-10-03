import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const NavigateSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    work_order_id: z.string(),
    navigation_type: z.enum(['customer', 'parts_supplier', 'office', 'next_job']).default('customer'),
    current_location: z.object({
      lat: z.number(),
      lng: z.number(),
      accuracy: z.number().optional(),
    }),
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

    const validation = NavigateSchema.safeParse(req.body);
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
      include: {
        assignments: true,
        jobSite: true,
      },
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

    // Get destination based on navigation type
    let destination;
    let navigationUrl;

    switch (payload.navigation_type) {
      case 'customer':
        const jobSite = workOrder.jobSite;
        destination = {
          lat: jobSite?.latitude ? Number(jobSite.latitude) : 0,
          lng: jobSite?.longitude ? Number(jobSite.longitude) : 0,
          address: jobSite?.address || 'Customer Location',
        };
        break;
      case 'office':
        // Default office location - in real app this would come from org settings
        destination = {
          lat: 40.7128,
          lng: -74.0060,
          address: 'Main Office',
        };
        break;
      case 'parts_supplier':
        // Default parts supplier - in real app this would be configurable
        destination = {
          lat: 40.7589,
          lng: -73.9851,
          address: 'Parts Supplier',
        };
        break;
      case 'next_job':
        // Find next scheduled job for this user
        const nextJob = await prisma.workOrder.findFirst({
          where: {
            orgId,
            assignments: {
              some: {
                employeeId: userId,
                unassignedAt: null,
              },
            },
            status: 'SCHEDULED',
            scheduledStartAt: {
              gt: new Date(),
            },
          },
          include: {
            jobSite: true,
          },
          orderBy: {
            scheduledStartAt: 'asc',
          },
        });

        if (nextJob) {
          const nextJobSite = nextJob.jobSite;
          destination = {
            lat: nextJobSite?.latitude ? Number(nextJobSite.latitude) : 0,
            lng: nextJobSite?.longitude ? Number(nextJobSite.longitude) : 0,
            address: nextJobSite?.address || 'Next Job Location',
          };
        } else {
          destination = {
            lat: 40.7128,
            lng: -74.0060,
            address: 'No next job scheduled',
          };
        }
        break;
    }

    // Generate navigation URL (Google Maps or Apple Maps)
    const isIOS = req.headers['user-agent']?.includes('iPhone') || req.headers['user-agent']?.includes('iPad');
    if (isIOS) {
      navigationUrl = `maps://maps.apple.com/?daddr=${destination.lat},${destination.lng}`;
    } else {
      navigationUrl = `https://maps.google.com/maps?daddr=${destination.lat},${destination.lng}`;
    }

    // Log navigation request
    await prisma.note.create({
      data: {
        orgId,
        entityType: 'workorder',
        entityId: workOrderId,
        userId,
        body: `Navigation requested to ${payload.navigation_type}: ${destination.address}`,
        isPinned: false,
      },
    });

    await auditService.logBinderEvent({
      action: 'workorder.navigate',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: userId,
        role: 'field_tech',
        action: 'navigate',
        resource: `workorder:${workOrderId}`,
        meta: {
          navigation_type: payload.navigation_type,
          destination,
          current_location: payload.current_location,
        },
      },
    });

    const workOrderIdFormatted = `WO-${workOrderId.substring(0, 6)}`;

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `NAV-${Date.now()}`,
        version: 1,
      },
      navigation: {
        work_order_id: workOrderIdFormatted,
        navigation_type: payload.navigation_type,
        destination,
        navigation_url: navigationUrl,
        current_location: payload.current_location,
        requested_at: new Date(),
      },
      audit_id: `AUD-NAV-${workOrderId.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error processing navigation:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to process navigation',
    });
  }
}

export default withAudience(
  'tenant',
  withIdempotency({ headerName: 'X-Idempotency-Key' }, handler)
);
