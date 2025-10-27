// apps/tenant-app/src/app/api/job-costing/route.ts
// Job costing API - Phase 1

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TODO Phase 2: Real Prisma query from JobCost, Job tables
const stubJobCosts = [
  {
    id: 'cost-001',
    jobId: 'job-456',
    jobTitle: 'HVAC Installation - 123 Oak St',
    status: 'completed',
    estimatedCost: 3500.00,
    actualCost: 3280.50,
    revenue: 4500.00,
    profit: 1219.50,
    profitMargin: 27.1,
    costs: {
      labor: 1450.00,
      materials: 1680.50,
      equipment: 150.00,
      overhead: 0,
    },
    completedAt: '2025-01-23T16:00:00Z',
  },
  {
    id: 'cost-002',
    jobId: 'job-457',
    jobTitle: 'AC Repair - 456 Maple Ave',
    status: 'in_progress',
    estimatedCost: 450.00,
    actualCost: 287.00,
    revenue: 650.00,
    profit: 363.00,
    profitMargin: 55.8,
    costs: {
      labor: 190.00,
      materials: 82.00,
      equipment: 15.00,
      overhead: 0,
    },
    completedAt: null,
  },
  {
    id: 'cost-003',
    jobId: 'job-458',
    jobTitle: 'Maintenance Check - 789 Pine Dr',
    status: 'completed',
    estimatedCost: 200.00,
    actualCost: 157.50,
    revenue: 250.00,
    profit: 92.50,
    profitMargin: 37.0,
    costs: {
      labor: 140.00,
      materials: 12.50,
      equipment: 5.00,
      overhead: 0,
    },
    completedAt: '2025-01-22T14:30:00Z',
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');

    let filtered = [...stubJobCosts];

    if (jobId) {
      filtered = filtered.filter((cost) => cost.jobId === jobId);
    }

    if (status && status !== 'all') {
      filtered = filtered.filter((cost) => cost.status === status);
    }

    return NextResponse.json({
      jobCosts: filtered,
      total: filtered.length,
      summary: {
        totalRevenue: filtered.reduce((sum, c) => sum + c.revenue, 0),
        totalCost: filtered.reduce((sum, c) => sum + c.actualCost, 0),
        totalProfit: filtered.reduce((sum, c) => sum + c.profit, 0),
        avgMargin: filtered.length > 0
          ? filtered.reduce((sum, c) => sum + c.profitMargin, 0) / filtered.length
          : 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch job costing data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job costing data' },
      { status: 500 }
    );
  }
}
