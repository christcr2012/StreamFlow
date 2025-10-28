// apps/tenant-app/src/app/api/job-costing/route.ts
// Job costing API - Phase 2: Real database implementation

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { createSafeErrorResponse } from "@/lib/error-handler";
import { Prisma } from "@prisma/client-tenant";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");

    const where: any = { orgId: authContext.orgId };

    if (jobId) {
      where.jobId = jobId;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    const jobCosts = await prisma.jobCost.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            completedAt: true,
          },
        },
      },
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      take: limit ? parseInt(limit) : undefined,
    });

    // Format the response with all Decimal conversions
    const formatted = jobCosts.map((cost: any) => ({
      id: cost.id,
      jobId: cost.jobId,
      jobTitle: cost.job.title,
      status: cost.status,
      estimatedCost: parseFloat(cost.estimatedCost.toString()),
      actualCost: parseFloat(cost.totalCost.toString()),
      revenue: parseFloat(cost.revenue.toString()),
      profit: parseFloat(cost.profit.toString()),
      profitMargin: parseFloat(cost.profitMargin.toString()),
      costs: {
        labor: parseFloat(cost.laborCost.toString()),
        materials: parseFloat(cost.materialsCost.toString()),
        equipment: parseFloat(cost.equipmentCost.toString()),
        overhead: parseFloat(cost.overheadCost.toString()),
      },
      variance: parseFloat(cost.variance.toString()),
      notes: cost.notes,
      createdAt: cost.createdAt.toISOString(),
      updatedAt: cost.updatedAt.toISOString(),
      completedAt: cost.completedAt?.toISOString() || null,
    }));

    // Calculate summary statistics
    const summary = {
      totalRevenue: formatted.reduce(
        (sum: number, c: any) => sum + c.revenue,
        0,
      ),
      totalCost: formatted.reduce(
        (sum: number, c: any) => sum + c.actualCost,
        0,
      ),
      totalProfit: formatted.reduce((sum: number, c: any) => sum + c.profit, 0),
      avgMargin:
        formatted.length > 0
          ? formatted.reduce((sum: number, c: any) => sum + c.profitMargin, 0) /
            formatted.length
          : 0,
      totalEstimated: formatted.reduce(
        (sum: number, c: any) => sum + c.estimatedCost,
        0,
      ),
      totalVariance: formatted.reduce(
        (sum: number, c: any) => sum + c.variance,
        0,
      ),
    };

    return NextResponse.json({
      jobCosts: formatted,
      total: formatted.length,
      summary,
    });
  } catch (error) {
    console.error("Failed to fetch job costing data:", error);
    return createSafeErrorResponse(error, "job-costing-get", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      jobId,
      laborCost,
      materialsCost,
      equipmentCost,
      overheadCost,
      estimatedCost,
      revenue,
      status,
      notes,
    } = body;

    // Validate required fields
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    // Verify job belongs to org
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { orgId: true },
    });

    if (!job || job.orgId !== authContext.orgId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Calculate totals
    const labor = new Prisma.Decimal(laborCost || 0);
    const materials = new Prisma.Decimal(materialsCost || 0);
    const equipment = new Prisma.Decimal(equipmentCost || 0);
    const overhead = new Prisma.Decimal(overheadCost || 0);

    const totalCost = labor.plus(materials).plus(equipment).plus(overhead);
    const estimated = new Prisma.Decimal(estimatedCost || 0);
    const revenueDecimal = new Prisma.Decimal(revenue || 0);

    const variance = totalCost.minus(estimated);
    const profit = revenueDecimal.minus(totalCost);

    // Calculate profit margin as percentage: (profit / revenue) * 100
    const profitMargin = revenueDecimal.greaterThan(0)
      ? profit.dividedBy(revenueDecimal).times(100)
      : new Prisma.Decimal(0);

    const jobCost = await prisma.jobCost.create({
      data: {
        orgId: authContext.orgId,
        jobId,
        laborCost: labor,
        materialsCost: materials,
        equipmentCost: equipment,
        overheadCost: overhead,
        totalCost,
        estimatedCost: estimated,
        variance,
        revenue: revenueDecimal,
        profit,
        profitMargin,
        status: status || "in_progress",
        notes,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Format response
    const formatted = {
      id: jobCost.id,
      jobId: jobCost.jobId,
      jobTitle: jobCost.job.title,
      status: jobCost.status,
      estimatedCost: parseFloat(jobCost.estimatedCost.toString()),
      actualCost: parseFloat(jobCost.totalCost.toString()),
      revenue: parseFloat(jobCost.revenue.toString()),
      profit: parseFloat(jobCost.profit.toString()),
      profitMargin: parseFloat(jobCost.profitMargin.toString()),
      costs: {
        labor: parseFloat(jobCost.laborCost.toString()),
        materials: parseFloat(jobCost.materialsCost.toString()),
        equipment: parseFloat(jobCost.equipmentCost.toString()),
        overhead: parseFloat(jobCost.overheadCost.toString()),
      },
      variance: parseFloat(jobCost.variance.toString()),
      notes: jobCost.notes,
      createdAt: jobCost.createdAt.toISOString(),
      updatedAt: jobCost.updatedAt.toISOString(),
      completedAt: jobCost.completedAt?.toISOString() || null,
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error("Failed to create job cost:", error);
    return createSafeErrorResponse(error, "job-costing-post", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      laborCost,
      materialsCost,
      equipmentCost,
      overheadCost,
      estimatedCost,
      revenue,
      status,
      notes,
      completedAt,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.jobCost.findUnique({
      where: { id },
      select: { orgId: true },
    });

    if (!existing || existing.orgId !== authContext.orgId) {
      return NextResponse.json(
        { error: "Job cost not found" },
        { status: 404 },
      );
    }

    // Build update data with recalculations
    const updateData: any = {};

    // If any cost component is being updated, recalculate totals
    if (
      laborCost !== undefined ||
      materialsCost !== undefined ||
      equipmentCost !== undefined ||
      overheadCost !== undefined ||
      estimatedCost !== undefined ||
      revenue !== undefined
    ) {
      // Get current values
      const current = await prisma.jobCost.findUnique({ where: { id } });
      if (!current) {
        return NextResponse.json(
          { error: "Job cost not found" },
          { status: 404 },
        );
      }

      const labor = new Prisma.Decimal(
        laborCost !== undefined ? laborCost : current.laborCost,
      );
      const materials = new Prisma.Decimal(
        materialsCost !== undefined ? materialsCost : current.materialsCost,
      );
      const equipment = new Prisma.Decimal(
        equipmentCost !== undefined ? equipmentCost : current.equipmentCost,
      );
      const overhead = new Prisma.Decimal(
        overheadCost !== undefined ? overheadCost : current.overheadCost,
      );
      const estimated = new Prisma.Decimal(
        estimatedCost !== undefined ? estimatedCost : current.estimatedCost,
      );
      const revenueDecimal = new Prisma.Decimal(
        revenue !== undefined ? revenue : current.revenue,
      );

      const totalCost = labor.plus(materials).plus(equipment).plus(overhead);
      const variance = totalCost.minus(estimated);
      const profit = revenueDecimal.minus(totalCost);
      const profitMargin = revenueDecimal.greaterThan(0)
        ? profit.dividedBy(revenueDecimal).times(100)
        : new Prisma.Decimal(0);

      if (laborCost !== undefined) updateData.laborCost = labor;
      if (materialsCost !== undefined) updateData.materialsCost = materials;
      if (equipmentCost !== undefined) updateData.equipmentCost = equipment;
      if (overheadCost !== undefined) updateData.overheadCost = overhead;
      if (estimatedCost !== undefined) updateData.estimatedCost = estimated;
      if (revenue !== undefined) updateData.revenue = revenueDecimal;

      updateData.totalCost = totalCost;
      updateData.variance = variance;
      updateData.profit = profit;
      updateData.profitMargin = profitMargin;
    }

    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null;
    }

    const updated = await prisma.jobCost.update({
      where: { id },
      data: updateData,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    // Format response
    const formatted = {
      id: updated.id,
      jobId: updated.jobId,
      jobTitle: updated.job.title,
      status: updated.status,
      estimatedCost: parseFloat(updated.estimatedCost.toString()),
      actualCost: parseFloat(updated.totalCost.toString()),
      revenue: parseFloat(updated.revenue.toString()),
      profit: parseFloat(updated.profit.toString()),
      profitMargin: parseFloat(updated.profitMargin.toString()),
      costs: {
        labor: parseFloat(updated.laborCost.toString()),
        materials: parseFloat(updated.materialsCost.toString()),
        equipment: parseFloat(updated.equipmentCost.toString()),
        overhead: parseFloat(updated.overheadCost.toString()),
      },
      variance: parseFloat(updated.variance.toString()),
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      completedAt: updated.completedAt?.toISOString() || null,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Failed to update job cost:", error);
    return createSafeErrorResponse(error, "job-costing-patch", 500);
  }
}
