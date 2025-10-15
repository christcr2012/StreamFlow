import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

// POST /api/provider/leads/send-email - Send email to leads
export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get('rs_provider')?.value;
    if (!cookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = decodeURIComponent(cookie);
    const { leadIds, subject, body, fromName, fromEmail } = await request.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'Lead IDs are required' }, { status: 400 });
    }

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    // Get leads with email addresses
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        email: { not: null },
      },
      select: {
        id: true,
        email: true,
        contactName: true,
        company: true,
      },
    });

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads with email addresses found' }, { status: 400 });
    }

    // Check if SendGrid is configured
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendGridApiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Send emails via SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(sendGridApiKey);

    const results = await Promise.allSettled(
      leads.map(async (lead) => {
        const personalizedBody = body
          .replace(/\{contactName\}/g, lead.contactName || 'there')
          .replace(/\{company\}/g, lead.company || 'your company');

        const msg = {
          to: lead.email!,
          from: fromEmail || process.env.SENDGRID_FROM_EMAIL || 'noreply@cortiware.com',
          subject,
          text: personalizedBody,
          html: personalizedBody.replace(/\n/g, '<br>'),
        };

        await sgMail.send(msg);

        // Create audit event for each email
        await prisma.auditEvent.create({
          data: {
            action: 'lead_email_sent',
            entityType: 'lead',
            entityId: lead.id,
            actorType: 'provider',
            actorId: email,
            metadata: {
              subject,
              to: lead.email,
              fromName,
              fromEmail,
            },
          },
        });

        return { leadId: lead.id, email: lead.email, success: true };
      })
    );

    const successful = results.filter((r: any) => r.status === 'fulfilled').length;
    const failed = results.filter((r: any) => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: leads.length,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

