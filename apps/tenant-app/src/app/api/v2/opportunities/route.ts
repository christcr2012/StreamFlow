import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  stage: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

const createOpportunitySchema = z.object({
  leadId: z.string().optional(),
  customerId: z.string().optional(),
  stage: z.string().min(1),
  amount: z.number().nonnegative().optional(),
  title: z.string().max(200).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const parse = listQuerySchema.safeParse({
      stage: searchParams.get("stage") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });
    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid query params" },
        { status: 400 },
      );
    }
    const { stage, cursor, limit } = parse.data;

    const where: any = { orgId: auth.orgId };
    if (stage) where.stage = stage;

    const results = await prisma.opportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: (limit ?? 50) + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        customerId: true,
        estValue: true,
        stage: true,
        ownerId: true,
        sourceLeadId: true,
        classification: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasMore = results.length > (limit ?? 50);
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ ok: true, items, nextCursor, hasMore });
  } catch (err) {
    console.error("[v2/opportunities] GET error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const parsed = createOpportunitySchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { leadId, customerId, stage, amount } = parsed.data;

    let resolvedCustomerId = customerId ?? undefined;

    if (!resolvedCustomerId && leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, orgId: auth.orgId },
        select: {
          id: true,
          convertedToCustomerId: true,
          company: true,
          contactName: true,
          email: true,
          phoneE164: true,
        },
      });
      if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
      // Use existing converted customer if present; otherwise create a minimal customer
      if (lead.convertedToCustomerId) {
        resolvedCustomerId = lead.convertedToCustomerId;
      } else {
        const customer = await prisma.customer.create({
          data: {
            orgId: auth.orgId,
            publicId: `CUST-${Date.now()}`,
            company: lead.company || undefined,
            primaryName: lead.contactName || undefined,
            primaryEmail: lead.email || undefined,
            primaryPhone: lead.phoneE164 || undefined,
          },
          select: { id: true },
        });
        resolvedCustomerId = customer.id;
        // Optionally mark lead as converted
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            convertedAt: new Date(),
            convertedToCustomerId: resolvedCustomerId,
          },
        });
      }
    }

    if (!resolvedCustomerId) {
      return NextResponse.json(
        { error: "customerId or leadId required to create opportunity" },
        { status: 400 },
      );
    }

    const opp = await prisma.opportunity.create({
      data: {
        orgId: auth.orgId,
        customerId: resolvedCustomerId,
        stage,
        estValue: typeof amount === "number" ? amount : null,
        sourceLeadId: leadId,
        valueType: "RELATIONSHIP",
        classification: {},
        ownerId: auth.userId || undefined,
      },
    });

    return NextResponse.json({ ok: true, opportunity: opp }, { status: 201 });
  } catch (err) {
    console.error("[v2/opportunities] POST error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
