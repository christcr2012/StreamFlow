import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// POST /api/provider/leads/export - Export leads to CSV
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const { filters, format = 'csv' } = await request.json();

    // Build where clause from filters (same logic as advanced-filter)
    const where: any = {};

    if (filters) {
      if (filters.search) {
        where.OR = [
          { company: { contains: filters.search, mode: 'insensitive' } },
          { contactName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phoneE164: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      if (filters.status) {
        where.status = Array.isArray(filters.status) ? { in: filters.status } : filters.status;
      }

      if (filters.sourceType) {
        where.sourceType = Array.isArray(filters.sourceType) ? { in: filters.sourceType } : filters.sourceType;
      }

      if (filters.orgId) {
        where.orgId = Array.isArray(filters.orgId) ? { in: filters.orgId } : filters.orgId;
      }

      if (filters.createdFrom || filters.createdTo) {
        where.createdAt = {};
        if (filters.createdFrom) where.createdAt.gte = new Date(filters.createdFrom);
        if (filters.createdTo) where.createdAt.lte = new Date(filters.createdTo);
      }

      if (filters.aiScoreMin !== undefined || filters.aiScoreMax !== undefined) {
        where.aiScore = {};
        if (filters.aiScoreMin !== undefined) where.aiScore.gte = filters.aiScoreMin;
        if (filters.aiScoreMax !== undefined) where.aiScore.lte = filters.aiScoreMax;
      }

      if (filters.systemGenerated !== undefined) {
        where.systemGenerated = filters.systemGenerated;
      }

      if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
      if (filters.state) where.state = { contains: filters.state, mode: 'insensitive' };
      if (filters.zip) where.zip = { contains: filters.zip, mode: 'insensitive' };
    }

    // Fetch all matching leads (limit to 10,000 for safety)
    const leads = await prisma.lead.findMany({
      where,
      take: 10000,
      orderBy: { createdAt: 'desc' },
      include: {
        org: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'ID',
        'Public ID',
        'Company',
        'Contact Name',
        'Email',
        'Phone',
        'Website',
        'Status',
        'Source Type',
        'Organization',
        'AI Score',
        'Quality Score',
        'System Generated',
        'City',
        'State',
        'ZIP',
        'Created At',
        'Converted At',
        'Dispute Status',
        'Classification Type',
        'Notes',
      ];

      const rows = leads.map((lead) => [
        lead.id,
        lead.publicId,
        lead.company || '',
        lead.contactName || '',
        lead.email || '',
        lead.phoneE164 || '',
        lead.website || '',
        lead.status,
        lead.sourceType,
        lead.org.name,
        lead.aiScore,
        lead.qualityScore || '',
        lead.systemGenerated ? 'Yes' : 'No',
        lead.city || '',
        lead.state || '',
        lead.zip || '',
        lead.createdAt.toISOString(),
        lead.convertedAt ? lead.convertedAt.toISOString() : '',
        lead.disputeStatus || '',
        lead.classificationType || '',
        lead.notes || '',
      ]);

      // Escape CSV values
      const escapeCsvValue = (value: any): string => {
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csvContent = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map((row) => row.map(escapeCsvValue).join(',')),
      ].join('\n');

      // Create audit event
      await prisma.auditEvent.create({
        data: {
          action: 'leads_export',
          entityType: 'lead',
          entityId: 'bulk',
          actorType: 'provider',
          actorId: email,
          metadata: {
            count: leads.length,
            filters,
            format,
          },
        },
      });

      // Return CSV file
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting leads:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

