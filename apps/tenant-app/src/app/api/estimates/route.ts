// apps/tenant-app/src/app/api/estimates/route.ts
// Estimates API - Phase 2: Real data backed by CleaningEstimate, mapped to generic Estimates UI shape

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

// Map generic UI status filters to CleaningEstimate statuses
function mapStatusFilterToCleaning(status: string | null) {
  if (!status || status === 'all') return undefined; // no filter
  switch (status) {
    case 'pending':
      return { in: ['DRAFT', 'SENT', 'VIEWED'] as const };
    case 'approved':
      return 'ACCEPTED';
    case 'declined':
      return 'REJECTED';
    default:
      return undefined;
  }
}

// Safely parse optionsJson which may be stored as a JSON object or a stringified JSON
function parseOptions(optionsJson: any): Array<{ tier?: string; price?: number }> | null {
  try {
    if (!optionsJson) return null;
    if (Array.isArray(optionsJson)) return optionsJson as any;
    if (typeof optionsJson === 'string') {
      const parsed = JSON.parse(optionsJson);
      return Array.isArray(parsed) ? parsed : null;
    }
    // Prisma Json type can be object; in our case we expect an array
    return null;
  } catch {
    return null;
  }
}

function pickPrice(options: Array<{ tier?: string; price?: number }> | null, acceptedOption?: string | null) {
  if (!options || options.length === 0) return undefined;
  // If accepted option exists, use it
  if (acceptedOption) {
    const found = options.find((o) => (o.tier || '').toLowerCase() === acceptedOption.toLowerCase());
    if (found?.price && typeof found.price === 'number') return found.price;
  }
  // Prefer 'better' tier, otherwise first available with price
  const better = options.find((o) => (o.tier || '').toLowerCase() === 'better');
  if (better?.price && typeof better.price === 'number') return better.price;
  const firstWithPrice = options.find((o) => typeof o.price === 'number');
  return firstWithPrice?.price;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');

    const statusWhere = mapStatusFilterToCleaning(statusParam);

    const estimates = await prisma.cleaningEstimate.findMany({
      where: {
        orgId: auth.orgId,
        ...(statusWhere !== undefined && { status: statusWhere as any }),
      },
      include: {
        CleaningLead: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Adapt CleaningEstimate -> generic EstimatesClient shape
    const adapted = estimates.map((e) => {
      const options = parseOptions(e.optionsJson);
      const total = pickPrice(options, e.acceptedOption) ?? 0;
      const subtotal = total; // we don't have line items here; treat total as subtotal
      const tax = 0; // tax not modeled on estimate; can compute later
      const lead = e.CleaningLead;

      const statusMap: Record<string, 'pending' | 'approved' | 'declined'> = {
        DRAFT: 'pending',
        SENT: 'pending',
        VIEWED: 'pending',
        ACCEPTED: 'approved',
        REJECTED: 'declined',
      } as const;

      return {
        id: e.id,
        publicId: `EST-${e.createdAt.getFullYear()}-${e.id.slice(0, 6).toUpperCase()}`,
        customerId: lead?.id || '',
        customerName: lead?.contactName || 'Direct Estimate',
        customerEmail: undefined,
        jobTitle: `${e.spaceType} ${e.frequency} cleaning`.replace(/\b\w/g, (m) => m.toUpperCase()),
        status: statusMap[e.status] || 'pending',
        subtotal,
        tax,
        total: subtotal + tax,
        validUntil: new Date(e.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: e.createdAt.toISOString(),
        approvedAt: e.signedAt?.toISOString(),
        declinedAt: e.status === 'REJECTED' ? e.updatedAt.toISOString() : undefined,
        lineItems: [
          {
            id: `li_${e.id}`,
            description: `${e.squareFeet} sq ft, ${e.frequency} frequency`,
            quantity: 1,
            unitPrice: total,
            total: total,
          },
        ],
      };
    });

    return NextResponse.json({ estimates: adapted, total: adapted.length });
  } catch (error) {
    console.error('[Estimates API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.isAuthenticated || !auth.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Accept a minimal creation payload or fallback defaults
    const body = await req.json().catch(() => ({} as any));
    const spaceType = (body.spaceType as string) || 'commercial';
    const frequency = (body.frequency as string) || 'monthly';
    const squareFeet = Number(body.squareFeet) || 1000;
    const leadId = (body.leadId as string) || undefined;

    // Create a baseline options set similar to cleaning estimates route
    const options = [
      { tier: 'good', price: Math.round(0.85 * squareFeet * 0.2 * 100) / 100 },
      { tier: 'better', price: Math.round(1.0 * squareFeet * 0.2 * 100) / 100 },
      { tier: 'best', price: Math.round(1.25 * squareFeet * 0.2 * 100) / 100 },
    ];

    const estimate = await prisma.cleaningEstimate.create({
      data: {
        orgId: auth.orgId,
        leadId,
        version: 1,
        spaceType,
        squareFeet,
        frequency,
        optionsJson: options as any,
        status: 'DRAFT',
      },
    });

    return NextResponse.json({ id: estimate.id }, { status: 201 });
  } catch (error) {
    console.error('[Estimates API] Error:', error);
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 });
  }
}
