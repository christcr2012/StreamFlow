/**
 * Provider Portal - AI Alerts API (PHASE 1 STUB)
 */

import { NextResponse } from 'next/server';

export async function GET() {
  console.log('[STUB][provider] GET /api/ai/alerts');
  return NextResponse.json({
    alerts: [
      {
        id: 'prov-alert-1',
        orgId: 'org_001',
        severity: 'warning',
        type: 'budget_threshold',
        message: 'Tenant Acme Corp reached 80% of budget',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        acknowledged: false
      },
      {
        id: 'prov-alert-2',
        orgId: 'org_042',
        severity: 'critical',
        type: 'spend_burst',
        message: 'Spend anomaly detected for Org Contoso',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        acknowledged: false
      }
    ]
  });
}

export async function PUT(req: Request) {
  const body = await req.json();
  console.log('[STUB][provider] PUT /api/ai/alerts', body);
  return NextResponse.json({ success: true, acknowledged: body?.ids || [] });
}

export async function POST(req: Request) {
  const body = await req.json();
  console.log('[STUB][provider] POST /api/ai/alerts', body);
  return NextResponse.json({ success: true, created: { id: 'prov-alert-new', ...body, createdAt: new Date().toISOString() } });
}
