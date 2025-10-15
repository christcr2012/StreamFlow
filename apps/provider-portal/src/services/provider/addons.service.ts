// Provider Add-ons Service
// Server-only service for add-on purchases, refunds, and SKU tracking

import { prisma } from '@/lib/prisma';

export type AddonSummary = {
  totalPurchases: number;
  totalRefunds: number;
  totalRevenueCents: number;
  netRevenueCents: number;
  topSkus: Array<{ sku: string; count: number; revenueCents: number }>;
};

export type AddonPurchaseItem = {
  id: string;
  orgId: string;
  orgName: string;
  sku: string;
  amount: string; // Decimal as string
  status: string;
  purchasedAt: string;
  refundedAt: string | null;
  meta: any;
};

/**
 * Get add-on summary with revenue and top SKUs
 */
export async function getAddonSummary(): Promise<AddonSummary> {
  const [purchases, refunds, allPurchases] = await Promise.all([
    prisma.addonPurchase.count({ where: { status: 'purchased' } }),
    prisma.addonPurchase.count({ where: { status: 'refunded' } }),
    prisma.addonPurchase.findMany({
      select: { sku: true, amount: true, status: true },
    }),
  ]);

  // Calculate revenue
  let totalRevenueCents = 0;
  let netRevenueCents = 0;
  const skuMap = new Map<string, { count: number; revenueCents: number }>();

  for (const purchase of allPurchases) {
    const amountCents = Math.round(parseFloat(purchase.amount.toString()) * 100);
    
    if (purchase.status === 'purchased') {
      totalRevenueCents += amountCents;
      netRevenueCents += amountCents;
    } else if (purchase.status === 'refunded') {
      totalRevenueCents += amountCents; // Still counts as total revenue
      netRevenueCents -= amountCents; // Subtract from net
    }

    // Track by SKU
    const existing = skuMap.get(purchase.sku) || { count: 0, revenueCents: 0 };
    existing.count += 1;
    if (purchase.status === 'purchased') {
      existing.revenueCents += amountCents;
    }
    skuMap.set(purchase.sku, existing);
  }

  // Get top 5 SKUs by revenue
  const topSkus = Array.from(skuMap.entries())
    .map(([sku, data]) => ({ sku, ...data }))
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, 5);

  return {
    totalPurchases: purchases,
    totalRefunds: refunds,
    totalRevenueCents,
    netRevenueCents,
    topSkus,
  };
}

/**
 * List add-on purchases with pagination and filtering
 */
export async function listAddonPurchases(params: {
  cursor?: string;
  limit?: number;
  sku?: string;
  orgId?: string;
  status?: string;
}): Promise<{ items: AddonPurchaseItem[]; nextCursor: string | null }> {
  const { cursor, limit = 20, sku, orgId, status } = params;

  const where: any = {};
  if (sku) where.sku = sku;
  if (orgId) where.orgId = orgId;
  if (status) where.status = status;

  const purchases = await prisma.addonPurchase.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ purchasedAt: 'desc' }, { id: 'desc' }],
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = purchases.length > limit;
  const items = hasMore ? purchases.slice(0, limit) : purchases;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items: items.map((p: any) => ({
      id: p.id,
      orgId: p.orgId,
      orgName: p.org.name,
      sku: p.sku,
      amount: p.amount.toString(),
      status: p.status,
      purchasedAt: p.purchasedAt.toISOString(),
      refundedAt: p.refundedAt?.toISOString() || null,
      meta: p.meta,
    })),
    nextCursor,
  };
}

/**
 * Get SKU breakdown with counts and revenue
 */
export async function getSkuBreakdown(): Promise<Array<{
  sku: string;
  purchaseCount: number;
  refundCount: number;
  totalRevenueCents: number;
  netRevenueCents: number;
}>> {
  const purchases = await prisma.addonPurchase.findMany({
    select: { sku: true, amount: true, status: true },
  });

  const skuMap = new Map<string, {
    purchaseCount: number;
    refundCount: number;
    totalRevenueCents: number;
    netRevenueCents: number;
  }>();

  for (const purchase of purchases) {
    const amountCents = Math.round(parseFloat(purchase.amount.toString()) * 100);
    const existing = skuMap.get(purchase.sku) || {
      purchaseCount: 0,
      refundCount: 0,
      totalRevenueCents: 0,
      netRevenueCents: 0,
    };

    if (purchase.status === 'purchased') {
      existing.purchaseCount += 1;
      existing.totalRevenueCents += amountCents;
      existing.netRevenueCents += amountCents;
    } else if (purchase.status === 'refunded') {
      existing.refundCount += 1;
      existing.totalRevenueCents += amountCents;
      existing.netRevenueCents -= amountCents;
    }

    skuMap.set(purchase.sku, existing);
  }

  return Array.from(skuMap.entries())
    .map(([sku, data]) => ({ sku, ...data }))
    .sort((a, b) => b.netRevenueCents - a.netRevenueCents);
}

/**
 * Get recent refunds for monitoring
 */
export async function getRecentRefunds(days: number = 7): Promise<AddonPurchaseItem[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const refunds = await prisma.addonPurchase.findMany({
    where: {
      status: 'refunded',
      refundedAt: { gte: startDate },
    },
    orderBy: { refundedAt: 'desc' },
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  return refunds.map((p: any) => ({
    id: p.id,
    orgId: p.orgId,
    orgName: p.org.name,
    sku: p.sku,
    amount: p.amount.toString(),
    status: p.status,
    purchasedAt: p.purchasedAt.toISOString(),
    refundedAt: p.refundedAt?.toISOString() || null,
    meta: p.meta,
  }));
}

/**
 * Get purchases by organization
 */
export async function getOrgPurchases(orgId: string): Promise<AddonPurchaseItem[]> {
  const purchases = await prisma.addonPurchase.findMany({
    where: { orgId },
    orderBy: { purchasedAt: 'desc' },
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  return purchases.map((p: any) => ({
    id: p.id,
    orgId: p.orgId,
    orgName: p.org.name,
    sku: p.sku,
    amount: p.amount.toString(),
    status: p.status,
    purchasedAt: p.purchasedAt.toISOString(),
    refundedAt: p.refundedAt?.toISOString() || null,
    meta: p.meta,
  }));
}

