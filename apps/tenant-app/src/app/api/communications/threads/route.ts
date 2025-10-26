/**
 * Communication Threads API - PHASE 1 STUB
 * 
 * Manages conversation threads with customers
 * Issue: #259 - Type 2 Communications System
 * 
 * Phase 1: Returns stub/placeholder data
 * Phase 2: Will query real CommunicationThread data
 */

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log('[STUB] GET /api/communications/threads');
  
  // TODO Phase 2: Query real threads from CommunicationThread table
  // const threads = await prisma.communicationThread.findMany({
  //   where: { orgId: session.user.orgId },
  //   include: {
  //     Customer: {
  //       select: {
  //         id: true,
  //         primaryName: true,
  //         primaryEmail: true,
  //         primaryPhone: true
  //       }
  //     }
  //   },
  //   orderBy: { lastMessageAt: 'desc' },
  //   take: 50
  // });
  
  // STUB: Return placeholder threads
  return NextResponse.json({
    threads: [
      {
        id: 'thread_stub_1',
        contactId: 'contact_123',
        contact: {
          id: 'contact_123',
          primaryName: 'John Doe',
          primaryPhone: '+15555551234',
          primaryEmail: 'john@example.com'
        },
        subject: null,
        lastMessageAt: '2025-10-26T14:35:00Z',
        lastMessagePreview: 'Perfect, thank you!',
        unreadCount: 1,
        participants: ['user_456'],
        metadata: {
          lastMessageType: 'sms',
          lastMessageDirection: 'inbound'
        }
      },
      {
        id: 'thread_stub_2',
        contactId: 'contact_456',
        contact: {
          id: 'contact_456',
          primaryName: 'Jane Smith',
          primaryEmail: 'jane@example.com'
        },
        subject: 'Service Estimate Discussion',
        lastMessageAt: '2025-10-26T10:15:00Z',
        lastMessagePreview: 'Hi Jane, attached is your estimate for the requested service...',
        unreadCount: 0,
        participants: ['user_456'],
        metadata: {
          lastMessageType: 'email',
          lastMessageDirection: 'outbound'
        }
      },
      {
        id: 'thread_stub_3',
        contactId: 'contact_789',
        contact: {
          id: 'contact_789',
          primaryName: 'Bob Johnson',
          primaryPhone: '+15555557890',
          primaryEmail: 'bob@example.com'
        },
        subject: null,
        lastMessageAt: '2025-10-25T16:20:00Z',
        lastMessagePreview: 'Is the technician on the way?',
        unreadCount: 1,
        participants: ['user_456', 'user_789'],
        metadata: {
          lastMessageType: 'sms',
          lastMessageDirection: 'inbound',
          urgent: true
        }
      }
    ],
    total: 3,
    unreadTotal: 2
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { threadId, action } = body;
  
  if (action === 'mark_read') {
    console.log('[STUB] POST /api/communications/threads - mark read:', threadId);
    
    // TODO Phase 2: Update thread unreadCount
    // await prisma.communicationThread.update({
    //   where: { id: threadId },
    //   data: { unreadCount: 0 }
    // });
    
    return NextResponse.json({
      success: true,
      threadId,
      unreadCount: 0
    });
  }
  
  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}
