/**
 * Communications API - PHASE 1 STUB
 * 
 * Type 2 Communications: Client-to-Customer Messaging
 * Issue: #259 - Type 2 Communications System
 * 
 * Phase 1: Returns stub/placeholder data
 * Phase 2: Will integrate with Twilio/Resend and save to Communication table
 */

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get('contactId');
  const type = searchParams.get('type'); // 'sms', 'email', 'all'
  
  console.log('[STUB] GET /api/communications - contactId:', contactId, 'type:', type);
  
  // TODO Phase 2: Query real communications from Communication table
  // const communications = await prisma.communication.findMany({
  //   where: {
  //     orgId: session.user.orgId,
  //     contactId: contactId || undefined,
  //     type: type !== 'all' ? type : undefined
  //   },
  //   include: {
  //     Customer: true,
  //     User: true
  //   },
  //   orderBy: { createdAt: 'desc' },
  //   take: 50
  // });
  
  // STUB: Return placeholder communications
  return NextResponse.json({
    communications: [
      {
        id: 'comm_stub_1',
        contactId: 'contact_123',
        contact: {
          id: 'contact_123',
          primaryName: 'John Doe',
          primaryPhone: '+15555551234',
          primaryEmail: 'john@example.com'
        },
        userId: 'user_456',
        user: {
          id: 'user_456',
          name: 'Sarah Manager',
          email: 'sarah@cortiware.com'
        },
        type: 'sms',
        direction: 'outbound',
        content: 'Hi John, your appointment is confirmed for tomorrow at 2pm.',
        status: 'delivered',
        metadata: {
          from: '+15555559999',
          to: '+15555551234'
        },
        createdAt: '2025-10-26T14:30:00Z'
      },
      {
        id: 'comm_stub_2',
        contactId: 'contact_123',
        contact: {
          id: 'contact_123',
          primaryName: 'John Doe',
          primaryPhone: '+15555551234',
          primaryEmail: 'john@example.com'
        },
        userId: null,
        type: 'sms',
        direction: 'inbound',
        content: 'Perfect, thank you!',
        status: 'received',
        metadata: {
          from: '+15555551234',
          to: '+15555559999'
        },
        createdAt: '2025-10-26T14:35:00Z'
      },
      {
        id: 'comm_stub_3',
        contactId: 'contact_456',
        contact: {
          id: 'contact_456',
          primaryName: 'Jane Smith',
          primaryEmail: 'jane@example.com'
        },
        userId: 'user_456',
        user: {
          id: 'user_456',
          name: 'Sarah Manager',
          email: 'sarah@cortiware.com'
        },
        type: 'email',
        direction: 'outbound',
        subject: 'Your Service Estimate',
        content: 'Hi Jane, attached is your estimate for the requested service...',
        status: 'sent',
        metadata: {
          from: 'sarah@cortiware.com',
          to: 'jane@example.com'
        },
        createdAt: '2025-10-26T10:15:00Z'
      }
    ],
    total: 3
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { contactId, type, content, subject, metadata } = body;
  
  console.log('[STUB] POST /api/communications - sending:', {
    contactId,
    type,
    content: content?.substring(0, 50) + '...'
  });
  
  // TODO Phase 2: Send via Twilio (SMS) or Resend (email)
  // if (type === 'sms') {
  //   const twilioClient = getTwilioClient();
  //   const message = await twilioClient.sendSMS(metadata.to, content);
  //   externalId = message.sid;
  // } else if (type === 'email') {
  //   const resendClient = getResendClient();
  //   const email = await resendClient.sendEmail({
  //     to: metadata.to,
  //     from: metadata.from,
  //     subject,
  //     html: content
  //   });
  //   externalId = email.id;
  // }
  
  // TODO Phase 2: Save to Communication table
  // const communication = await prisma.communication.create({
  //   data: {
  //     orgId: session.user.orgId,
  //     contactId,
  //     userId: session.user.id,
  //     type,
  //     direction: 'outbound',
  //     subject,
  //     content,
  //     metadata,
  //     status: 'sent',
  //     externalId
  //   }
  // });
  
  // STUB: Return success
  return NextResponse.json({
    success: true,
    communication: {
      id: `comm_stub_${Date.now()}`,
      contactId,
      type,
      direction: 'outbound',
      content,
      status: 'sent',
      createdAt: new Date().toISOString()
    }
  });
}
