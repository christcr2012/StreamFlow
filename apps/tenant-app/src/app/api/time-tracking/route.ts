/**
 * Time Tracking API - PHASE 2
 *
 * Real-time clock in/out, GPS verification, payroll calculations
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
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = { orgId: authContext.orgId };

    if (status && status !== "all") {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        Job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { clockIn: "desc" },
      take: limit,
    });

    // Transform to API response format
    const formatted = timeEntries.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      userName: entry.User.name || entry.User.email,
      jobId: entry.jobId,
      jobTitle: entry.Job?.title || null,
      clockIn: entry.clockIn.toISOString(),
      clockOut: entry.clockOut?.toISOString() || null,
      breakMinutes: entry.breakMinutes,
      totalHours: entry.totalHours
        ? parseFloat(entry.totalHours.toString())
        : 0,
      hourlyRate: parseFloat(entry.hourlyRate.toString()),
      totalPay: entry.totalPay ? parseFloat(entry.totalPay.toString()) : 0,
      status: entry.status,
      notes: entry.notes,
      gpsClockIn: entry.gpsClockIn,
      gpsClockOut: entry.gpsClockOut,
      approvedBy: entry.approvedBy,
      approvedAt: entry.approvedAt?.toISOString() || null,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      timeEntries: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error("GET /api/time-tracking error:", error);
    const { createSafeErrorResponse } = await import("@/lib/error-handler");
    return createSafeErrorResponse(error, "GET /api/time-tracking");
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "clock_in") {
      // Check if user already has an active time entry
      const existing = await prisma.timeEntry.findFirst({
        where: {
          orgId: authContext.orgId,
          userId: body.userId,
          clockOut: null,
          status: "active",
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            error:
              "User already has an active time entry. Please clock out first.",
          },
          { status: 400 },
        );
      }

      const newEntry = await prisma.timeEntry.create({
        data: {
          orgId: authContext.orgId,
          userId: body.userId,
          jobId: body.jobId || null,
          clockIn: new Date(),
          hourlyRate: new Prisma.Decimal(body.hourlyRate || 0),
          notes: body.notes || null,
          gpsClockIn: body.gps
            ? ({
                lat: body.gps.latitude,
                lon: body.gps.longitude,
                accuracy: body.gps.accuracy,
                timestamp: new Date().toISOString(),
              } as Prisma.InputJsonObject)
            : Prisma.JsonNull,
          status: "active",
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          Job: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          id: newEntry.id,
          userId: newEntry.userId,
          userName: newEntry.User.name || newEntry.User.email,
          jobId: newEntry.jobId,
          jobTitle: newEntry.Job?.title || null,
          clockIn: newEntry.clockIn.toISOString(),
          clockOut: null,
          totalHours: 0,
          hourlyRate: parseFloat(newEntry.hourlyRate.toString()),
          totalPay: 0,
          status: newEntry.status,
          notes: newEntry.notes,
        },
        { status: 201 },
      );
    }

    if (action === "clock_out") {
      const entry = await prisma.timeEntry.findUnique({
        where: { id: body.entryId },
        select: {
          orgId: true,
          clockIn: true,
          hourlyRate: true,
          breakMinutes: true,
        },
      });

      if (!entry || entry.orgId !== authContext.orgId) {
        return NextResponse.json(
          { error: "Time entry not found" },
          { status: 404 },
        );
      }

      const clockOut = new Date();
      const clockIn = entry.clockIn;

      // Calculate total hours (accounting for breaks)
      const totalMinutes = Math.floor(
        (clockOut.getTime() - clockIn.getTime()) / 1000 / 60,
      );
      const workMinutes = totalMinutes - (entry.breakMinutes || 0);
      const totalHours = new Prisma.Decimal(workMinutes / 60);

      // Calculate total pay
      const totalPay = totalHours.mul(entry.hourlyRate);

      const updated = await prisma.timeEntry.update({
        where: { id: body.entryId },
        data: {
          clockOut,
          totalHours,
          totalPay,
          status: "pending", // Awaiting approval
          gpsClockOut: body.gps
            ? ({
                lat: body.gps.latitude,
                lon: body.gps.longitude,
                accuracy: body.gps.accuracy,
                timestamp: clockOut.toISOString(),
              } as Prisma.InputJsonObject)
            : Prisma.JsonNull,
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        id: updated.id,
        clockOut: updated.clockOut!.toISOString(),
        totalHours: parseFloat(totalHours.toString()),
        totalPay: parseFloat(totalPay.toString()),
        status: updated.status,
      });
    }

    if (action === "approve") {
      const entry = await prisma.timeEntry.findUnique({
        where: { id: body.entryId },
        select: { orgId: true },
      });

      if (!entry || entry.orgId !== authContext.orgId) {
        return NextResponse.json(
          { error: "Time entry not found" },
          { status: 404 },
        );
      }

      const updated = await prisma.timeEntry.update({
        where: { id: body.entryId },
        data: {
          status: "approved",
          approvedBy: authContext.userId,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        approvedBy: updated.approvedBy,
        approvedAt: updated.approvedAt!.toISOString(),
      });
    }

    if (action === "reject") {
      const entry = await prisma.timeEntry.findUnique({
        where: { id: body.entryId },
        select: { orgId: true },
      });

      if (!entry || entry.orgId !== authContext.orgId) {
        return NextResponse.json(
          { error: "Time entry not found" },
          { status: 404 },
        );
      }

      const updated = await prisma.timeEntry.update({
        where: { id: body.entryId },
        data: {
          status: "rejected",
          rejectedBy: authContext.userId,
          rejectedAt: new Date(),
          rejectionReason: body.reason || null,
        },
      });

      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        rejectedBy: updated.rejectedBy,
        rejectedAt: updated.rejectedAt!.toISOString(),
        rejectionReason: updated.rejectionReason,
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid action. Supported: clock_in, clock_out, approve, reject",
      },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("POST /api/time-tracking error:", error);
    const { createSafeErrorResponse } = await import("@/lib/error-handler");
    return createSafeErrorResponse(error, "POST /api/time-tracking");
  }
}
