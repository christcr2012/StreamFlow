import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonOk, jsonError } from '@/lib/api/response';
import { compose, withProviderAuth } from '@/lib/api/middleware';

/**
 * GET /api/invoices/[id]
 * Get invoice details by ID
 */
const getHandler = async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        org: {
          select: { id: true, name: true },
        },
        lineItems: {
          select: {
            id: true,
            description: true,
            lineType: true,
            quantity: true,
            unitPriceCents: true,
            amountCents: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!invoice) {
      return jsonError(404, 'not_found', 'Invoice not found');
    }

    const lineItems = invoice.lineItems.map((line: any) => ({
      id: line.id,
      description: line.description,
      lineType: line.lineType,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      amountCents: line.amountCents,
      createdAt: line.createdAt.toISOString(),
    }));

    const result = {
      id: invoice.id,
      orgId: invoice.orgId,
      orgName: invoice.org.name,
      amount: parseFloat(invoice.amount.toString()),
      amountCents: Math.round(parseFloat(invoice.amount.toString()) * 100),
      status: invoice.status,
      issuedAt: invoice.issuedAt.toISOString(),
      lineItems,
    };

    return jsonOk({ invoice: result });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return jsonError(500, 'internal_error', 'Failed to fetch invoice');
  }
};

export const GET = compose(withProviderAuth())(getHandler);

