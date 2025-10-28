/**
 * AI Alerts API - PHASE 1 STUB
 * 
 * Manages AI budget alerts and notifications
 * Issue: #257 - AI Cost Management for Tenant Portal
 * 
 * Phase 1: Returns stub/placeholder data
 * Phase 2: Will query/update real AIAlert data
 */

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const acknowledged = searchParams.get('acknowledged');
  
  console.log('[STUB] GET /api/ai/alerts - acknowledged:', acknowledged);
  
  // TODO Phase 2: Query real alerts from AIAlert table
  // const alerts = await prisma.aIAlert.findMany({
  //   where: {
  //     orgId: session.user.orgId,
  //     acknowledged: acknowledged === 'false' ? false : undefined
  //   },
  //   orderBy: { createdAt: 'desc' }
  // });
  
  // STUB: Return placeholder alerts
  return NextResponse.json({
    alerts: [
      {
        id: 'alert_stub_1',
        alertType: 'budget_threshold',
        message: 'AI spending has reached 80% of monthly budget ($80.00 of $100.00)',
        severity: 'warning',
        metadata: {
          currentSpend: 80.00,
          budget: 100.00,
          percentUsed: 80
        },
        acknowledged: false,
        createdAt: '2025-10-25T14:30:00Z'
      },
      {
        id: 'alert_stub_2',
        alertType: 'unusual_spike',
        message: 'Unusual spike in AI usage detected - 3x normal daily average',
        severity: 'info',
        metadata: {
          dailyAverage: 5.50,
          todaySpend: 16.50,
          multiplier: 3
        },
        acknowledged: true,
        acknowledgedBy: 'user_123',
        acknowledgedAt: '2025-10-24T10:15:00Z',
        createdAt: '2025-10-24T09:30:00Z'
      }
    ],
    unreadCount: 1
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { alertId, acknowledged } = body;
  
  console.log('[STUB] PUT /api/ai/alerts - acknowledge alert:', alertId);
  
  // TODO Phase 2: Update AIAlert in database
  // await prisma.aIAlert.update({
  //   where: { id: alertId },
  //   data: {
  //     acknowledged: true,
  //     acknowledgedBy: session.user.id,
  //     acknowledgedAt: new Date()
  //   }
  // });
  
  // STUB: Return success
  return NextResponse.json({
    success: true,
    alertId,
    acknowledged: true,
    acknowledgedAt: new Date().toISOString()
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body;
  
  if (action === 'acknowledge_all') {
    console.log('[STUB] POST /api/ai/alerts - acknowledge all');
    
    // TODO Phase 2: Acknowledge all unread alerts
    // await prisma.aIAlert.updateMany({
    //   where: {
    //     orgId: session.user.orgId,
    //     acknowledged: false
    //   },
    //   data: {
    //     acknowledged: true,
    //     acknowledgedBy: session.user.id,
    //     acknowledgedAt: new Date()
    //   }
    // });
    
    return NextResponse.json({
      success: true,
      message: 'All alerts acknowledged',
      count: 1
    });
  }
  
  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}
