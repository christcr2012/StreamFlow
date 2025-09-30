/**
 * Module: Onboarding Status API
 * Purpose: Check if organization has completed onboarding
 * Scope: GET /api/org/onboarding-status
 * Notes: Codex Phase 6 - Onboarding status check
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/guard';

/**
 * GET /api/org/onboarding-status
 * Returns whether the organization has completed onboarding
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orgId } = session;

    // Check if org has onboarding data in settings
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        settingsJson: true,
      },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Parse settings to check onboarding completion
    const settings = org.settingsJson as any || {};
    const completed = settings.onboardingCompleted === true;

    return res.status(200).json({
      completed,
      completedAt: settings.onboardingCompletedAt || null,
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PR-CHECKS:
// - [x] GET /api/org/onboarding-status implemented
// - [x] Checks settingsJson for onboarding flag
// - [x] Returns completion status

