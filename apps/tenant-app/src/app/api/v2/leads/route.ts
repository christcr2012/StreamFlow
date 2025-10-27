import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

// Input validation schemas
const listQuerySchema = z.object({
  q: z.string().max(200).optional(),
  status: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

const createLeadSchema = z.object({
  // Minimal shape expected by provider-portal client
  name: z.string().min(1).max(200),
  contact: z
    .object({
      email: z.string().email().max(200).optional(),
      phone: z.string().max(20).optional(),
    })
    .optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
});

function computeIdentityHash(parts: Array<string | undefined | null>) {
  return parts
    .filter(Boolean)
    .map((p) => String(p).trim().toLowerCase())
    .join("|");
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parse = listQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid query params" },
        { status: 400 },
      );
    }
    const { q, status, cursor, limit } = parse.data;

    const where: any = { orgId: auth.orgId };
    if (status) where.status = status;
    if (q && q.trim()) {
      const query = q.trim();
      where.OR = [
        { email: { contains: query, mode: "insensitive" } },
        { phoneE164: { contains: query } },
        { company: { contains: query, mode: "insensitive" } },
        { contactName: { contains: query, mode: "insensitive" } },
      ];
    }

    const results = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: (limit ?? 50) + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        publicId: true,
        sourceType: true,
        company: true,
        contactName: true,
        email: true,
        phoneE164: true,
        city: true,
        state: true,
        aiScore: true,
        scoreFactors: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        convertedAt: true,
        notes: true,
      },
    });

    const hasMore = results.length > (limit ?? 50);
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ ok: true, items, nextCursor, hasMore });
  } catch (err) {
    console.error("[v2/leads] GET error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, contact, source, notes } = parsed.data;

    // Compute identity hash for dedupe
    const identityHash = computeIdentityHash([
      contact?.email,
      contact?.phone,
      name,
    ]);

    const existing = await prisma.lead.findFirst({
      where: { orgId: auth.orgId, identityHash },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Duplicate lead", leadId: existing.id },
        { status: 409 },
      );
    }

    const lead = await prisma.lead.create({
      data: {
        orgId: auth.orgId,
        publicId: `LEAD-${Date.now()}`,
        sourceType: (source as any) || "MANUAL",
        identityHash,
        company: undefined,
        contactName: name,
        email: contact?.email,
        phoneE164: contact?.phone,
        notes,
        status: "NEW",
        aiScore: 0,
        scoreFactors: {},
      },
    });

    return NextResponse.json({ ok: true, lead }, { status: 201 });
  } catch (err) {
    console.error("[v2/leads] POST error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
