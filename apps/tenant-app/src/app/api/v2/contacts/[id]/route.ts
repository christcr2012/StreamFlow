/**
 * CustomerContact Detail API - [id] route
 * Phase 1: Scaffold with TODO placeholders
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const updateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

/**
 * GET /api/v2/contacts/[id]
 * Get contact detail
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contact = await prisma.customerContact.findFirst({
      where: {
        id: id,
        Customer: {
          orgId: auth.orgId,
        },
      },
      select: {
        id: true,
        customerId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        Customer: {
          select: {
            id: true,
            company: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // TODO Phase 2: Include communication history (calls, emails, meetings)
    // TODO Phase 2: Include interaction count and last interaction date
    // TODO Phase 2: Include associated opportunities

    return NextResponse.json({ ok: true, contact });
  } catch (err) {
    console.error("[contacts/[id]] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v2/contacts/[id]
 * Update contact
 */
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
    const parsed = updateContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify contact exists and belongs to org
    const existing = await prisma.customerContact.findFirst({
      where: {
        id: id,
        Customer: {
          orgId: auth.orgId,
        },
      },
      select: {
        id: true,
        customerId: true,
        isPrimary: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // TODO Phase 2: If isPrimary is being set to true, unset other primary contacts for this customer
    // TODO Phase 2: Add email uniqueness validation within customer
    // TODO Phase 2: Send notification email if contact email is changed
    // TODO Phase 2: Log changes to audit log

    const updateData: any = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email;
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.isPrimary !== undefined)
      updateData.isPrimary = parsed.data.isPrimary;

    const updated = await prisma.customerContact.update({
      where: { id: id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isPrimary: true,
        updatedAt: true,
        Customer: {
          select: {
            id: true,
            company: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, contact: updated });
  } catch (err) {
    console.error("[contacts/[id]] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v2/contacts/[id]
 * Delete contact
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify contact exists and belongs to org
    const existing = await prisma.customerContact.findFirst({
      where: {
        id: id,
        Customer: {
          orgId: auth.orgId,
        },
      },
      select: {
        id: true,
        isPrimary: true,
        customerId: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // TODO Phase 2: Prevent deletion of primary contact (require setting another contact as primary first)
    // TODO Phase 2: Archive contact data instead of hard delete
    // TODO Phase 2: Log deletion to audit log

    await prisma.customerContact.delete({
      where: { id: id },
    });

    return NextResponse.json({ ok: true, message: "Contact deleted" });
  } catch (err) {
    console.error("[contacts/[id]] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
