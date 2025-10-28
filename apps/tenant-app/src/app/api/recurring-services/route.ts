/**
 * Recurring Services API - PHASE 2
 *
 * Real database operations for recurring service management
 * Supports automatic job creation, renewal workflows, customer subscriptions
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
    const frequency = searchParams.get("frequency");
    const customerId = searchParams.get("customerId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = { orgId: authContext.orgId };

    if (status && status !== "all") {
      where.status = status;
    }

    if (frequency && frequency !== "all") {
      where.frequency = frequency;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    const recurringServices = await prisma.recurringService.findMany({
      where,
      include: {
        Customer: {
          select: {
            id: true,
            company: true,
            primaryName: true,
            primaryEmail: true,
            primaryPhone: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { nextServiceDate: "asc" }],
      take: limit,
    });

    // Transform to API response format
    const formatted = recurringServices.map((service) => ({
      id: service.id,
      customerId: service.customerId,
      customerName:
        service.Customer.primaryName || service.Customer.company || "Unknown",
      serviceName: service.serviceName,
      description: service.description,
      frequency: service.frequency,
      price: parseFloat(service.price.toString()),
      status: service.status,
      nextServiceDate: service.nextServiceDate?.toISOString() || null,
      lastServiceDate: service.lastServiceDate?.toISOString() || null,
      startDate: service.startDate.toISOString(),
      contractEndDate: service.contractEndDate?.toISOString() || null,
      autoRenew: service.autoRenew,
      totalServices: service.totalServices,
      completedServices: service.completedServices,
      notes: service.notes,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      recurringServices: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error("GET /api/recurring-services error:", error);
    const { createSafeErrorResponse } = await import("@/lib/error-handler");
    return createSafeErrorResponse(error, "GET /api/recurring-services");
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
    if (
      !body.customerId ||
      !body.serviceName ||
      !body.frequency ||
      !body.price
    ) {
      return NextResponse.json(
        { error: "Required fields: customerId, serviceName, frequency, price" },
        { status: 400 },
      );
    }

    // Verify customer belongs to this org
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
      select: { orgId: true, primaryName: true, company: true },
    });

    if (!customer || customer.orgId !== authContext.orgId) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    const newService = await prisma.recurringService.create({
      data: {
        orgId: authContext.orgId,
        customerId: body.customerId,
        serviceName: body.serviceName,
        description: body.description || null,
        frequency: body.frequency,
        price: new Prisma.Decimal(body.price),
        status: "active",
        nextServiceDate: body.nextServiceDate
          ? new Date(body.nextServiceDate)
          : null,
        lastServiceDate: null,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        contractEndDate: body.contractEndDate
          ? new Date(body.contractEndDate)
          : null,
        autoRenew: body.autoRenew || false,
        totalServices: body.totalServices || 1,
        completedServices: 0,
        notes: body.notes || null,
      },
      include: {
        Customer: {
          select: {
            id: true,
            primaryName: true,
            company: true,
          },
        },
      },
    });

    // TODO Phase 3: Set up automatic job creation schedule based on frequency
    // TODO Phase 3: Send customer confirmation email

    return NextResponse.json(
      {
        id: newService.id,
        customerId: newService.customerId,
        customerName:
          newService.Customer.primaryName ||
          newService.Customer.company ||
          "Unknown",
        serviceName: newService.serviceName,
        description: newService.description,
        frequency: newService.frequency,
        price: parseFloat(newService.price.toString()),
        status: newService.status,
        nextServiceDate: newService.nextServiceDate?.toISOString() || null,
        lastServiceDate: null,
        startDate: newService.startDate.toISOString(),
        contractEndDate: newService.contractEndDate?.toISOString() || null,
        autoRenew: newService.autoRenew,
        totalServices: newService.totalServices,
        completedServices: newService.completedServices,
        notes: newService.notes,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("POST /api/recurring-services error:", error);
    const { createSafeErrorResponse } = await import("@/lib/error-handler");
    return createSafeErrorResponse(error, "POST /api/recurring-services");
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
        { error: "Service ID is required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const existing = await prisma.recurringService.findUnique({
      where: { id },
      select: { orgId: true },
    });

    if (!existing || existing.orgId !== authContext.orgId) {
      return NextResponse.json(
        { error: "Recurring service not found" },
        { status: 404 },
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.serviceName !== undefined)
      updateData.serviceName = updates.serviceName;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.frequency !== undefined)
      updateData.frequency = updates.frequency;
    if (updates.price !== undefined)
      updateData.price = new Prisma.Decimal(updates.price);
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.nextServiceDate !== undefined)
      updateData.nextServiceDate = updates.nextServiceDate
        ? new Date(updates.nextServiceDate)
        : null;
    if (updates.lastServiceDate !== undefined)
      updateData.lastServiceDate = updates.lastServiceDate
        ? new Date(updates.lastServiceDate)
        : null;
    if (updates.contractEndDate !== undefined)
      updateData.contractEndDate = updates.contractEndDate
        ? new Date(updates.contractEndDate)
        : null;
    if (updates.autoRenew !== undefined)
      updateData.autoRenew = updates.autoRenew;
    if (updates.totalServices !== undefined)
      updateData.totalServices = updates.totalServices;
    if (updates.completedServices !== undefined)
      updateData.completedServices = updates.completedServices;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const updated = await prisma.recurringService.update({
      where: { id },
      data: updateData,
      include: {
        Customer: {
          select: {
            primaryName: true,
            company: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      customerId: updated.customerId,
      customerName:
        updated.Customer.primaryName || updated.Customer.company || "Unknown",
      serviceName: updated.serviceName,
      description: updated.description,
      frequency: updated.frequency,
      price: parseFloat(updated.price.toString()),
      status: updated.status,
      nextServiceDate: updated.nextServiceDate?.toISOString() || null,
      lastServiceDate: updated.lastServiceDate?.toISOString() || null,
      startDate: updated.startDate.toISOString(),
      contractEndDate: updated.contractEndDate?.toISOString() || null,
      autoRenew: updated.autoRenew,
      totalServices: updated.totalServices,
      completedServices: updated.completedServices,
      notes: updated.notes,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("PATCH /api/recurring-services error:", error);
    const { createSafeErrorResponse } = await import("@/lib/error-handler");
    return createSafeErrorResponse(error, "PATCH /api/recurring-services");
  }
}
