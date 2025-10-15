import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// SECURITY: Input validation schemas
const createLeadSchema = z.object({
  sourceType: z.enum([
    'COLD', 'HOT', 'RFP', 'MANUAL_EMPLOYEE_REFERRAL', 'MANUAL_EXISTING_CUSTOMER',
    'MANUAL_NEW_CUSTOMER', 'MANUAL_OTHER', 'SYSTEM', 'EMPLOYEE_REFERRAL', 'MANUAL', 'LSA'
  ]),
  company: z.string().max(200).optional(),
  contactName: z.string().max(200).optional(),
  email: z.string().email().max(200).optional(),
  phoneE164: z.string().max(20).optional(),
  website: z.string().url().max(500).optional().or(z.literal('')),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
  enrichAI: z.boolean().optional().default(false),
});

/**
 * GET /api/leads
 * List leads for the authenticated tenant
 */
export async function GET(req: NextRequest) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_client') || jar.get('client-session') || jar.get('ws_client');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from session (simplified - in production, decode JWT)
    const orgId = session.value;

    // Get query params
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const sourceType = searchParams.get('sourceType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    // Build where clause
    const where: any = { orgId };
    if (status) {
      where.status = status;
    }
    if (sourceType) {
      where.sourceType = sourceType;
    }

    // Fetch leads
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to determine if there are more
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        publicId: true,
        sourceType: true,
        company: true,
        contactName: true,
        email: true,
        phoneE164: true,
        city: true,
        state: true,
        aiScore: true,
        scoreFactors: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        convertedAt: true,
        notes: true,
      },
    });

    // Determine if there are more results
    const hasMore = leads.length > limit;
    const items = hasMore ? leads.slice(0, -1) : leads;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({
      ok: true,
      items,
      nextCursor,
      hasMore,
    });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Create a new lead with optional AI enrichment
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_client') || jar.get('client-session') || jar.get('ws_client');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orgId from session
    const orgId = session.value;

    // SECURITY: Validate and parse request body
    const body = await req.json();
    const validationResult = createLeadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      sourceType,
      company,
      contactName,
      email,
      phoneE164,
      website,
      city,
      state,
      postalCode,
      address,
      notes,
      enrichAI,
    } = validationResult.data;

    // Generate identity hash for deduplication
    const identityParts = [
      email?.toLowerCase(),
      phoneE164,
      company?.toLowerCase(),
    ].filter(Boolean);
    const identityHash = identityParts.join('|');

    // Check for duplicate
    const existing = await prisma.lead.findFirst({
      where: { orgId, identityHash },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Duplicate lead already exists', leadId: existing.id },
        { status: 409 }
      );
    }

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        orgId,
        publicId: `LEAD-${Date.now()}`,
        sourceType,
        identityHash,
        company,
        contactName,
        email,
        phoneE164,
        website,
        city,
        state,
        postalCode,
        address,
        notes,
        status: 'NEW',
        aiScore: 0, // Will be updated by AI enrichment if enabled
        scoreFactors: {},
      },
    });

    // TODO: Trigger AI enrichment if enabled
    // This will be implemented in the auto-enrichment task
    if (enrichAI) {
      // Queue AI analysis job
      console.log('AI enrichment requested for lead:', lead.id);
    }

    return NextResponse.json({
      ok: true,
      lead,
    });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

