// src/pages/api/rfp/attach.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS, getOrgIdFromReq } from "@/lib/rbac";

interface AttachRFPRequest {
  leadId: string;
  parsedData: {
    scope: string;
    dueDate: string | null;
    walkthrough: string | null;
    insurance: string | null;
    bond: string | null;
    checklist: string[];
    summary: string;
    talkingPoints: string[];
    originalText: string;
    filename: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    // Check permissions
    if (!(await assertPermission(req, res, PERMS.LEAD_UPDATE))) return;

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "Missing org" });

    const { leadId, parsedData }: AttachRFPRequest = req.body;

    if (!leadId || !parsedData) {
      return res.status(400).json({ ok: false, error: 'Missing leadId or parsedData' });
    }

    // Verify lead exists and belongs to org
    const lead = await db.lead.findFirst({
      where: { id: leadId, orgId },
      select: { id: true, enrichmentJson: true }
    });

    if (!lead) {
      return res.status(404).json({ ok: false, error: 'Lead not found' });
    }

    // Update lead with RFP analysis
    const updatedEnrichment = {
      ...(lead.enrichmentJson as any || {}),
      rfpAnalysis: {
        ...parsedData,
        attachedAt: new Date().toISOString(),
        version: "1.0"
      }
    };

    await db.lead.update({
      where: { id: leadId },
      data: {
        enrichmentJson: updatedEnrichment,
        // Update notes to include RFP summary if no existing notes
        notes: lead.enrichmentJson && (lead.enrichmentJson as any).notes 
          ? undefined 
          : `RFP Analysis: ${parsedData.summary}`
      }
    });

    return res.status(200).json({
      ok: true,
      message: 'RFP analysis attached to lead successfully'
    });

  } catch (error: any) {
    console.error('RFP attach error:', error);
    return res.status(500).json({ 
      ok: false, 
      error: error.message || 'Failed to attach RFP analysis' 
    });
  }
}