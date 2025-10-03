import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience } from '@/middleware/audience';
import { withIdempotency } from '@/middleware/idempotency';
import { auditService } from '@/lib/auditService';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// BINDER5_FULL.md Compliance Management
const CreateComplianceRecordSchema = z.object({
  request_id: z.string().uuid(),
  tenant_id: z.string(),
  bu_id: z.string().optional(),
  actor: z.object({
    user_id: z.string(),
    role: z.string(),
  }),
  payload: z.object({
    compliance_type: z.enum(['safety', 'environmental', 'regulatory', 'certification', 'audit']),
    title: z.string(),
    description: z.string(),
    regulation_reference: z.string().optional(),
    compliance_status: z.enum(['compliant', 'non_compliant', 'pending_review', 'in_progress']),
    due_date: z.string().optional(),
    responsible_person: z.string(),
    department: z.string().optional(),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    remediation_plan: z.string().optional(),
    evidence_documents: z.array(z.string()).default([]),
    review_frequency: z.enum(['monthly', 'quarterly', 'annually', 'as_needed']).default('annually'),
    last_review_date: z.string().optional(),
    next_review_date: z.string().optional(),
  }),
  idempotency_key: z.string().uuid(),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orgId = req.headers['x-org-id'] as string || 'org_test';
    const validation = CreateComplianceRecordSchema.safeParse(req.body);
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
        message: 'Only managers and owners can create compliance records',
      });
    }

    // Validate responsible person exists
    const responsiblePerson = await prisma.user.findFirst({
      where: { id: payload.responsible_person, orgId },
    });

    if (!responsiblePerson) {
      return res.status(404).json({
        error: 'RESPONSIBLE_PERSON_NOT_FOUND',
        message: 'Responsible person not found',
      });
    }

    // Validate due date if provided
    if (payload.due_date) {
      const dueDate = new Date(payload.due_date);
      if (dueDate <= new Date()) {
        return res.status(422).json({
          error: 'INVALID_DUE_DATE',
          message: 'Due date must be in the future',
        });
      }
    }

    const complianceId = `CMP-${Date.now()}`;

    const complianceRecord = await prisma.note.create({
      data: {
        orgId,
        entityType: 'compliance',
        entityId: complianceId,
        userId: actor.user_id,
        body: `COMPLIANCE: ${payload.title} - ${payload.description} (${payload.compliance_type}, ${payload.compliance_status})`,
        isPinned: true,
      },
    });

    await auditService.logBinderEvent({
      action: 'tenant.compliance.create',
      tenantId: orgId,
      path: req.url,
      ts: Date.now(),
    });

    await prisma.auditLog2.create({
      data: {
        orgId,
        userId: actor.user_id,
        role: actor.role.toLowerCase(),
        action: 'create_compliance_record',
        resource: `compliance:${complianceRecord.id}`,
        meta: { 
          compliance_type: payload.compliance_type,
          title: payload.title,
          compliance_status: payload.compliance_status,
          responsible_person: payload.responsible_person,
          risk_level: payload.risk_level,
          due_date: payload.due_date 
        },
      },
    });

    return res.status(200).json({
      status: 'ok',
      result: {
        id: `CMP-${complianceRecord.id.substring(0, 6)}`,
        version: 1,
      },
      compliance_record: {
        id: complianceRecord.id,
        compliance_id: complianceId,
        compliance_type: payload.compliance_type,
        title: payload.title,
        description: payload.description,
        regulation_reference: payload.regulation_reference,
        compliance_status: payload.compliance_status,
        due_date: payload.due_date,
        responsible_person: payload.responsible_person,
        responsible_person_name: responsiblePerson.name,
        department: payload.department,
        risk_level: payload.risk_level,
        remediation_plan: payload.remediation_plan,
        evidence_documents: payload.evidence_documents,
        review_frequency: payload.review_frequency,
        last_review_date: payload.last_review_date,
        next_review_date: payload.next_review_date,
        created_at: complianceRecord.createdAt.toISOString(),
      },
      audit_id: `AUD-CMP-${complianceRecord.id.substring(0, 6)}`,
    });
  } catch (error) {
    console.error('Error creating compliance record:', error);
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create compliance record',
    });
  }
}

export default withAudience('tenant', withIdempotency({ headerName: 'X-Idempotency-Key' }, handler));
