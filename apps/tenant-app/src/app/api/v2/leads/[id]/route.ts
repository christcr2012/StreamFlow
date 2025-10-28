import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const updateLeadSchema = z.object({
  contactName: z.string().max(200).optional().nullable(),
  email: z.string().email().max(200).optional().nullable(),
  phoneE164: z.string().max(20).optional().nullable(),
  status: z.string().max(50).optional(),
  aiScore: z.number().min(0).max(100).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lead = await prisma.lead.findFirst({
      where: { id, orgId: auth.orgId },
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

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    console.error("[v2/leads/[id]] GET error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify lead belongs to org
    const existing = await prisma.lead.findFirst({
      where: { id, orgId: auth.orgId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updateData: any = {};
    const d = parsed.data;
    if (d.contactName !== undefined) updateData.contactName = d.contactName;
    if (d.email !== undefined) updateData.email = d.email;
    if (d.phoneE164 !== undefined) updateData.phoneE164 = d.phoneE164;
    if (d.status !== undefined) updateData.status = d.status;
    if (d.aiScore !== undefined) updateData.aiScore = d.aiScore;
    if (d.notes !== undefined) updateData.notes = d.notes;

    const lead = await prisma.lead.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        contactName: true,
        email: true,
        phoneE164: true,
        status: true,
        aiScore: true,
        notes: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    console.error("[v2/leads/[id]] PATCH error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify lead belongs to org
    const existing = await prisma.lead.findFirst({
      where: { id, orgId: auth.orgId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Lead deleted" });
  } catch (err) {
    console.error("[v2/leads/[id]] DELETE error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
