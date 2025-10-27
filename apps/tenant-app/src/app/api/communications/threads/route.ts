/**
 * Communication Threads API - PHASE 2
 * 
 * Manages conversation threads with customers
 * Issue: #259 - Type 2 Communications System
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'active';
    
    // Query threads with customer details
    const threads = await prisma.communicationThread.findMany({
      where: { 
        orgId: authContext.orgId,
        status
      },
      include: {
        Customer: {
          select: {
            id: true,
            primaryName: true,
            primaryEmail: true,
            primaryPhone: true,
            company: true
          }
        },
        _count: {
          select: {
            Communications: true
          }
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: limit
    });

    // Calculate total unread across all threads
    const unreadTotal = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

    // Transform to API response format
    const formattedThreads = threads.map(thread => ({
      id: thread.id,
      contactId: thread.contactId,
      contact: {
        id: thread.Customer.id,
        primaryName: thread.Customer.primaryName,
        primaryEmail: thread.Customer.primaryEmail,
        primaryPhone: thread.Customer.primaryPhone,
        company: thread.Customer.company
      },
      subject: thread.subject,
      lastMessageAt: thread.lastMessageAt,
      lastMessagePreview: thread.lastMessagePreview,
      unreadCount: thread.unreadCount,
      participants: thread.participants as string[],
      metadata: thread.metadata as Record<string, any>,
      messageCount: thread._count.Communications
    }));

    return NextResponse.json({
      threads: formattedThreads,
      total: threads.length,
      unreadTotal
    });
  } catch (error: any) {
    console.error('GET /api/communications/threads error:', error);
    const { createSafeErrorResponse } = await import('@/lib/error-handler');
    return createSafeErrorResponse(error, 'GET /api/communications/threads');
  }
}

export async function POST(req: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, action } = body;
    
    if (action === 'mark_read') {
      // Verify thread belongs to this org
      const thread = await prisma.communicationThread.findUnique({
        where: { id: threadId },
        select: { orgId: true }
      });

      if (!thread || thread.orgId !== authContext.orgId) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }

      // Mark all messages in thread as read
      await prisma.communicationThread.update({
        where: { id: threadId },
        data: { unreadCount: 0 }
      });
      
      return NextResponse.json({
        success: true,
        threadId,
        unreadCount: 0
      });
    }

    if (action === 'archive') {
      // Verify thread belongs to this org
      const thread = await prisma.communicationThread.findUnique({
        where: { id: threadId },
        select: { orgId: true }
      });

      if (!thread || thread.orgId !== authContext.orgId) {
        return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
      }

      await prisma.communicationThread.update({
        where: { id: threadId },
        data: { status: 'archived' }
      });

      return NextResponse.json({
        success: true,
        threadId,
        status: 'archived'
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Supported: mark_read, archive' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('POST /api/communications/threads error:', error);
    const { createSafeErrorResponse } = await import('@/lib/error-handler');
    return createSafeErrorResponse(error, 'POST /api/communications/threads');
  }
}
