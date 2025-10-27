/**
 * Subcontractor Management API - PHASE 2
 *
 * Real database CRUD operations for subcontractor management
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client-tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const specialty = searchParams.get("specialty");
    const availability = searchParams.get("availability");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = { orgId: authContext.orgId };

    // Filter by status
    if (status && status !== "all") {
      where.status = status;
    }

    // Filter by specialty
    if (specialty && specialty !== "all") {
      where.specialties = { has: specialty };
    }

    // Filter by availability
    if (availability && availability !== "all") {
      where.availability = availability;
    }

    const subcontractors = await prisma.subcontractor.findMany({
      where,
      orderBy: [
        { status: "asc" }, // pending first, then active, then inactive
        { rating: "desc" },
        { companyName: "asc" },
      ],
      take: limit,
    });

    // Transform to API response format
    const formatted = subcontractors.map((sub) => ({
      id: sub.id,
      companyName: sub.companyName,
      contactName: sub.contactName,
      email: sub.email,
      phone: sub.phone,
      specialties: sub.specialties,
      status: sub.status,
      rating: sub.rating ? parseFloat(sub.rating.toString()) : null,
      completedJobs: sub.completedJobs,
      hourlyRate: sub.hourlyRate ? parseFloat(sub.hourlyRate.toString()) : null,
      insurance: sub.insurance as Record<string, any>,
      availability: sub.availability,
      notes: sub.notes,
      onboardedAt: sub.onboardedAt.toISOString(),
      lastJobAt: sub.lastJobAt?.toISOString() || null,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      subcontractors: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error("GET /api/subcontractors error:", error);
    const { createSafeErrorResponse } = await import("@/lib/error-handler");
    return createSafeErrorResponse(error, "GET /api/subcontractors");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.companyName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 },
      );
    }

    const newSubcontractor = await prisma.subcontractor.create({
      data: {
        orgId: authContext.orgId,
        companyName: body.companyName,
        contactName: body.contactName || null,
        email: body.email || null,
        phone: body.phone || null,
        specialties: body.specialties || [],
        status: "pending",
        rating: null,
        completedJobs: 0,
        hourlyRate: body.hourlyRate
          ? new Prisma.Decimal(body.hourlyRate)
          : null,
        insurance: body.insurance || {
          hasLiability: false,
          hasWorkersComp: false,
          expiresAt: null,
        },
        availability: "available",
        notes: body.notes || null,
        onboardedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        id: newSubcontractor.id,
        companyName: newSubcontractor.companyName,
        contactName: newSubcontractor.contactName,
        email: newSubcontractor.email,
        phone: newSubcontractor.phone,
        specialties: newSubcontractor.specialties,
        status: newSubcontractor.status,
        rating: null,
        completedJobs: newSubcontractor.completedJobs,
        hourlyRate: newSubcontractor.hourlyRate
          ? parseFloat(newSubcontractor.hourlyRate.toString())
          : null,
        insurance: newSubcontractor.insurance as Record<string, any>,
        availability: newSubcontractor.availability,
        notes: newSubcontractor.notes,
        onboardedAt: newSubcontractor.onboardedAt.toISOString(),
        lastJobAt: null,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/subcontractors error:", error);
    const { createSafeErrorResponse } = await import("@/lib/error-handler");
    return createSafeErrorResponse(error, "POST /api/subcontractors");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Subcontractor ID is required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const existing = await prisma.subcontractor.findUnique({
      where: { id },
      select: { orgId: true },
    });

    if (!existing || existing.orgId !== authContext.orgId) {
      return NextResponse.json(
        { error: "Subcontractor not found" },
        { status: 404 },
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.companyName !== undefined)
      updateData.companyName = updates.companyName;
    if (updates.contactName !== undefined)
      updateData.contactName = updates.contactName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.specialties !== undefined)
      updateData.specialties = updates.specialties;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.rating !== undefined)
      updateData.rating = updates.rating
        ? new Prisma.Decimal(updates.rating)
        : null;
    if (updates.hourlyRate !== undefined)
      updateData.hourlyRate = updates.hourlyRate
        ? new Prisma.Decimal(updates.hourlyRate)
        : null;
    if (updates.insurance !== undefined)
      updateData.insurance = updates.insurance;
    if (updates.availability !== undefined)
      updateData.availability = updates.availability;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.lastJobAt !== undefined)
      updateData.lastJobAt = updates.lastJobAt
        ? new Date(updates.lastJobAt)
        : null;
    if (updates.completedJobs !== undefined)
      updateData.completedJobs = updates.completedJobs;

    const updated = await prisma.subcontractor.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      companyName: updated.companyName,
      contactName: updated.contactName,
      email: updated.email,
      phone: updated.phone,
      specialties: updated.specialties,
      status: updated.status,
      rating: updated.rating ? parseFloat(updated.rating.toString()) : null,
      completedJobs: updated.completedJobs,
      hourlyRate: updated.hourlyRate
        ? parseFloat(updated.hourlyRate.toString())
        : null,
      insurance: updated.insurance as Record<string, any>,
      availability: updated.availability,
      notes: updated.notes,
      onboardedAt: updated.onboardedAt.toISOString(),
      lastJobAt: updated.lastJobAt?.toISOString() || null,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("PATCH /api/subcontractors error:", error);
    const { createSafeErrorResponse } = await import("@/lib/error-handler");
    return createSafeErrorResponse(error, "PATCH /api/subcontractors");
  }
}
