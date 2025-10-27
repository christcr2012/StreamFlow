// apps/tenant-app/src/app/api/schedule/jobs/route.ts
// Scheduling API - Get jobs for calendar view
// Phase 2: Stub with placeholder data
// Dependencies: [prisma_model] Job, [feature] scheduling data API

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // TODO Phase 2: Query real jobs from Job table with scheduling data
    // const jobs = await prisma.job.findMany({
    //   where: {
    //     orgId: session.user.orgId,
    //     scheduledStart: {
    //       gte: new Date(startDate),
    //       lte: new Date(endDate),
    //     },
    //   },
    //   include: {
    //     customer: true,
    //     assignedTo: true,
    //     location: true,
    //   },
    //   orderBy: { scheduledStart: 'asc' },
    // });

    // Phase 2: Stub data (blocked until real Job model + scheduling queries are wired)
    const stubJobs = [
      {
        id: "job_001",
        publicId: "JOB-001",
        title: "HVAC Maintenance - Smith Residence",
        customerId: "cust_001",
        customerName: "John Smith",
        customerPhone: "+15551234567",
        address: "123 Main St, Springfield",
        scheduledStart: new Date("2025-10-27T09:00:00").toISOString(),
        scheduledEnd: new Date("2025-10-27T11:00:00").toISOString(),
        duration: 120, // minutes
        status: "scheduled",
        priority: "normal",
        assignedToId: "tech_001",
        assignedToName: "Mike Johnson",
        jobType: "maintenance",
        estimatedRevenue: 250.0,
        notes: "Annual HVAC checkup",
      },
      {
        id: "job_002",
        publicId: "JOB-002",
        title: "Emergency Repair - Jones HVAC",
        customerId: "cust_002",
        customerName: "Sarah Jones",
        customerPhone: "+15559876543",
        address: "456 Oak Ave, Springfield",
        scheduledStart: new Date("2025-10-27T13:00:00").toISOString(),
        scheduledEnd: new Date("2025-10-27T15:00:00").toISOString(),
        duration: 120,
        status: "scheduled",
        priority: "high",
        assignedToId: "tech_002",
        assignedToName: "Lisa Chen",
        jobType: "repair",
        estimatedRevenue: 450.0,
        notes: "AC unit not cooling",
      },
      {
        id: "job_003",
        publicId: "JOB-003",
        title: "New Installation - Brown Property",
        customerId: "cust_003",
        customerName: "David Brown",
        customerPhone: "+15555551234",
        address: "789 Pine Rd, Springfield",
        scheduledStart: new Date("2025-10-28T08:00:00").toISOString(),
        scheduledEnd: new Date("2025-10-28T16:00:00").toISOString(),
        duration: 480,
        status: "scheduled",
        priority: "normal",
        assignedToId: "tech_001",
        assignedToName: "Mike Johnson",
        jobType: "installation",
        estimatedRevenue: 3500.0,
        notes: "Full HVAC system installation",
      },
      {
        id: "job_004",
        publicId: "JOB-004",
        title: "Unassigned - Wilson Maintenance",
        customerId: "cust_004",
        customerName: "Emily Wilson",
        customerPhone: "+15555559999",
        address: "321 Elm St, Springfield",
        scheduledStart: new Date("2025-10-29T10:00:00").toISOString(),
        scheduledEnd: new Date("2025-10-29T12:00:00").toISOString(),
        duration: 120,
        status: "pending",
        priority: "normal",
        assignedToId: null,
        assignedToName: null,
        jobType: "maintenance",
        estimatedRevenue: 200.0,
        notes: "Filter replacement",
      },
    ];

    return NextResponse.json({
      jobs: stubJobs,
      total: stubJobs.length,
    });
  } catch (error) {
    console.error("[Schedule Jobs API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled jobs" },
      { status: 500 },
    );
  }
}
