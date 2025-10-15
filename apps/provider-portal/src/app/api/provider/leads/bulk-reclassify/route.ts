import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client-provider';

/**
 * POST /api/provider/leads/bulk-reclassify
 * Bulk reclassify leads
 * 
 * Provider admin can reclassify multiple leads at once
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const jar = await cookies();
    const session = jar.get('rs_provider') || jar.get('provider-session') || jar.get('ws_provider');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { leadIds, classificationType } = body;

    // Validation
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'leadIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!classificationType) {
      return NextResponse.json(
        { error: 'classificationType is required' },
        { status: 400 }
      );
    }

    const validTypes = ['employee_referral', 'duplicate', 'invalid_contact', 'out_of_service_area', 'spam'];
    if (!validTypes.includes(classificationType)) {
      return NextResponse.json(
        { error: `Invalid classificationType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert to enum format
    const enumType = classificationType.toUpperCase() as any;

    // Update all leads
    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
      },
      data: {
        classificationType: enumType,
        classifiedAt: new Date(),
        classifiedBy: session.value,
      },
    });

    // Create audit logs for each lead
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, orgId: true },
    });

    await Promise.all(
      leads.map((lead: any) =>
        prisma.auditLog.create({
          data: {
            orgId: lead.orgId,
            actorUserId: session.value,
            entity: 'lead',
            entityId: lead.id,
            field: 'classificationType',
            oldValue: Prisma.JsonNull,
            newValue: enumType,
            reason: `Bulk reclassify: ${classificationType.replace('_', ' ')} (${leadIds.length} leads)`,
          },
        })
      )
    );

    // TODO: Send webhooks to tenant apps
    // for (const lead of leads) {
    //   await sendWebhook(lead.orgId, 'lead.reclassified', {
    //     leadId: lead.id,
    //     classificationType: enumType,
    //   });
    // }

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} leads reclassified successfully`,
    });
  } catch (error) {
    console.error('Error in bulk-reclassify handler:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

