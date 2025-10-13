import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const TransactionFilterSchema = z.object({
  type: z.enum(['credit', 'debit']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const filter = TransactionFilterSchema.parse(params);

    const where: any = { orgId: authContext.orgId };
    
    if (filter.type) {
      where.type = filter.type.toUpperCase();
    }

    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) where.createdAt.gte = new Date(filter.from);
      if (filter.to) where.createdAt.lte = new Date(filter.to);
    }

    const [items, total] = await Promise.all([
      prisma.billingLedger.findMany({
        where,
        skip: (filter.page - 1) * filter.limit,
        take: filter.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.billingLedger.count({ where }),
    ]);

    // Calculate current balance
    const allTransactions = await prisma.billingLedger.findMany({
      where: { orgId: authContext.orgId },
      select: { type: true, amount: true },
    });

    const balance = allTransactions.reduce((sum, tx) => {
      // LedgerType enum values: CONVERSION_FEE, PACK_PURCHASE
      // For now, treat PACK_PURCHASE as credit, CONVERSION_FEE as debit
      return tx.type === 'PACK_PURCHASE'
        ? sum + Number(tx.amount)
        : sum - Number(tx.amount);
    }, 0);

    return NextResponse.json({
      items,
      page: filter.page,
      limit: filter.limit,
      total,
      pages: Math.ceil(total / filter.limit),
      balance,
    });
  } catch (error: any) {
    console.error('GET /api/wallet/transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

