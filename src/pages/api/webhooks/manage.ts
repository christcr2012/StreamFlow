/**
 * 🔔 WEBHOOK MANAGEMENT API
 * CRUD operations for webhook endpoints
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth-helpers';
import { webhookSystem } from '@/lib/webhook-system';
import { prisma as db } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authenticate user
    const user = await requireAuth(req, res);
    if (!user) return;

    switch (req.method) {
      case 'GET':
        return await handleGetWebhooks(req, res, user.orgId);
      case 'POST':
        return await handleCreateWebhook(req, res, user.orgId);
      case 'PUT':
        return await handleUpdateWebhook(req, res, user.orgId);
      case 'DELETE':
        return await handleDeleteWebhook(req, res, user.orgId);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Webhook management error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get all webhook endpoints for organization
 */
async function handleGetWebhooks(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  const webhooks = await db.webhookEndpoint.findMany({
    where: { orgId },
    include: {
      deliveries: {
        orderBy: { createdAt: 'desc' },
        take: 10, // Last 10 deliveries
      },
    },
  });

  // Get webhook statistics
  const stats = await webhookSystem.getWebhookStats(orgId);

  return res.status(200).json({
    webhooks,
    stats,
  });
}

/**
 * Create new webhook endpoint
 */
async function handleCreateWebhook(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  const { url, events } = req.body;

  if (!url || !events || !Array.isArray(events)) {
    return res.status(400).json({ error: 'URL and events array are required' });
  }

  try {
    const webhook = await webhookSystem.registerWebhook(orgId, url, events);
    return res.status(201).json({ webhook });
  } catch (error) {
    return res.status(400).json({ error: (error as Error).message });
  }
}

/**
 * Update webhook endpoint
 */
async function handleUpdateWebhook(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  const { id, url, events, active } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Webhook ID is required' });
  }

  // Verify webhook belongs to organization
  const existingWebhook = await db.webhookEndpoint.findFirst({
    where: { id, orgId },
  });

  if (!existingWebhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  const webhook = await db.webhookEndpoint.update({
    where: { id },
    data: {
      ...(url && { url }),
      ...(events && { events }),
      ...(typeof active === 'boolean' && { active }),
      updatedAt: new Date(),
    },
  });

  return res.status(200).json({ webhook });
}

/**
 * Delete webhook endpoint
 */
async function handleDeleteWebhook(req: NextApiRequest, res: NextApiResponse, orgId: string) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Webhook ID is required' });
  }

  // Verify webhook belongs to organization
  const existingWebhook = await db.webhookEndpoint.findFirst({
    where: { id, orgId },
  });

  if (!existingWebhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  await db.webhookEndpoint.delete({
    where: { id },
  });

  return res.status(200).json({ success: true });
}
