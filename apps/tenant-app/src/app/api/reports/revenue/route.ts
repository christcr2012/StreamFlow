import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
        break;
      case 'monthly':
      default:
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        orgId: authContext.orgId,
        status: 'paid',
        paidAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        paidAt: true,
        currency: true,
      },
      orderBy: {
        paidAt: 'asc',
      },
    });

    // Group by period
    const revenueData: Record<string, number> = {};

    invoices.forEach((invoice) => {
      if (!invoice.paidAt) return;

      let key: string;
      const date = new Date(invoice.paidAt);

      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      revenueData[key] = (revenueData[key] || 0) + Number(invoice.amount);
    });

    const chartData = Object.entries(revenueData).map(([date, revenue]) => ({
      date,
      revenue: Number(revenue.toFixed(2)),
    }));

    return NextResponse.json({
      period,
      data: chartData,
      total: chartData.reduce((sum, item) => sum + item.revenue, 0),
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

