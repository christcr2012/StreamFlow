// src/pages/api/leads.list.ts
import { prisma as db } from "@/lib/prisma";
import { assertPermission, PERMS } from "@/lib/rbac";
import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma, LeadSource } from "@prisma/client";

export const config = { api: { bodyParser: false } }; // GET-only

function toDateOrUndefined(v?: string) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }

    if (!(await assertPermission(req, res, PERMS.LEAD_READ))) return;

    // Safely extract query parameters. Next.js types query values as string | string[] | undefined.
    const { q, sourceType, postal, from, to, page, pageSize } = req.query;
    const qStr = Array.isArray(q) ? q[0] : q;
    const sourceTypeStr = Array.isArray(sourceType) ? sourceType[0] : sourceType;
    const postalStr = Array.isArray(postal) ? postal[0] : postal;
    const fromStr = Array.isArray(from) ? from[0] : from;
    const toStr = Array.isArray(to) ? to[0] : to;
    const pageStr = Array.isArray(page) ? page[0] : page;
    const pageSizeStr = Array.isArray(pageSize) ? pageSize[0] : pageSize;

    const pg = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSizeStr ?? "20", 10) || 20));
    const skip = (pg - 1) * ps;

    const createdFrom = toDateOrUndefined(fromStr);
    const createdTo = toDateOrUndefined(toStr);

    const where: Prisma.LeadWhereInput = {};
    if (qStr) {
      where.OR = [
        { publicId: { contains: qStr, mode: "insensitive" } },
        { company: { contains: qStr, mode: "insensitive" } },
        { contactName: { contains: qStr, mode: "insensitive" } },
        { email: { contains: qStr, mode: "insensitive" } },
        { phoneE164: { contains: qStr, mode: "insensitive" } },
        { serviceCode: { contains: qStr, mode: "insensitive" } },
      ];
    }
    // sourceType must be cast to the Prisma enum. Uppercase ensures consistent matching.
    if (sourceTypeStr) where.sourceType = (sourceTypeStr.toUpperCase() as unknown as LeadSource);

    if (postalStr) {
      where.OR = [
        ...(where.OR ?? []),
        { postalCode: { contains: postalStr, mode: "insensitive" } },
        { zip: { contains: postalStr, mode: "insensitive" } },
      ];
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = createdFrom;
      if (createdTo) where.createdAt.lte = createdTo;
    }

    const [total, items] = await Promise.all([
      db.lead.count({ where }),
      db.lead.findMany({
        where,
        skip,
        take: ps,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          publicId: true,
          sourceType: true,
          sourceDetail: true, // ← added so UI can show “SAM.gov …” and billable badge
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
          rfp: true,
          status: true,
          createdAt: true,
          // Include enrichmentJson so the UI can determine billing eligibility
          enrichmentJson: true,
        },
      }),
    ]);

    return res
      .status(200)
      .json({ ok: true, total, page: pg, pageSize: ps, items });
  } catch (err: unknown) {
    console.error("API /api/leads.list error:", err);
    const msg = (err as { message?: string } | undefined)?.message || "Internal Server Error";
    return res.status(500).json({ ok: false, error: msg });
  }
}