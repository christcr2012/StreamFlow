import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const invoices = await prisma.invoice.findMany({
      where: {
        orgId: authContext.orgId,
        status: { not: 'paid' },
        dueDate: { not: null },
      },
      select: {
        amount: true,
        dueDate: true,
      },
    });

    // Aging buckets
    const aging = {
      current: 0,
      days1to30: 0,
      days31to60: 0,
      days61to90: 0,
      days90plus: 0,
    };

    invoices.forEach((invoice) => {
      if (!invoice.dueDate) return;

      const dueDate = new Date(invoice.dueDate);
      const daysPastDue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = Number(invoice.amount);

      if (daysPastDue < 0) {
        aging.current += amount;
      } else if (daysPastDue <= 30) {
        aging.days1to30 += amount;
      } else if (daysPastDue <= 60) {
        aging.days31to60 += amount;
      } else if (daysPastDue <= 90) {
        aging.days61to90 += amount;
      } else {
        aging.days90plus += amount;
      }
    });

    const agingData = [
      { bucket: 'Current', amount: Number(aging.current.toFixed(2)) },
      { bucket: '1-30 Days', amount: Number(aging.days1to30.toFixed(2)) },
      { bucket: '31-60 Days', amount: Number(aging.days31to60.toFixed(2)) },
      { bucket: '61-90 Days', amount: Number(aging.days61to90.toFixed(2)) },
      { bucket: '90+ Days', amount: Number(aging.days90plus.toFixed(2)) },
    ];

    const totalOutstanding = agingData.reduce((sum, item) => sum + item.amount, 0);

    return NextResponse.json({
      agingData,
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
      invoiceCount: invoices.length,
    });
  } catch (error) {
    console.error('Error fetching invoice aging:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

