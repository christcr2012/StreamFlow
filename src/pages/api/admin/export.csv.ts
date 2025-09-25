// src/pages/api/admin/export.csv.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma as db } from "@/lib/prisma";
import type { Prisma, LeadSource, LeadStatus } from "@prisma/client";
import { assertPermission, getOrgIdFromReq, PERMS } from "@/lib/rbac";
import { computeWindow, endOfDayUTC, parseLimit, readStringFilter } from "@/lib/reportingWindow";

function toCsvValue(v: unknown) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  const needsQuotes = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

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
    // Cast filter strings to uppercase enums. If the value does not match a valid
    // enum member it will be ignored by Prisma at runtime. Uppercasing ensures
    // case‑insensitive matching on the server.
    const status: LeadStatus | undefined = statusStr ? (statusStr.toUpperCase() as LeadStatus) : undefined;
    const sourceType: LeadSource | undefined = sourceTypeStr ? (sourceTypeStr.toUpperCase() as LeadSource) : undefined;
    const limit = parseLimit(req.query, 10000, 100000);

    const where: Prisma.LeadWhereInput = {
      orgId,
      createdAt: { gte: from, lte: endOfDayUTC(to) },
      ...(status ? { status } : {}),
      ...(sourceType ? { sourceType } : {}),
    };

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        publicId: true,
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
      },
    });

    const headers = [
      "id","publicId","createdAt","convertedAt","status",
      "company","contactName","email","phoneE164",
      "serviceCode","addressLine1","addressLine2","city","state","postalCode","zip",
      "sourceType","sourceDetail","systemGenerated","aiScore"
    ];

    const rows: string[] = [headers.join(",")];

    for (const l of leads) {
      rows.push([
        toCsvValue(l.id),
        toCsvValue(l.publicId ?? ""),
        toCsvValue(l.createdAt instanceof Date ? l.createdAt.toISOString() : String(l.createdAt ?? "")),
        toCsvValue(l.convertedAt instanceof Date ? l.convertedAt.toISOString() : (l.convertedAt ? String(l.convertedAt) : "")),
        toCsvValue(l.status ?? ""),
        toCsvValue(l.company ?? ""),
        toCsvValue(l.contactName ?? ""),
        toCsvValue(l.email ?? ""),
        toCsvValue(l.phoneE164 ?? ""),
        toCsvValue(l.serviceCode ?? ""),
        toCsvValue(l.addressLine1 ?? ""),
        toCsvValue(l.addressLine2 ?? ""),
        toCsvValue(l.city ?? ""),
        toCsvValue(l.state ?? ""),
        toCsvValue(l.postalCode ?? ""),
        toCsvValue(l.zip ?? ""),
        toCsvValue(l.sourceType ?? ""),
        toCsvValue(l.sourceDetail ?? ""),
        toCsvValue(l.systemGenerated === true ? "true" : (l.systemGenerated === false ? "false" : "")),
        toCsvValue(typeof l.aiScore === "number" ? l.aiScore : ""),
      ].join(","));
    }

    const windowTag = `${label}_${from.toISOString().slice(0,10)}_${to.toISOString().slice(0,10)}`;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Disposition", `attachment; filename="leads_${windowTag}_${ts}.csv"`);

    const bom = "\uFEFF";
    return res.status(200).send(bom + rows.join("\n"));
  } catch (err: unknown) {
    console.error("/api/admin/export.csv error:", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ ok: false, error: message });
  }
}
