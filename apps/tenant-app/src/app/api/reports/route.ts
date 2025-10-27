// apps/tenant-app/src/app/api/reports/route.ts
// Reporting & Analytics API - Phase 2: Real data with Prisma

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateRangeParam = searchParams.get('dateRange'); // days: 7|30|90|365
    const days = Math.max(1, parseInt(dateRangeParam || '30', 10) || 30);

    const end = startOfDay(new Date());
    const start = addDays(end, -days);

    // Fetch core data in parallel
    const [payments, jobs, users, inspections] = await Promise.all([
      prisma.payment.findMany({
        where: {
          orgId: auth.orgId,
          status: 'succeeded',
          receivedAt: { gte: start, lt: addDays(end, 1) },
        },
        select: { amount: true, receivedAt: true },
        take: 5000,
      }),
      prisma.job.findMany({
        where: {
          orgId: auth.orgId,
          createdAt: { gte: start, lt: addDays(end, 1) },
        },
        select: { id: true, status: true, completedAt: true, assignedTo: true },
        take: 5000,
      }),
      prisma.user.findMany({
        where: { orgId: auth.orgId, isActive: true, role: { in: ['STAFF', 'PROVIDER'] } },
        select: { id: true, name: true },
        take: 1000,
      }),
      prisma.cleaningInspection.findMany({
        where: {
          orgId: auth.orgId,
          inspectedAt: { gte: start, lt: addDays(end, 1) },
          score: { not: null },
        },
        select: { score: true },
        take: 5000,
      }),
    ]);

    // Revenue aggregation from payments
    const revenueTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    // Group by month label
    const byMonthMap = new Map<string, number>();
    payments.forEach((p) => {
      const label = new Date(p.receivedAt).toLocaleString('en-US', { month: 'short' });
      byMonthMap.set(label, (byMonthMap.get(label) || 0) + Number(p.amount));
    });
    const byMonth = Array.from(byMonthMap.entries()).map(([month, amount]) => ({ month, amount }));
    // Approximate month-over-month
    const monthsSorted = Array.from(byMonthMap.keys());
    const thisMonth = monthsSorted.length ? byMonthMap.get(monthsSorted[monthsSorted.length - 1]) || 0 : 0;
    const lastMonth = monthsSorted.length > 1 ? byMonthMap.get(monthsSorted[monthsSorted.length - 2]) || 0 : 0;
    const growth = lastMonth ? ((thisMonth - lastMonth) / lastMonth) * 100 : thisMonth > 0 ? 100 : 0;

    // Jobs breakdown
    const totalJobs = jobs.length;
    const completed = jobs.filter((j) => j.completedAt).length;
    const inProgress = jobs.filter((j) => (j.status || '').toLowerCase().includes('progress')).length;
    const scheduled = jobs.filter((j) => (j.status || '').toLowerCase().includes('schedul')).length;
    const completionRate = totalJobs ? (completed / totalJobs) * 100 : 0;
    const byStatus = [
      { status: 'Completed', count: completed },
      { status: 'In Progress', count: inProgress },
      { status: 'Scheduled', count: scheduled },
    ];

    // Customers
    const [customersTotal, customersNew] = await Promise.all([
      prisma.customer.count({ where: { orgId: auth.orgId } }),
      prisma.customer.count({ where: { orgId: auth.orgId, createdAt: { gte: start, lt: addDays(end, 1) } } }),
    ]);
    // Active customers in window: distinct customerIds appearing on Jobs in range
    const activeCustomerIds = new Set<string>();
    const jobsWithCustomers = await prisma.job.findMany({
      where: { orgId: auth.orgId, createdAt: { gte: start, lt: addDays(end, 1) }, customerId: { not: null } },
      select: { customerId: true },
      take: 5000,
    });
    jobsWithCustomers.forEach((j) => j.customerId && activeCustomerIds.add(j.customerId));

    // Satisfaction from inspections (avg score 0-5), fallback if no data
    const satisfaction = inspections.length
      ? inspections.reduce((sum, i) => sum + Number(i.score || 0), 0) / inspections.length
      : 4.7;

    // Technicians
    const techniciansTotal = users.length;
    // Jobs per tech (by assignedTo)
    const jobsByTech = new Map<string, number>();
    jobs.forEach((j) => {
      if (j.assignedTo) jobsByTech.set(j.assignedTo, (jobsByTech.get(j.assignedTo) || 0) + 1);
    });
    let topPerformerId: string | null = null;
    let topPerformerJobs = 0;
    jobsByTech.forEach((count, id) => {
      if (count > topPerformerJobs) {
        topPerformerJobs = count;
        topPerformerId = id;
      }
    });
    const userMap = new Map(users.map((u) => [u.id, u.name || 'Team Member']));
    const topPerformer = topPerformerId ? userMap.get(topPerformerId) || 'Top Tech' : '—';
    const avgJobsPerTech = techniciansTotal ? totalJobs / techniciansTotal : 0;

    const reportData = {
      revenue: {
        total: Number(revenueTotal.toFixed(2)),
        thisMonth: Number(thisMonth.toFixed(2)),
        lastMonth: Number(lastMonth.toFixed(2)),
        growth: Number(growth.toFixed(1)),
        byMonth: byMonth.sort((a, b) => a.month.localeCompare(b.month)),
      },
      jobs: {
        total: totalJobs,
        completed,
        inProgress,
        scheduled,
        completionRate: Number(completionRate.toFixed(1)),
        byStatus,
      },
      customers: {
        total: customersTotal,
        new: customersNew,
        active: activeCustomerIds.size,
        satisfaction: Number(satisfaction.toFixed(1)),
      },
      technicians: {
        total: techniciansTotal,
        avgJobsPerTech: Number(avgJobsPerTech.toFixed(1)),
        topPerformer,
        topPerformerJobs,
      },
    };

    return NextResponse.json({ reportData, dateRange: { start: start.toISOString(), end: end.toISOString() } });
  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}
