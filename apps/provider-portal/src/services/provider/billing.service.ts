// Provider Billing Service
// Server-only service for revenue tracking, reconciliation, and dunning

import { prisma } from '@/lib/prisma';

export type BillingSummary = {
  totalRevenueCents: number;
  revenueByStream: Array<{ stream: string; revenueCents: number }>;
  unbilledLeads: number;
  unbilledRevenueCents: number;
  dunningCount: number;
};

export type RevenueByStream = {
  leads: number;
  subscriptions: number;
  usage: number;
  addons: number;
  ai: number;
  total: number;
};

export type UnbilledLead = {
  id: string;
  orgId: string;
  orgName: string;
  convertedAt: string;
  estimatedValueCents: number;
};

export type ReconciliationGap = {
  type: string;
  orgId: string;
  orgName: string;
  description: string;
  amountCents: number;
};

/**
 * Get billing summary with revenue by stream
 */
export async function getBillingSummary(): Promise<BillingSummary> {
  try {
    const [payments, unbilledLeads, dunningInvoices] = await Promise.all([
      prisma.payment.findMany({
        select: { amount: true },
      }),
      prisma.lead.count({
        where: {
          status: 'CONVERTED',
          convertedAt: { not: null },
          // TODO: Add invoiced flag to Lead model
        },
      }),
      prisma.invoice.count({
        where: {
          status: 'past_due',
        },
      }),
    ]);

    // Calculate revenue by stream from payment amount
    const streamRevenue = new Map<string, number>();
    let totalRevenueCents = 0;

    for (const payment of payments) {
      const amountCents = Math.round(parseFloat(payment.amount.toString()) * 100);
      const stream = 'payments'; // Simplified - no metadata in Payment model
      const current = streamRevenue.get(stream) || 0;
      streamRevenue.set(stream, current + amountCents);
      totalRevenueCents += amountCents;
    }

    const revenueByStream = Array.from(streamRevenue.entries()).map(([stream, revenueCents]) => ({
      stream,
      revenueCents,
    }));

    return {
      totalRevenueCents,
      revenueByStream,
      unbilledLeads,
      unbilledRevenueCents: unbilledLeads * 50000, // Placeholder: $500 per lead
      dunningCount: dunningInvoices,
    };
  } catch (error) {
    console.error('Error in getBillingSummary:', error);
    return {
      totalRevenueCents: 0,
      revenueByStream: [],
      unbilledLeads: 0,
      unbilledRevenueCents: 0,
      dunningCount: 0,
    };
  }
}

/**
 * Get detailed revenue breakdown by stream
 */
export async function getRevenueByStream(): Promise<RevenueByStream> {
  try {
    const payments = await prisma.payment.findMany({
      select: { amount: true },
    });

    let leads = 0;
    let subscriptions = 0;
    let usage = 0;
    let addons = 0;
    let ai = 0;

    for (const payment of payments) {
      const amountCents = Math.round(parseFloat(payment.amount.toString()) * 100);
      // Simplified: all payments go to general revenue
      // TODO: Add stream metadata to Payment model
      leads += amountCents;
    }

    return {
      leads,
      subscriptions,
      usage,
      addons,
      ai,
      total: leads + subscriptions + usage + addons + ai,
    };
  } catch (error) {
    console.error('Error in getRevenueByStream:', error);
    return { leads: 0, subscriptions: 0, usage: 0, addons: 0, ai: 0, total: 0 };
  }
}

/**
 * Get unbilled converted leads
 * Returns leads that have been converted but not yet invoiced
 */
export async function getUnbilledLeads(): Promise<UnbilledLead[]> {
  try {
    const leads = await prisma.lead.findMany({
      where: {
        status: 'CONVERTED',
        convertedAt: { not: null },
        // Filter for leads not yet associated with a LeadInvoiceLine
        LeadInvoiceLine: {
          none: {},
        },
      },
      select: {
        id: true,
        orgId: true,
        updatedAt: true,
        convertedAt: true,
      },
    });

    // Get org names separately
    const orgIds = [...new Set(leads.map(l => l.orgId))];
    const orgs = await prisma.org.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    });
    const orgMap = new Map(orgs.map(o => [o.id, o.name]));

    return leads.map((lead: any) => ({
      id: lead.id,
      orgId: lead.orgId,
      orgName: orgMap.get(lead.orgId) || 'Unknown',
      convertedAt: (lead.convertedAt || lead.updatedAt).toISOString(),
      estimatedValueCents: 50000, // Placeholder: $500 per lead
    }));
  } catch (error) {
    console.error('Error in getUnbilledLeads:', error);
    return [];
  }
}

/**
 * Get AI credit reconciliation gaps
 */
export async function getAiReconciliationGaps(): Promise<ReconciliationGap[]> {
  const orgs = await prisma.org.findMany({
    select: {
      id: true,
      name: true,
      aiCreditBalance: true,
    },
  });

  const gaps: ReconciliationGap[] = [];

  for (const org of orgs) {
    // Get AI usage events for this org
    const events = await prisma.aiUsageEvent.findMany({
      where: { orgId: org.id },
      select: { costUsd: true },
    });

    const totalUsedCents = events.reduce((sum: any, evt: any) =>
      sum + Math.round(parseFloat(evt.costUsd.toString()) * 100), 0
    );
    const creditValueCents = org.aiCreditBalance * 5; // 1 credit = $0.05
    const gap = creditValueCents - totalUsedCents;

    if (Math.abs(gap) > 100) { // Only report gaps > $1
      gaps.push({
        type: 'ai_credits',
        orgId: org.id,
        orgName: org.name,
        description: gap > 0
          ? `Unused credits: ${org.aiCreditBalance} credits ($${(gap / 100).toFixed(2)})`
          : `Overused: $${(Math.abs(gap) / 100).toFixed(2)} beyond credits`,
        amountCents: gap,
      });
    }
  }

  return gaps;
}

/**
 * Get dunning queue (failed payments needing retry)
 */
export async function getDunningQueue(): Promise<Array<{
  invoiceId: string;
  orgId: string;
  orgName: string;
  amountCents: number;
  dueDate: string;
  attemptCount: number;
}>> {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'past_due',
      },
      select: {
        id: true,
        orgId: true,
        amount: true,
        issuedAt: true,
      },
      orderBy: { issuedAt: 'asc' },
    });

    // Get org names
    const orgIds = [...new Set(invoices.map(i => i.orgId))];
    const orgs = await prisma.org.findMany({
      where: { id: { in: orgIds } },
      select: { id: true, name: true },
    });
    const orgMap = new Map(orgs.map(o => [o.id, o.name]));

    // Compute attempt counts per invoice (retry-* references)
    const invoiceIds = invoices.map(i => i.id);
    const attempts = await prisma.payment.findMany({
      where: { invoiceId: { in: invoiceIds }, reference: { startsWith: 'retry-' } },
      select: { invoiceId: true },
    });
    const attemptMap = new Map<string, number>();
    for (const a of attempts) attemptMap.set(a.invoiceId!, (attemptMap.get(a.invoiceId!) || 0) + 1);

    return invoices.map((inv: any) => ({
      invoiceId: inv.id,
      orgId: inv.orgId,
      orgName: orgMap.get(inv.orgId) || 'Unknown',
      amountCents: Math.round(parseFloat(inv.amount.toString()) * 100),
      dueDate: inv.issuedAt.toISOString(),
      attemptCount: attemptMap.get(inv.id) || 0,
    }));
  } catch (error) {
    console.error('Error in getDunningQueue:', error);
    return [];
  }
}

/**
 * Export billing data as CSV
 */
export async function exportBillingCsv(params: {
  startDate: Date;
  endDate: Date;
  stream?: string;
}): Promise<string> {
  const { startDate, endDate } = params;

  const payments = await prisma.payment.findMany({
    where: {
      receivedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      receivedAt: true,
      orgId: true,
      invoiceId: true,
      amount: true,
      method: true,
    },
    orderBy: { receivedAt: 'asc' },
  });

  // Get org names
  const orgIds = [...new Set(payments.map(p => p.orgId))];
  const orgs = await prisma.org.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true },
  });
  const orgMap = new Map(orgs.map(o => [o.id, o.name]));

  // Generate CSV
  const headers = ['Date', 'Org', 'Invoice', 'Amount', 'Method'];
  const rows = payments.map((p: any) => [
    p.receivedAt.toISOString().split('T')[0],
    orgMap.get(p.orgId) || 'Unknown',
    p.invoiceId || 'N/A',
    `$${parseFloat(p.amount.toString()).toFixed(2)}`,
    p.method,
  ]);

  return [headers, ...rows].map((row: any) => row.join(',')).join('\n');
}

