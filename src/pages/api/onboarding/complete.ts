/**
 * Module: Complete Onboarding API
 * Purpose: Save onboarding data and mark as complete
 * Scope: POST /api/onboarding/complete
 * Notes: Codex Phase 6 - Complete onboarding
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth/guard';
import { consolidatedAudit } from '@/lib/consolidated-audit';

interface OnboardingData {
  welcome?: any;
  branding?: {
    logo?: string;
    primaryColor?: string;
  };
  hours?: Record<string, { open: string; close: string; closed: boolean }>;
  team?: any;
  modules?: any;
}

/**
 * POST /api/onboarding/complete
 * Saves onboarding data and marks organization as onboarded
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only owners can complete onboarding
    if (!session.isOwner) {
      return res.status(403).json({ error: 'Only organization owners can complete onboarding' });
    }

    const { orgId } = session;
    const data: OnboardingData = req.body;

    // Get current settings
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        settingsJson: true,
        brandConfig: true,
      },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Merge onboarding data into settings
    const currentSettings = (org.settingsJson as any) || {};
    const currentBrand = (org.brandConfig as any) || {};

    const updatedSettings = {
      ...currentSettings,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date().toISOString(),
      businessHours: data.hours || currentSettings.businessHours,
    };

    const updatedBrand = {
      ...currentBrand,
      logo: data.branding?.logo || currentBrand.logo,
      primaryColor: data.branding?.primaryColor || currentBrand.primaryColor,
    };

    // Update organization
    await prisma.org.update({
      where: { id: orgId },
      data: {
        settingsJson: updatedSettings,
        brandConfig: updatedBrand,
      },
    });

    // Audit log
    await consolidatedAudit.logSystemAdmin(
      'Onboarding completed',
      session.email,
      'CLIENT',
      'ONBOARDING_COMPLETE',
      {},
      {
        hasLogo: !!data.branding?.logo,
        hasHours: !!data.hours,
        userId: session.id,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PR-CHECKS:
// - [x] POST /api/onboarding/complete implemented
// - [x] Owner-only access
// - [x] Saves branding and hours to org
// - [x] Marks onboarding as complete
// - [x] Audit logging

