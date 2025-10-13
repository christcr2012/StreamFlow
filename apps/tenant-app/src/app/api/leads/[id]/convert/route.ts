import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import { ConvertLeadSchema } from '@/lib/validations/lead';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const body = await request.json();
    const data = ConvertLeadSchema.parse(body);

    // Fetch lead
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, orgId: authContext.orgId! },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'Lead already converted' },
        { status: 400 }
      );
    }

    // Create customer from lead
    const customer = await prisma.customer.create({
      data: {
        orgId: authContext.orgId!,
        publicId: `cust_${nanoid(12)}`,
        company: lead.company || undefined,
        primaryName: lead.contactName || undefined,
        primaryEmail: lead.email || undefined,
        primaryPhone: lead.phoneE164 || undefined,
        notes: lead.notes || undefined,
        tags: [],
        billingSettings: {} as any,
      },
    });

    // Optionally create job
    let job = null;
    if (data.createJob && data.jobTitle) {
      job = await prisma.job.create({
        data: {
          orgId: authContext.orgId!,
          customerId: customer.id,
          title: data.jobTitle,
          status: 'scheduled',
          scheduledAt: data.jobScheduledAt ? new Date(data.jobScheduledAt) : null,
          assignees: [],
          timeline: {
            create: {
              eventType: 'created',
              description: `Job created from lead conversion`,
              metadata: { leadId },
              userId: authContext.userId,
            },
          },
        },
      });
    }

    // Update lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
        convertedToCustomerId: customer.id,
      },
    });

    return NextResponse.json({
      customer,
      job,
      message: 'Lead converted successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/leads/[id]/convert error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

