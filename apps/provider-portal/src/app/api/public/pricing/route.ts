/**
 * Public API endpoint for marketing pricing
 * 
 * This endpoint is consumed by the marketing website (www.cortiware.com)
 * to display pricing information. It only returns PUBLISHED pricing plans.
 * 
 * No authentication required - this is a public endpoint.
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Always fetch fresh data
export const revalidate = 0; // No caching on API side (marketing site handles caching with ISR)

export async function GET() {
  try {
    // Fetch only PUBLISHED and ACTIVE pricing plans
    const plans = await prisma.marketingPricingPlan.findMany({
      where: {
        active: true,
        status: 'PUBLISHED',
      },
      include: {
        features: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Transform to marketing site format
    const formatted = plans.map((plan) => ({
      name: plan.name,
      price: plan.price ? plan.price / 100 : null, // Convert cents to dollars
      description: plan.description,
      features: plan.features.map((f) => f.text),
      cta: plan.cta,
      highlighted: plan.highlighted,
    }));

    return NextResponse.json(
      {
        plans: formatted,
        lastUpdated: new Date().toISOString(),
      },
      {
        headers: {
          // Cache for 60 seconds on CDN, allow stale for 120 seconds while revalidating
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          // CORS headers to allow marketing site to fetch
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store', // Don't cache errors
        },
      }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

