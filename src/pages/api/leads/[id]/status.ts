import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { assertPermission } from '../../../../lib/rbac';
import { LeadStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const leadId = req.query.id as string;
    
    // Verify user has permission to access this lead
    const lead = await prisma.lead.findFirst({
      where: {
        AND: [
          { orgId: user.orgId },
          { OR: [{ id: leadId }, { publicId: leadId }] }
        ]
      }
    });

    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead not found' });
    }

    if (req.method === 'PATCH') {
      // Update lead status
      if (!(await assertPermission(req, res, 'lead:update'))) {
        return; // assertPermission already sent the response
      }

      const { status } = req.body;

      // Validate status
      if (!status) {
        return res.status(400).json({ ok: false, error: 'Status is required' });
      }

      if (!Object.values(LeadStatus).includes(status)) {
        return res.status(400).json({ ok: false, error: 'Invalid status' });
      }

      // Special handling for conversion
      const updateData: any = { status };
      if (status === 'WON' || status === 'CONVERTED') {
        updateData.convertedAt = new Date();
      }

      const updatedLead = await prisma.lead.update({
        where: { id: lead.id },
        data: updateData,
        select: {
          id: true,
          publicId: true,
          status: true,
          convertedAt: true
        }
      });

      // Log status change activity
      await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          orgId: user.orgId,
          userId: user.id,
          type: 'STATUS_CHANGED',
          title: `Status changed to ${status}`,
          description: `Lead status updated from ${lead.status} to ${status}`
        }
      });

      return res.status(200).json({ ok: true, lead: updatedLead });
    }

    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Lead status update error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}