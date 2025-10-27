/**
 * Infrastructure Monitoring Dashboard
 *
 * Owner-only page that displays:
 * - Real-time usage metrics for all services
 * - Usage trend charts (last 30 days)
 * - Active upgrade recommendations
 * - Alert history
 * - One-click upgrade actions
 */

import { PrismaClient } from "@prisma/client-provider";
import { InfrastructureMonitoringService } from "@/services/infrastructure";
import { InfrastructureDashboard } from "./InfrastructureDashboard";

const prisma = new PrismaClient();

export const metadata = {
  title: "Infrastructure Monitoring | Cortiware",
  description:
    "Monitor infrastructure usage, costs, and get upgrade recommendations",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getInfrastructureData() {
  // Guard for build-time when DATABASE_URL may not be available
  try {
    const monitoring = new InfrastructureMonitoringService(prisma);

    // Get current usage summary
    const usageSummary = await monitoring.getUsageSummary();

    // Get recent metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMetrics = await prisma.infrastructureMetric.findMany({
      where: {
        timestamp: { gte: thirtyDaysAgo },
      },
      orderBy: { timestamp: "asc" },
    });

    // Get active recommendations
    const recommendations = await prisma.upgradeRecommendation.findMany({
      where: {
        status: {
          in: ["PENDING", "REVIEWED"],
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 10,
    });

    // Get service limits
    const limits = await prisma.infrastructureLimit.findMany({
      orderBy: [{ service: "asc" }, { metric: "asc" }],
    });

    return {
      usageSummary,
      recentMetrics,
      recommendations,
      limits,
    };
  } catch (error) {
    console.log(
      "InfrastructurePage: Database not available during build, using empty data",
    );
    // Return empty data structures for build-time
    return {
      usageSummary: {},
      recentMetrics: [],
      recommendations: [],
      limits: [],
    };
  }
}

export default async function InfrastructurePage() {
  const data = await getInfrastructureData();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Infrastructure Monitoring</h1>
        <p className="text-gray-600">
          Monitor usage across all services and get proactive upgrade
          recommendations
        </p>
      </div>

      <InfrastructureDashboard
        usageSummary={data.usageSummary}
        recentMetrics={data.recentMetrics}
        recommendations={data.recommendations}
        limits={data.limits}
      />
    </div>
  );
}
