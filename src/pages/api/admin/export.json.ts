// src/pages/api/admin/export.json.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import type { Prisma, LeadSource, LeadStatus } from "@prisma/client";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { computeWindow, endOfDayUTC, parseLimit, readStringFilter } from "@/lib/reportingWindow";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).end("Method Not Allowed");
    }

    if (!(await assertPermission(req, res, PERMS.LEAD_EXPORT))) return;

    const orgId = await getOrgIdFromReq(req);
    if (!orgId) return res.status(400).json({ ok: false, error: "No org for current user" });

    const { from, to, label } = computeWindow(req.query);
    const statusStr = readStringFilter(req.query, "status");
    const sourceTypeStr = readStringFilter(req.query, "sourceType");
    const status: LeadStatus | undefined = statusStr ? (statusStr.toUpperCase() as LeadStatus) : undefined;
    const sourceType: LeadSource | undefined = sourceTypeStr ? (sourceTypeStr.toUpperCase() as LeadSource) : undefined;
    const limit = parseLimit(req.query, 10000, 100000);

    const where: Prisma.LeadWhereInput = {
      orgId,
      createdAt: { gte: from, lte: endOfDayUTC(to) },
      ...(status ? { status } : {}),
      ...(sourceType ? { sourceType } : {}),
    };

    const items = await db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        publicId: true,
        orgId: true,
        createdAt: true,
        convertedAt: true,
        status: true,
        company: true,
        contactName: true,
        email: true,
        phoneE164: true,
        serviceCode: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        zip: true,
        notes: true,
        sourceType: true,
        sourceDetail: true,
        systemGenerated: true,
        aiScore: true,
        enrichmentJson: true,
      },
    });

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      ok: true,
      count: items.length,
      window: {
        label,
        fromISO: from.toISOString().slice(0, 10),
        toISO: to.toISOString().slice(0, 10),
      },
      filters: { status: status ?? null, sourceType: sourceType ?? null, limit },
      items,
    });
  } catch (err: unknown) {
    console.error("/api/admin/export.json error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ ok: false, error: message });
  }
}
