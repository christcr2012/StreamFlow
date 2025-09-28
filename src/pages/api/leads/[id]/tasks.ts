import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth-helpers';
import { assertPermission } from '../../../../lib/rbac';
import { TaskPriority, TaskStatus } from '@prisma/client';

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
      // Get tasks for this lead
      if (!(await assertPermission(req, res, 'lead:read'))) {
        return; // assertPermission already sent the response
      }

      const tasks = await prisma.leadTask.findMany({
        where: { leadId: lead.id },
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          },
          creator: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: [
          { status: 'asc' }, // PENDING first, then COMPLETED
          { dueDate: 'asc' }, // Earliest due dates first
          { priority: 'desc' } // URGENT first
        ]
      });

      return res.status(200).json({ ok: true, tasks });
    }

    if (req.method === 'POST') {
      // Create new task
      if (!(await assertPermission(req, res, 'lead:create'))) {
        return; // assertPermission already sent the response
      }

      const {
        title,
        description,
        priority = 'MEDIUM',
        assignedTo,
        dueDate,
        reminderAt
      } = req.body;

      // Validate required fields
      if (!title) {
        return res.status(400).json({ ok: false, error: 'Title is required' });
      }

      // Validate priority
      if (!Object.values(TaskPriority).includes(priority)) {
        return res.status(400).json({ ok: false, error: 'Invalid priority' });
      }

      // Default assignee to current user if not specified
      const taskAssignedTo = assignedTo || user.id;

      // Validate assignee exists in the organization
      const assignee = await prisma.user.findFirst({
        where: {
          id: taskAssignedTo,
          orgId: user.orgId
        }
      });

      if (!assignee) {
        return res.status(400).json({ ok: false, error: 'Invalid assignee' });
      }

      const task = await prisma.leadTask.create({
        data: {
          leadId: lead.id,
          orgId: user.orgId,
          assignedTo: taskAssignedTo,
          createdBy: user.id,
          title,
          description,
          priority,
          dueDate: dueDate ? new Date(dueDate) : null,
          reminderAt: reminderAt ? new Date(reminderAt) : null
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true }
          },
          creator: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      return res.status(201).json({ ok: true, task });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Lead tasks error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}