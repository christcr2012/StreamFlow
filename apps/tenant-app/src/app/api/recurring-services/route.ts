// apps/tenant-app/src/app/api/recurring-services/route.ts
// Recurring services API - Phase 1

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TODO Phase 2: Real Prisma query from RecurringService table
const stubRecurringServices = [
  {
    id: 'rec-001',
    customerId: 'cust-123',
    customerName: 'Sarah Johnson',
    serviceName: 'Quarterly HVAC Maintenance',
    frequency: 'quarterly',
    price: 249.99,
    status: 'active',
    nextServiceDate: '2025-04-15',
    lastServiceDate: '2025-01-15',
    startDate: '2024-01-15',
    contractEndDate: '2025-12-31',
    autoRenew: true,
    totalServices: 4,
    completedServices: 1,
  },
  {
    id: 'rec-002',
    customerId: 'cust-124',
    customerName: 'Mike Rodriguez',
    serviceName: 'Monthly Filter Replacement',
    frequency: 'monthly',
    price: 79.99,
    status: 'active',
    nextServiceDate: '2025-02-10',
    lastServiceDate: '2025-01-10',
    startDate: '2024-06-10',
    contractEndDate: null,
    autoRenew: true,
    totalServices: 12,
    completedServices: 8,
  },
  {
    id: 'rec-003',
    customerId: 'cust-125',
    customerName: 'Emily Chen',
    serviceName: 'Annual System Inspection',
    frequency: 'yearly',
    price: 399.99,
    status: 'paused',
    nextServiceDate: '2025-06-20',
    lastServiceDate: '2024-06-20',
    startDate: '2023-06-20',
    contractEndDate: '2026-06-20',
    autoRenew: false,
    totalServices: 1,
    completedServices: 2,
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const frequency = searchParams.get('frequency');

    let filtered = [...stubRecurringServices];

    if (status && status !== 'all') {
      filtered = filtered.filter((service) => service.status === status);
    }

    if (frequency && frequency !== 'all') {
      filtered = filtered.filter((service) => service.frequency === frequency);
    }

    return NextResponse.json({
      recurringServices: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error('Failed to fetch recurring services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring services' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // TODO Phase 2: Save to RecurringService table
    // TODO Phase 2: Set up automatic job creation schedule
    // TODO Phase 2: Send customer confirmation email

    const newService = {
      id: `rec-${Date.now()}`,
      customerId: body.customerId,
      customerName: body.customerName,
      serviceName: body.serviceName,
      frequency: body.frequency,
      price: body.price,
      status: 'active',
      nextServiceDate: body.nextServiceDate,
      lastServiceDate: null,
      startDate: new Date().toISOString(),
      contractEndDate: body.contractEndDate || null,
      autoRenew: body.autoRenew || false,
      totalServices: body.totalServices || 1,
      completedServices: 0,
    };

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error('Failed to create recurring service:', error);
    return NextResponse.json(
      { error: 'Failed to create recurring service' },
      { status: 500 }
    );
  }
}
