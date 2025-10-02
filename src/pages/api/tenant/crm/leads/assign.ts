import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AssignLeadSchema = z.object({
  leadId: z.string().min(1),
  ownerId: z.string().min(1),
});

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const orgId = req.headers['x-org-id'] as string;
  const userId = req.headers['x-user-id'] as string;

  if (!orgId || !userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${method} not allowed` });
    return;
  }

  try {
    const validated = AssignLeadSchema.parse(req.body);

    // Verify lead exists and belongs to org
    const lead = await prisma.lead.findFirst({
      where: {
        id: validated.leadId,
        orgId,
      },
    });

    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Verify new owner exists and belongs to org
    const owner = await prisma.user.findFirst({
      where: {
        id: validated.ownerId,
        orgId,
      },
    });

    if (!owner) {
      res.status(404).json({ error: 'Owner not found' });
      return;
    }

    // Update lead owner
    const updatedLead = await prisma.lead.update({
      where: {
        id: validated.leadId,
      },
      data: {
        ownerId: validated.ownerId,
      },
    });

    // Create audit log
    await prisma.auditLog2.create({
      data: {
        orgId,
        userId,
        action: 'assign',
        resource: `lead:${validated.leadId}`,
        meta: {
          previousOwnerId: lead.ownerId,
          newOwnerId: validated.ownerId,
          assignedAt: new Date().toISOString(),
        },
      },
    });

    res.status(200).json({
      success: true,
      lead: updatedLead,
    });
    return;
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }

    console.error('Lead assign error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

