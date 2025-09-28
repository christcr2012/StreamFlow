import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { assertPermission } from '../../../../lib/rbac';
import { ActivityType } from '@prisma/client';

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

    if (req.method === 'GET') {
      // Get activities for this lead
      if (!(await assertPermission(req, res, 'lead:read'))) {
        return; // assertPermission already sent the response
      }

      const activities = await prisma.leadActivity.findMany({
        where: { leadId: lead.id },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return res.status(200).json({ ok: true, activities });
    }

    if (req.method === 'POST') {
      // Create new activity
      if (!(await assertPermission(req, res, 'lead:update'))) {
        return; // assertPermission already sent the response
      }

      const {
        type,
        title,
        description,
        scheduledAt,
        completedAt,
        contactMethod,
        duration,
        attachments
      } = req.body;

      // Validate required fields
      if (!type || !title) {
        return res.status(400).json({ ok: false, error: 'Type and title are required' });
      }

      // Validate activity type
      if (!Object.values(ActivityType).includes(type)) {
        return res.status(400).json({ ok: false, error: 'Invalid activity type' });
      }

      const activity = await prisma.leadActivity.create({
        data: {
          leadId: lead.id,
          orgId: user.orgId,
          userId: user.id,
          type,
          title,
          description,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          completedAt: completedAt ? new Date(completedAt) : null,
          contactMethod,
          duration: duration ? parseInt(duration) : null,
          attachments
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return res.status(201).json({ ok: true, activity });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Lead activities error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}