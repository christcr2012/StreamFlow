import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/provider/leads/bulk-dispute
 * Bulk approve or reject lead disputes
 * 
 * Provider admin can process multiple disputes at once
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
    const { leadIds, action } = body;

    // Validation
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'leadIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    const disputeStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // Update all leads
    const result = await prisma.lead.updateMany({
      where: {
        id: { in: leadIds },
      },
      data: {
        disputeStatus: disputeStatus as any,
        disputeResolvedAt: new Date(),
        disputeResolvedBy: session.value,
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
            field: 'disputeStatus',
            oldValue: 'PENDING',
            newValue: disputeStatus,
            reason: `Bulk dispute ${action}: ${leadIds.length} leads`,
          },
        })
      )
    );

    // TODO: Send webhooks to tenant apps
    // for (const lead of leads) {
    //   await sendWebhook(lead.orgId, 'lead.dispute.resolved', {
    //     leadId: lead.id,
    //     resolution: disputeStatus,
    //   });
    // }

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} disputes ${action}d successfully`,
    });
  } catch (error) {
    console.error('Error in bulk-dispute handler:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

