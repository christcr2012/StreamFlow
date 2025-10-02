import type { NextApiRequest, NextApiResponse } from 'next';
import { withAudience, AUDIENCE } from '@/middleware/withAudience';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MergeLeadsSchema = z.object({
  winningId: z.string().min(1),
  losingId: z.string().min(1),
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
    const validated = MergeLeadsSchema.parse(req.body);

    // Verify both leads exist and belong to org
    const [winningLead, losingLead] = await Promise.all([
      prisma.lead.findFirst({
        where: { id: validated.winningId, orgId },
      }),
      prisma.lead.findFirst({
        where: { id: validated.losingId, orgId },
      }),
    ]);

    if (!winningLead) {
      res.status(404).json({ error: 'Winning lead not found' });
      return;
    }

    if (!losingLead) {
      res.status(404).json({ error: 'Losing lead not found' });
      return;
    }

    if (validated.winningId === validated.losingId) {
      res.status(400).json({ error: 'Cannot merge a lead with itself' });
      return;
    }

    // Perform merge in a transaction
    await prisma.$transaction(async (tx) => {
      // Update activities to point to winning lead
      await tx.leadActivity.updateMany({
        where: {
          leadId: validated.losingId,
          orgId,
        },
        data: {
          leadId: validated.winningId,
        },
      });

      // Update tasks to point to winning lead
      await tx.leadTask.updateMany({
        where: {
          leadId: validated.losingId,
          orgId,
        },
        data: {
          leadId: validated.winningId,
        },
      });

      // Update notes to point to winning lead
      await tx.note.updateMany({
        where: {
          entityType: 'lead',
          entityId: validated.losingId,
          orgId,
        },
        data: {
          entityId: validated.winningId,
        },
      });

      // Update attachments to point to winning lead
      await tx.attachment.updateMany({
        where: {
          entityType: 'lead',
          entityId: validated.losingId,
          orgId,
        },
        data: {
          entityId: validated.winningId,
        },
      });

      // Merge data from losing lead into winning lead
      // Keep winning lead's data, but fill in any missing fields from losing lead
      const updateData: any = {};
      
      if (!winningLead.email && losingLead.email) {
        updateData.email = losingLead.email;
      }
      if (!winningLead.phoneE164 && losingLead.phoneE164) {
        updateData.phoneE164 = losingLead.phoneE164;
      }
      if (!winningLead.company && losingLead.company) {
        updateData.company = losingLead.company;
      }
      if (!winningLead.website && losingLead.website) {
        updateData.website = losingLead.website;
      }

      // Update winning lead if we have any data to merge
      if (Object.keys(updateData).length > 0) {
        await tx.lead.update({
          where: { id: validated.winningId },
          data: updateData,
        });
      }

      // Archive the losing lead
      await tx.lead.update({
        where: { id: validated.losingId },
        data: {
          archived: true,
        },
      });

      // Create audit log
      await tx.auditLog2.create({
        data: {
          orgId,
          userId,
          action: 'merge',
          resource: `lead:${validated.winningId}`,
          meta: {
            losingLeadId: validated.losingId,
            mergedAt: new Date().toISOString(),
          },
        },
      });
    });

    // Fetch updated winning lead
    const updatedLead = await prisma.lead.findFirst({
      where: { id: validated.winningId, orgId },
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

    console.error('Lead merge error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
}

export default withAudience(AUDIENCE.CLIENT_ONLY, handler);

