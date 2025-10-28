/**
 * Cost Alerts API
 * 
 * Manage cost alerts for AI/SMS usage monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import {
  listCostAlerts,
  createCostAlert,
  updateCostAlert,
  deleteCostAlert,
  getUsageSummary,
} from '@/lib/cost-alerts';

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await listCostAlerts(authContext.orgId);
    return NextResponse.json({ ok: true, alerts });
  } catch (error: any) {
    console.error('Error fetching cost alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost alerts', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertType, threshold, period, email, webhookUrl } = body;

    // Validate required fields
    if (!alertType || !threshold || !period || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: alertType, threshold, period, email' },
        { status: 400 }
      );
    }

    // Validate alert type
    if (!['AI_USAGE', 'SMS_USAGE', 'TOTAL_USAGE'].includes(alertType)) {
      return NextResponse.json(
        { error: 'Invalid alertType. Must be AI_USAGE, SMS_USAGE, or TOTAL_USAGE' },
        { status: 400 }
      );
    }

    // Validate period
    if (!['DAILY', 'WEEKLY', 'MONTHLY'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be DAILY, WEEKLY, or MONTHLY' },
        { status: 400 }
      );
    }

    // Validate threshold (must be positive)
    if (threshold <= 0) {
      return NextResponse.json(
        { error: 'Threshold must be greater than 0' },
        { status: 400 }
      );
    }

    const alert = await createCostAlert(
      authContext.orgId,
      alertType,
      threshold,
      period,
      email,
      webhookUrl
    );

    return NextResponse.json({ ok: true, alert }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating cost alert:', error);
    return NextResponse.json(
      { error: 'Failed to create cost alert', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, ...updates } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Missing required field: alertId' },
        { status: 400 }
      );
    }

    const alert = await updateCostAlert(alertId, updates);
    return NextResponse.json({ ok: true, alert });
  } catch (error: any) {
    console.error('Error updating cost alert:', error);
    return NextResponse.json(
      { error: 'Failed to update cost alert', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json(
        { error: 'Missing required parameter: alertId' },
        { status: 400 }
      );
    }

    await deleteCostAlert(alertId);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting cost alert:', error);
    return NextResponse.json(
      { error: 'Failed to delete cost alert', details: error.message },
      { status: 500 }
    );
  }
}

