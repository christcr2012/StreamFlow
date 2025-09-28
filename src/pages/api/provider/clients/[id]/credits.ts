// Provider Client Credits API - Add credits to client accounts
// Referenced: javascript_stripe integration for subscription management

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
// Using middleware for auth - will work with existing session system

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple auth check - Provider portal access
    const cookies = req.headers.cookie;
    if (!cookies?.includes('ws_user')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get userId from session for audit log
    const userId = 'provider-admin'; // TODO: Extract from session

    const { id: clientId } = req.query;
    const { credits } = req.body;

    if (!clientId || typeof clientId !== 'string') {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    if (!credits || typeof credits !== 'number' || credits <= 0) {
      return res.status(400).json({ error: 'Invalid credits amount' });
    }

    // Get the organization
    const org = await prisma.org.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, aiCreditBalance: true }
    });

    if (!org) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Add credits to the organization
    const updatedOrg = await prisma.org.update({
      where: { id: clientId },
      data: {
        aiCreditBalance: {
          increment: credits
        }
      },
      select: {
        aiCreditBalance: true
      }
    });

    // Log the credit addition for audit purposes
    await prisma.auditLog.create({
      data: {
        orgId: clientId,
        actorId: userId,
        action: 'CREDITS_ADDED',
        entityType: 'Org',
        entityId: clientId,
        delta: {
          creditsAdded: credits,
          newBalance: updatedOrg.aiCreditBalance,
          addedBy: 'Provider',
          ipAddress: req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Added ${credits.toLocaleString()} credits to ${org.name}`,
      newBalance: updatedOrg.aiCreditBalance
    });

  } catch (error) {
    console.error('Add credits API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add credits' 
    });
  }
}