// apps/tenant-app/src/app/api/schedule/technicians/route.ts
// Get list of technicians for scheduling
// Phase 2: Stub data
// Dependencies: [prisma_model] User (TECHNICIAN role)

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO Phase 2: Query real users with technician role
    // const technicians = await prisma.user.findMany({
    //   where: {
    //     orgId: authContext.orgId,
    //     role: 'TECHNICIAN',
    //     active: true,
    //   },
    //   select: {
    //     id: true,
    //     name: true,
    //     email: true,
    //     phone: true,
    //     skills: true,
    //     certifications: true,
    //   },
    // });

    // Phase 2: Stub data (blocked until real technician query is implemented)
    const stubTechnicians = [
      {
        id: "tech_001",
        name: "Mike Johnson",
        email: "mike@example.com",
        phone: "+15551111111",
        skills: ["HVAC", "Electrical"],
        certifications: ["EPA 608", "NATE"],
        color: "#3b82f6", // blue
        available: true,
      },
      {
        id: "tech_002",
        name: "Lisa Chen",
        email: "lisa@example.com",
        phone: "+15552222222",
        skills: ["HVAC", "Plumbing"],
        certifications: ["EPA 608"],
        color: "#10b981", // green
        available: true,
      },
      {
        id: "tech_003",
        name: "Robert Davis",
        email: "robert@example.com",
        phone: "+15553333333",
        skills: ["HVAC"],
        certifications: ["NATE", "R-410A"],
        color: "#f59e0b", // amber
        available: false, // On vacation
      },
    ];

    return NextResponse.json({
      technicians: stubTechnicians,
      total: stubTechnicians.length,
    });
  } catch (error) {
    console.error("[Schedule Technicians API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch technicians" },
      { status: 500 },
    );
  }
}
