/**
 * Cleaning Leads API Routes
 * 
 * GET /api/cleaning/leads - List all cleaning leads for the organization
 * POST /api/cleaning/leads - Create a new cleaning lead
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';
import { z } from 'zod';

// Validation schema for creating a cleaning lead
const CreateCleaningLeadSchema = z.object({
  contactName: z.string().min(1, 'Contact name is required'),
  company: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(2, 'State is required').max(2, 'State must be 2 characters'),
  zip: z.string().min(5, 'ZIP code is required'),
  lat: z.number().optional(),
  lon: z.number().optional(),
  spaceType: z.enum(['residential', 'commercial', 'post-construction']),
  squareFeet: z.number().int().positive('Square feet must be positive').optional(),
  frequency: z.enum(['one-time', 'weekly', 'bi-weekly', 'monthly']).optional(),
  notes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const spaceType = searchParams.get('spaceType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {
      orgId: authContext.orgId
    };

    if (status) {
      where.status = status;
    }

    if (spaceType) {
      where.spaceType = spaceType;
    }

    // Fetch leads with pagination
    const [leads, total] = await Promise.all([
      prisma.cleaningLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          estimates: {
            select: {
              id: true,
              status: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.cleaningLead.count({ where })
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching cleaning leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleaning leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = CreateCleaningLeadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create cleaning lead
    const lead = await prisma.cleaningLead.create({
      data: {
        orgId: authContext.orgId,
        contactName: data.contactName,
        company: data.company,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        lat: data.lat,
        lon: data.lon,
        spaceType: data.spaceType,
        squareFeet: data.squareFeet,
        frequency: data.frequency,
        status: 'NEW'
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        orgId: authContext.orgId,
        actorType: 'user',
        actorId: authContext.userId || 'unknown',
        entityType: 'cleaning_lead',
        entityId: lead.id,
        action: 'created',
        meta: JSON.stringify({
          spaceType: lead.spaceType,
          squareFeet: lead.squareFeet,
          frequency: lead.frequency
        })
      }
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating cleaning lead:', error);
    return NextResponse.json(
      { error: 'Failed to create cleaning lead' },
      { status: 500 }
    );
  }
}

