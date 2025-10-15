import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/rfps/[id]
 * Get single RFP details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_client') || jar.get('client-session') || jar.get('ws_client');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from session
    const orgId = session.value;
    const { id } = await params;

    // Fetch RFP
    const rfp = await prisma.rfp.findFirst({
      where: {
        id,
        orgId,
      },
    });

    if (!rfp) {
      return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      rfp,
    });
  } catch (error: any) {
    console.error('Error fetching RFP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RFP' },
      { status: 500 }
    );
  }
}

