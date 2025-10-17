import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get top customers by revenue
    const invoices = await prisma.invoice.findMany({
      where: {
        orgId: authContext.orgId,
        status: 'paid',
        customerId: { not: null },
      },
      select: {
        customerId: true,
        amount: true,
        customer: {
          select: {
            company: true,
            primaryName: true,
            primaryEmail: true,
          },
        },
      },
    });

    // Group by customer
    const customerRevenue: Record<string, { name: string; email: string; revenue: number; invoiceCount: number }> = {};

    invoices.forEach((invoice: any) => {
      if (!invoice.customerId) return;

      const key = invoice.customerId;
      if (!customerRevenue[key]) {
        customerRevenue[key] = {
          name: invoice.Customer?.company || invoice.Customer?.primaryName || 'Unknown',
          email: invoice.Customer?.primaryEmail || '',
          revenue: 0,
          invoiceCount: 0,
        };
      }

      customerRevenue[key].revenue += Number(invoice.amount);
      customerRevenue[key].invoiceCount += 1;
    });

    const topCustomers = Object.entries(customerRevenue)
      .map(([id, data]) => ({
        id,
        ...data,
        revenue: Number(data.revenue.toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      topCustomers,
      totalCustomers: Object.keys(customerRevenue).length,
    });
  } catch (error) {
    console.error('Error fetching customer insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

