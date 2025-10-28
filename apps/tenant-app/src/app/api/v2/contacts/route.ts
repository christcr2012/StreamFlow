/**
 * Contacts API v2 - CustomerContact management
 * Phase 1: Scaffold with TODO placeholders
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth-context";

const listQuerySchema = z.object({
  customerId: z.string().optional(),
  q: z.string().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).optional().default(50),
});

const createContactSchema = z.object({
  customerId: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(20).optional(),
  role: z.string().max(100).optional(),
  isPrimary: z.boolean().optional().default(false),
});

const updateContactSchema = createContactSchema
  .partial()
  .omit({ customerId: true });

/**
 * GET /api/v2/contacts
 * List customer contacts with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parse = listQuerySchema.safeParse({
      customerId: searchParams.get("customerId") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parse.success) {
      return NextResponse.json(
        { error: "Invalid query params", details: parse.error.flatten() },
        { status: 400 },
      );
    }

    const { customerId, q, cursor, limit } = parse.data;

    // Build where clause
    const where: any = {};

    // Ensure org scoping via customer relation
    where.Customer = { orgId: auth.orgId };

    if (customerId) {
      where.customerId = customerId;
    }

    if (q && q.trim()) {
      const query = q.trim();
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { role: { contains: query, mode: "insensitive" } },
      ];
    }

    // TODO Phase 2: Add more filters (role, department, status)
    // TODO Phase 2: Add sorting options (name, email, createdAt)
    // TODO Phase 2: Add includeInactive flag

    const results = await prisma.customerContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: (limit ?? 50) + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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
            publicId: true,
          },
        },
      },
    });

    const hasMore = results.length > (limit ?? 50);
    const items = hasMore ? results.slice(0, -1) : results;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      ok: true,
      items,
      nextCursor,
      hasMore,
      total: items.length, // TODO Phase 2: Add separate count query for accurate total
    });
  } catch (err) {
    console.error("[v2/contacts] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v2/contacts
 * Create a new customer contact
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { customerId, name, email, phone, role, isPrimary } = parsed.data;

    // Verify customer exists and belongs to org
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, orgId: auth.orgId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found or access denied" },
        { status: 404 },
      );
    }

    // TODO Phase 2: If isPrimary, unset other primary contacts for this customer
    // TODO Phase 2: Add duplicate detection by email within customer
    // TODO Phase 2: Send welcome email if enabled

    const contact = await prisma.customerContact.create({
      data: {
        customerId,
        name,
        email: email || null,
        phone: phone || null,
        role: role || null,
        isPrimary: isPrimary || false,
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
      },
    });

    return NextResponse.json({ ok: true, contact }, { status: 201 });
  } catch (err) {
    console.error("[v2/contacts] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/v2/contacts (update by query param contactId)
 * Update an existing contact
 * TODO Phase 2: Move to /api/v2/contacts/[id]/route.ts for proper RESTful pattern
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId query parameter required" },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Verify contact exists and belongs to org (via customer)
    const existing = await prisma.customerContact.findFirst({
      where: {
        id: contactId,
        Customer: { orgId: auth.orgId },
      },
      select: { id: true, customerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 },
      );
    }

    // TODO Phase 2: If isPrimary being set, unset other primary contacts

    const updated = await prisma.customerContact.update({
      where: { id: contactId },
      data: parsed.data,
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
      },
    });

    return NextResponse.json({ ok: true, contact: updated });
  } catch (err) {
    console.error("[v2/contacts] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/v2/contacts (delete by query param contactId)
 * Delete a contact
 * TODO Phase 2: Move to /api/v2/contacts/[id]/route.ts for proper RESTful pattern
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId query parameter required" },
        { status: 400 },
      );
    }

    // Verify contact exists and belongs to org
    const existing = await prisma.customerContact.findFirst({
      where: {
        id: contactId,
        Customer: { orgId: auth.orgId },
      },
      select: { id: true, isPrimary: true, customerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contact not found or access denied" },
        { status: 404 },
      );
    }

    // TODO Phase 2: Prevent deletion of primary contact if it's the last contact
    // TODO Phase 2: Archive instead of hard delete (add deletedAt field)

    await prisma.customerContact.delete({
      where: { id: contactId },
    });

    return NextResponse.json({ ok: true, message: "Contact deleted" });
  } catch (err) {
    console.error("[v2/contacts] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
