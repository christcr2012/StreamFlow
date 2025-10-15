import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonError } from '@/lib/api/response';
import { compose, withProviderAuth } from '@/lib/api/middleware';

/**
 * GET /api/invoices
 * List all invoices across all organizations (provider view)
 */
const getHandler = async (req: NextRequest) => {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const orgId = searchParams.get('orgId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (orgId) where.orgId = orgId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          org: {
            select: { id: true, name: true },
          },
        },
        orderBy: { issuedAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.invoice.count({ where }),
    ]);

    const items = invoices.map((inv: any) => ({
      id: inv.id,
      orgId: inv.orgId,
      orgName: inv.org.name,
      amount: parseFloat(inv.amount.toString()),
      amountCents: Math.round(parseFloat(inv.amount.toString()) * 100),
      status: inv.status,
      issuedAt: inv.issuedAt.toISOString(),
    }));

    return jsonOk({
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error listing invoices:', error);
    return jsonError(500, 'internal_error', 'Failed to list invoices');
  }
};

export const GET = compose(withProviderAuth())(getHandler);

