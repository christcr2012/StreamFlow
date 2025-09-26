// src/pages/api/leads/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS, getOrgIdFromReq } from "@/lib/rbac";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    // Check permissions
    if (!(await assertPermission(req, res, PERMS.LEAD_READ))) return;

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing lead ID' });
    }

    // Find lead by either internal ID or publicId
    const lead = await db.lead.findFirst({
      where: {
        orgId,
        OR: [
          { id },
          { publicId: id }
        ]
      },
      select: {
        id: true,
        publicId: true,
        sourceType: true,
        sourceDetail: true,
        company: true,
        contactName: true,
        email: true,
        phoneE164: true,
        serviceCode: true,
        postalCode: true,
        zip: true,
        aiScore: true,
        systemGenerated: true,
        convertedAt: true,
        status: true,
        createdAt: true,
        notes: true,
        enrichmentJson: true,
      }
    });

    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead not found' });
    }

    return res.status(200).json({
      ok: true,
      lead
    });

  } catch (error: any) {
    console.error('Lead fetch error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to fetch lead' 
    });
  }
}