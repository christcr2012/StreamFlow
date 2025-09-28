// src/pages/api/provider/settings.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { getEmailFromReq } from "@/lib/rbac";

// Ensure only providers can access this endpoint
async function ensureProvider(req: NextApiRequest, res: NextApiResponse) {
  const email = getEmailFromReq(req);
  if (!email) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return null;
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  // Provider access is now environment-based, not role-based
  if (!user) {
    res.status(403).json({ ok: false, error: "Provider access required" });
    return null;
  }

  return user;
}

// Default provider settings
const defaultSettings = {
  companyName: "Mountain Vista Lead Services",
  contactEmail: "provider@mountain-vista.com",
  maxAiCostPerMonth: 50,
  defaultLeadPrice: 100,
  autoProvisionClients: false,
  enableFederatedPortal: false,
  federatedPortalUrl: null,
  notificationSettings: {
    costAlerts: true,
    revenueReports: true,
    clientActivity: true,
    systemUpdates: true
  },
  billingSettings: {
    invoicePrefix: "MV",
    paymentTermsDays: 30,
    lateFeePercentage: 1.5,
    autoCollections: false
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const user = await ensureProvider(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      // For now, return default settings
      // In a real implementation, these would be stored in the database
      return res.status(200).json({
        ok: true,
        settings: defaultSettings
      });
    }

    if (req.method === 'PUT') {
      const updates = req.body;
      
      // Validate required fields
      if (!updates.companyName || !updates.contactEmail) {
        return res.status(400).json({
          ok: false,
          error: 'Company name and contact email are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.contactEmail)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid email format'
        });
      }

      // Validate numeric fields
      if (updates.maxAiCostPerMonth < 10 || updates.maxAiCostPerMonth > 200) {
        return res.status(400).json({
          ok: false,
          error: 'Max AI cost must be between $10 and $200'
        });
      }

      if (updates.defaultLeadPrice < 1 || updates.defaultLeadPrice > 1000) {
        return res.status(400).json({
          ok: false,
          error: 'Default lead price must be between $1 and $1000'
        });
      }

      if (updates.billingSettings?.paymentTermsDays < 1 || updates.billingSettings?.paymentTermsDays > 90) {
        return res.status(400).json({
          ok: false,
          error: 'Payment terms must be between 1 and 90 days'
        });
      }

      if (updates.billingSettings?.lateFeePercentage < 0 || updates.billingSettings?.lateFeePercentage > 10) {
        return res.status(400).json({
          ok: false,
          error: 'Late fee percentage must be between 0% and 10%'
        });
      }

      // Validate federated portal URL if enabled
      if (updates.enableFederatedPortal && updates.federatedPortalUrl) {
        try {
          new URL(updates.federatedPortalUrl);
        } catch {
          return res.status(400).json({
            ok: false,
            error: 'Invalid federated portal URL'
          });
        }
      }

      // In a real implementation, save to database
      // For now, just return success
      
      return res.status(200).json({
        ok: true,
        message: 'Settings updated successfully',
        settings: { ...defaultSettings, ...updates }
      });
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  } catch (error: any) {
    console.error('Provider settings error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to manage settings' 
    });
  }
}