import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// POST /api/provider/leads/bulk-operations - Bulk update, assign, or delete leads
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const { operation, leadIds, data } = await request.json();

    if (!operation || !leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let result;
    let auditAction = '';

    switch (operation) {
      case 'updateStatus':
        if (!data?.status) {
          return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }
        result = await prisma.lead.updateMany({
          where: { id: { in: leadIds } },
          data: { status: data.status },
        });
        auditAction = 'bulk_status_update';
        break;

      case 'updateDisputeStatus':
        if (!data?.disputeStatus) {
          return NextResponse.json({ error: 'Dispute status is required' }, { status: 400 });
        }
        result = await prisma.lead.updateMany({
          where: { id: { in: leadIds } },
          data: {
            disputeStatus: data.disputeStatus,
            disputeReason: data.disputeReason || null,
            disputeResolvedAt: data.disputeStatus === 'RESOLVED' ? new Date() : null,
          },
        });
        auditAction = 'bulk_dispute_update';
        break;

      case 'updateClassification':
        if (!data?.classificationType) {
          return NextResponse.json({ error: 'Classification type is required' }, { status: 400 });
        }
        result = await prisma.lead.updateMany({
          where: { id: { in: leadIds } },
          data: {
            classificationType: data.classificationType,
            classificationReason: data.classificationReason || null,
            classifiedAt: new Date(),
          },
        });
        auditAction = 'bulk_classification_update';
        break;

      case 'updateQualityScore':
        if (data?.qualityScore === undefined) {
          return NextResponse.json({ error: 'Quality score is required' }, { status: 400 });
        }
        result = await prisma.lead.updateMany({
          where: { id: { in: leadIds } },
          data: {
            qualityScore: data.qualityScore,
            qualityNotes: data.qualityNotes || null,
            qualityScoredAt: new Date(),
          },
        });
        auditAction = 'bulk_quality_score_update';
        break;

      case 'delete':
        result = await prisma.lead.deleteMany({
          where: { id: { in: leadIds } },
        });
        auditAction = 'bulk_delete';
        break;

      case 'addNotes':
        if (!data?.notes) {
          return NextResponse.json({ error: 'Notes are required' }, { status: 400 });
        }
        // For notes, we need to update each lead individually to append
        const leads = await prisma.lead.findMany({
          where: { id: { in: leadIds } },
          select: { id: true, notes: true },
        });
        
        await Promise.all(
          leads.map((lead: any) =>
            prisma.lead.update({
              where: { id: lead.id },
              data: {
                notes: lead.notes
                  ? `${lead.notes}\n\n[${new Date().toISOString()}] ${data.notes}`
                  : `[${new Date().toISOString()}] ${data.notes}`,
              },
            })
          )
        );
        result = { count: leads.length };
        auditAction = 'bulk_add_notes';
        break;

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    // Create audit event
    await prisma.auditEvent.create({
      data: {
        action: auditAction,
        entityType: 'lead',
        entityId: 'bulk',
        actorType: 'provider',
        actorId: email,
        metadata: {
          leadIds,
          operation,
          data,
          count: result.count || leadIds.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count || leadIds.length,
      operation,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

