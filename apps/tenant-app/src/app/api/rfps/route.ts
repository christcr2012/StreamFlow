import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Note: Cannot use edge runtime with Prisma due to WASM limitations
// export const runtime = 'edge';

/**
 * GET /api/rfps
 * List RFPs for the authenticated tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_client') || jar.get('client-session') || jar.get('ws_client');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from session
    const orgId = session.value;

    // Fetch RFPs
    const rfps = await prisma.rfp.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        publicId: true,
        title: true,
        sourceSite: true,
        dueDate: true,
        aiBidFit: true,
        aiPriceHint: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      rfps,
    });
  } catch (error: any) {
    console.error('Error fetching RFPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RFPs' },
      { status: 500 }
    );
  }
}

