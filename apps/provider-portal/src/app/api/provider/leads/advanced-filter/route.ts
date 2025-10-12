import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// POST /api/provider/leads/advanced-filter - Advanced filtering and sorting
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      filters,
      sortBy,
      sortOrder,
      page = 1,
      pageSize = 20,
    } = await request.json();

    // Build where clause from filters
    const where: any = {};

    if (filters) {
      // Text search across multiple fields
      if (filters.search) {
        where.OR = [
          { company: { contains: filters.search, mode: 'insensitive' } },
          { contactName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phoneE164: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Status filter (single or multiple)
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          where.status = { in: filters.status };
        } else {
          where.status = filters.status;
        }
      }

      // Source type filter (single or multiple)
      if (filters.sourceType) {
        if (Array.isArray(filters.sourceType)) {
          where.sourceType = { in: filters.sourceType };
        } else {
          where.sourceType = filters.sourceType;
        }
      }

      // Organization filter
      if (filters.orgId) {
        if (Array.isArray(filters.orgId)) {
          where.orgId = { in: filters.orgId };
        } else {
          where.orgId = filters.orgId;
        }
      }

      // Date range filters
      if (filters.createdFrom || filters.createdTo) {
        where.createdAt = {};
        if (filters.createdFrom) {
          where.createdAt.gte = new Date(filters.createdFrom);
        }
        if (filters.createdTo) {
          where.createdAt.lte = new Date(filters.createdTo);
        }
      }

      if (filters.convertedFrom || filters.convertedTo) {
        where.convertedAt = {};
        if (filters.convertedFrom) {
          where.convertedAt.gte = new Date(filters.convertedFrom);
        }
        if (filters.convertedTo) {
          where.convertedAt.lte = new Date(filters.convertedTo);
        }
      }

      // AI Score range
      if (filters.aiScoreMin !== undefined || filters.aiScoreMax !== undefined) {
        where.aiScore = {};
        if (filters.aiScoreMin !== undefined) {
          where.aiScore.gte = filters.aiScoreMin;
        }
        if (filters.aiScoreMax !== undefined) {
          where.aiScore.lte = filters.aiScoreMax;
        }
      }

      // Quality score range
      if (filters.qualityScoreMin !== undefined || filters.qualityScoreMax !== undefined) {
        where.qualityScore = {};
        if (filters.qualityScoreMin !== undefined) {
          where.qualityScore.gte = filters.qualityScoreMin;
        }
        if (filters.qualityScoreMax !== undefined) {
          where.qualityScore.lte = filters.qualityScoreMax;
        }
      }

      // System generated filter
      if (filters.systemGenerated !== undefined) {
        where.systemGenerated = filters.systemGenerated;
      }

      // Location filters
      if (filters.city) {
        where.city = { contains: filters.city, mode: 'insensitive' };
      }
      if (filters.state) {
        where.state = { contains: filters.state, mode: 'insensitive' };
      }
      if (filters.zip) {
        where.zip = { contains: filters.zip, mode: 'insensitive' };
      }

      // Dispute status filter
      if (filters.disputeStatus) {
        if (Array.isArray(filters.disputeStatus)) {
          where.disputeStatus = { in: filters.disputeStatus };
        } else {
          where.disputeStatus = filters.disputeStatus;
        }
      }

      // Classification type filter
      if (filters.classificationType) {
        if (Array.isArray(filters.classificationType)) {
          where.classificationType = { in: filters.classificationType };
        } else {
          where.classificationType = filters.classificationType;
        }
      }

      // Has notes filter
      if (filters.hasNotes !== undefined) {
        where.notes = filters.hasNotes ? { not: null } : null;
      }

      // Has website filter
      if (filters.hasWebsite !== undefined) {
        where.website = filters.hasWebsite ? { not: null } : null;
      }
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc'; // Default sort
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Execute query
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          org: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error('Error filtering leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

