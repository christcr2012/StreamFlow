/**
 * Accountant Statistics Service
 * 
 * Fetches real-time financial statistics for the Accountant portal dashboard.
 * Aggregates financial data across all client organizations.
 */

import { prisma } from '@/lib/prisma';

export interface AccountantStats {
  totalRevenue: number;
  invoiceCount: number;
  pendingPayments: number;
  overdueInvoices: number;
}

export interface RecentTransaction {
  id: string;
  type: 'invoice_paid' | 'invoice_issued' | 'payment_received';
  amount: number;
  orgName: string;
  timestamp: Date;
  status: string;
}

/**
 * Get accountant dashboard statistics
 */
export async function getAccountantStats(): Promise<AccountantStats> {
  try {
    // Calculate total revenue from paid invoices
    const revenueResult = await prisma.invoice.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'paid',
      },
    });

    const totalRevenue = revenueResult._sum.amount 
      ? Number(revenueResult._sum.amount)
      : 0;

    // Count total invoices
    const invoiceCount = await prisma.invoice.count();

    // Count pending payments (invoices that are issued but not paid)
    const pendingPayments = await prisma.invoice.count({
      where: {
        status: {
          in: ['issued', 'sent'],
        },
      },
    });

    // Count overdue invoices (simplified - would need dueDate field in production)
    const overdueInvoices = 0; // Placeholder

    return {
      totalRevenue,
      invoiceCount,
      pendingPayments,
      overdueInvoices,
    };
  } catch (error) {
    console.error('[AccountantStats] Error fetching stats:', error);
    return {
      totalRevenue: 0,
      invoiceCount: 0,
      pendingPayments: 0,
      overdueInvoices: 0,
    };
  }
}

/**
 * Get recent financial transactions
 */
export async function getRecentTransactions(limit: number = 10): Promise<RecentTransaction[]> {
  try {
    const transactions: RecentTransaction[] = [];

    // Get recent paid invoices
    const paidInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: {
        issuedAt: 'desc',
      },
      where: {
        status: 'paid',
      },
      include: {
        org: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const invoice of paidInvoices) {
      transactions.push({
        id: `invoice-${invoice.id}`,
        type: 'invoice_paid',
        amount: Number(invoice.amount),
        orgName: invoice.org.name,
        timestamp: invoice.issuedAt,
        status: invoice.status,
      });
    }

    // Get recent issued invoices
    const issuedInvoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: {
        issuedAt: 'desc',
      },
      where: {
        status: {
          in: ['issued', 'sent', 'draft'],
        },
      },
      include: {
        org: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const invoice of issuedInvoices) {
      transactions.push({
        id: `invoice-issued-${invoice.id}`,
        type: 'invoice_issued',
        amount: Number(invoice.amount),
        orgName: invoice.org.name,
        timestamp: invoice.issuedAt,
        status: invoice.status,
      });
    }

    // Sort by timestamp descending and limit
    return transactions
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('[AccountantStats] Error fetching recent transactions:', error);
    return [];
  }
}

/**
 * Get revenue by organization
 */
export async function getRevenueByOrg(): Promise<Array<{
  orgId: string;
  orgName: string;
  totalRevenue: number;
  invoiceCount: number;
}>> {
  try {
    const orgs = await prisma.org.findMany({
      include: {
        invoices: {
          where: {
            status: 'paid',
          },
        },
      },
    });

    return orgs.map((org: any) => {
      const totalRevenue = org.invoices.reduce((sum: any, invoice: any) => sum + Number(invoice.amount),
        0
      );

      return {
        orgId: org.id,
        orgName: org.name,
        totalRevenue,
        invoiceCount: org.invoices.length,
      };
    }).filter((org: any) => org.totalRevenue > 0);
  } catch (error) {
    console.error('[AccountantStats] Error fetching revenue by org:', error);
    return [];
  }
}

/**
 * Get monthly revenue trend
 */
export async function getMonthlyRevenue(months: number = 12): Promise<Array<{
  month: string;
  revenue: number;
}>> {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'paid',
        issuedAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        issuedAt: true,
      },
      orderBy: {
        issuedAt: 'asc',
      },
    });

    // Group by month
    const revenueMap = new Map<string, number>();
    for (const invoice of invoices) {
      const monthKey = invoice.issuedAt.toISOString().slice(0, 7); // YYYY-MM
      const current = revenueMap.get(monthKey) || 0;
      revenueMap.set(monthKey, current + Number(invoice.amount));
    }

    // Convert to array
    return Array.from(revenueMap.entries()).map(([month, revenue]) => ({
      month,
      revenue,
    }));
  } catch (error) {
    console.error('[AccountantStats] Error fetching monthly revenue:', error);
    return [];
  }
}

/**
 * Get payment method breakdown
 */
export async function getPaymentMethodBreakdown(): Promise<Array<{
  method: string;
  count: number;
  totalAmount: number;
}>> {
  try {
    const payments = await prisma.payment.findMany({
      select: {
        method: true,
        amount: true,
      },
    });

    // Group by method
    const methodMap = new Map<string, { count: number; totalAmount: number }>();
    for (const payment of payments) {
      const current = methodMap.get(payment.method) || { count: 0, totalAmount: 0 };
      methodMap.set(payment.method, {
        count: current.count + 1,
        totalAmount: current.totalAmount + Number(payment.amount),
      });
    }

    // Convert to array
    return Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      totalAmount: data.totalAmount,
    }));
  } catch (error) {
    console.error('[AccountantStats] Error fetching payment method breakdown:', error);
    return [];
  }
}

