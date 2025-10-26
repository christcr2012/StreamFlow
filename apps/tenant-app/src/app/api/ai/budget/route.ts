/**
 * AI Budget Management API - PHASE 1 STUB
 * 
 * Manages AI spending budgets and alerts
 * Issue: #257 - AI Cost Management for Tenant Portal
 * 
 * Phase 1: Returns stub/placeholder data
 * Phase 2: Will query/update real AIBudget data
 */

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  console.log('[STUB] GET /api/ai/budget');
  
  // TODO Phase 2: Query real budget from AIBudget table
  // const budget = await prisma.aIBudget.findUnique({
  //   where: { orgId: session.user.orgId }
  // });
  
  // STUB: Return placeholder budget data
  return NextResponse.json({
    id: 'budget_stub_123',
    monthlyBudget: 100.00,
    currentSpend: 45.67,
    alertThreshold: 80,
    hardLimit: false,
    resetDay: 1,
    status: 'healthy', // 'healthy', 'warning', 'exceeded'
    alerts: [
      {
        id: 'alert_stub_1',
        type: 'budget_threshold',
        message: 'No alerts - spending is under control',
        createdAt: new Date().toISOString(),
        acknowledged: true
      }
    ],
    recommendations: [
      'Consider upgrading to a higher AI plan for better rates',
      'GPT-3.5-turbo can handle 70% of your use cases at 1/10th the cost'
    ]
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { monthlyBudget, alertThreshold, hardLimit, resetDay } = body;
  
  console.log('[STUB] PUT /api/ai/budget - updating budget:', body);
  
  // TODO Phase 2: Update AIBudget in database
  // const budget = await prisma.aIBudget.upsert({
  //   where: { orgId: session.user.orgId },
  //   update: { monthlyBudget, alertThreshold, hardLimit, resetDay },
  //   create: {
  //     orgId: session.user.orgId,
  //     monthlyBudget,
  //     alertThreshold,
  //     hardLimit,
  //     resetDay
  //   }
  // });
  
  // STUB: Return success
  return NextResponse.json({
    success: true,
    budget: {
      id: 'budget_stub_123',
      monthlyBudget,
      alertThreshold,
      hardLimit,
      resetDay,
      updatedAt: new Date().toISOString()
    }
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { action } = body;
  
  if (action === 'reset') {
    console.log('[STUB] POST /api/ai/budget - reset monthly spend');
    
    // TODO Phase 2: Reset currentSpend in AIBudget
    // await prisma.aIBudget.update({
    //   where: { orgId: session.user.orgId },
    //   data: { currentSpend: 0 }
    // });
    
    return NextResponse.json({
      success: true,
      message: 'Monthly spend reset to $0.00'
    });
  }
  
  return NextResponse.json(
    { error: 'Invalid action' },
    { status: 400 }
  );
}
