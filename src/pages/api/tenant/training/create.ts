import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Training Management
const CreateTrainingSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    title: z.string(),
    description: z.string(),
    training_type: z.enum(['safety', 'technical', 'compliance', 'soft_skills', 'certification']),
    delivery_method: z.enum(['in_person', 'online', 'hybrid', 'self_paced']),
    instructor: z.string().optional(),
    duration_hours: z.number().positive(),
    max_participants: z.number().positive().optional(),
    prerequisites: z.array(z.string()).default([]),
    learning_objectives: z.array(z.string()),
    materials: z.array(z.object({
      type: z.enum(['document', 'video', 'presentation', 'quiz', 'hands_on']),
      title: z.string(),
      url: z.string().optional(),
      required: z.boolean().default(true),
    })).default([]),
    certification_provided: z.boolean().default(false),
    certification_valid_months: z.number().positive().optional(),
    cost_per_participant: z.number().min(0).default(0),
    scheduled_sessions: z.array(z.object({
      start_date: z.string(),
      end_date: z.string(),
      location: z.string().optional(),
      max_participants: z.number().positive().optional(),
    })).default([]),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateTrainingSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create training programs',
      });
    }

    // Validate instructor exists if provided
    let instructor = null;
    if (payload.instructor) {
      instructor = await prisma.user.findFirst({
        where: { id: payload.instructor, orgId },
      });

      if (!instructor) {
        return res.status(404).json({
          error: 'INSTRUCTOR_NOT_FOUND',
          message: 'Instructor not found',
        });
      }
    }

    // Validate learning objectives
    if (payload.learning_objectives.length === 0) {
      return res.status(400).json({
        error: 'MISSING_LEARNING_OBJECTIVES',
        message: 'Training must have at least one learning objective',
      });
    }

    const trainingId = `TRN-${Date.now()}`;

    const training = await prisma.note.create({
      data: {
        orgId,
        entityType: 'training',
        entityId: trainingId,
        userId: actor.user_id,
        body: `TRAINING: ${payload.title} - ${payload.description} (${payload.training_type}, ${payload.duration_hours}h)`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.training.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_training',
        resource: `training:${training.id}`,
        meta: { 
          title: payload.title,
          training_type: payload.training_type,
          delivery_method: payload.delivery_method,
          duration_hours: payload.duration_hours,
          instructor: payload.instructor,
          certification_provided: payload.certification_provided 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `TRN-${training.id.substring(0, 6)}`,
        version: 1,
      },
      training: {
        id: training.id,
        training_id: trainingId,
        title: payload.title,
        description: payload.description,
        training_type: payload.training_type,
        delivery_method: payload.delivery_method,
        instructor: payload.instructor,
        instructor_name: instructor?.name || null,
        duration_hours: payload.duration_hours,
        max_participants: payload.max_participants,
        prerequisites: payload.prerequisites,
        learning_objectives: payload.learning_objectives,
        materials: payload.materials,
        materials_count: payload.materials.length,
        certification_provided: payload.certification_provided,
        certification_valid_months: payload.certification_valid_months,
        cost_per_participant: payload.cost_per_participant,
        scheduled_sessions: payload.scheduled_sessions,
        sessions_count: payload.scheduled_sessions.length,
        status: 'draft',
        created_at: training.createdAt.toISOString(),
      },
      audit_id: `AUD-TRN-${training.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating training:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create training',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
