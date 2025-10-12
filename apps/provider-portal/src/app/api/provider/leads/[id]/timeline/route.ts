import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// GET /api/provider/leads/[id]/timeline - Get activity timeline for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookie = request.cookies.get('rs_provider')?.value;
    
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all audit events for this lead
    const events = await prisma.auditEvent.findMany({
      where: {
        OR: [
          { entityId: id },
          {
            metadata: {
              path: ['leadIds'],
              array_contains: [id],
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Transform events into timeline format
    const timeline = events.map((event) => ({
      id: event.id,
      action: event.action,
      actorType: event.actorType,
      actorId: event.actorId,
      timestamp: event.createdAt,
      metadata: event.metadata,
      description: generateEventDescription(event),
    }));

    return NextResponse.json({ timeline });
  } catch (error) {
    console.error('Error fetching lead timeline:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateEventDescription(event: any): string {
  const metadata = event.metadata as any;
  
  switch (event.action) {
    case 'lead_created':
      return `Lead created from ${metadata?.sourceType || 'unknown source'}`;
    
    case 'lead_status_changed':
      return `Status changed from ${metadata?.oldStatus || 'unknown'} to ${metadata?.newStatus || 'unknown'}`;
    
    case 'lead_dispute_filed':
      return `Dispute filed: ${metadata?.reason || 'No reason provided'}`;
    
    case 'lead_dispute_resolved':
      return `Dispute resolved: ${metadata?.resolution || 'No resolution details'}`;
    
    case 'lead_classified':
      return `Classified as ${metadata?.classificationType || 'unknown'}: ${metadata?.reason || ''}`;
    
    case 'lead_quality_scored':
      return `Quality score set to ${metadata?.score || 'N/A'}: ${metadata?.notes || ''}`;
    
    case 'lead_converted':
      return `Lead converted to customer`;
    
    case 'lead_updated':
      return `Lead details updated`;
    
    case 'bulk_status_update':
      return `Bulk status update to ${metadata?.data?.status || 'unknown'}`;
    
    case 'bulk_dispute_update':
      return `Bulk dispute status update`;
    
    case 'bulk_classification_update':
      return `Bulk classification update`;
    
    case 'bulk_quality_score_update':
      return `Bulk quality score update`;
    
    case 'bulk_add_notes':
      return `Notes added via bulk operation`;
    
    case 'bulk_delete':
      return `Lead deleted via bulk operation`;
    
    case 'lead_exported':
      return `Lead included in export`;
    
    case 'lead_email_sent':
      return `Email sent: ${metadata?.subject || 'No subject'}`;
    
    default:
      return `${event.action.replace(/_/g, ' ')}`;
  }
}

