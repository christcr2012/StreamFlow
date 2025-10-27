// apps/tenant-app/src/app/api/vertical-packs/route.ts
// Vertical packs configuration API - Phase 1

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// TODO Phase 2: Real Prisma query from VerticalPack, ProviderConfig tables
const stubVerticalPacks = [
  {
    id: 'vp-hvac',
    name: 'HVAC Services',
    description: 'Heating, ventilation, and air conditioning services',
    icon: '❄️',
    category: 'Trade Services',
    active: true,
    features: [
      'Equipment tracking',
      'Refrigerant logs',
      'EPA compliance',
      'Seasonal maintenance schedules',
    ],
    customFields: [
      { name: 'System Type', type: 'select', options: ['Central AC', 'Heat Pump', 'Ductless'] },
      { name: 'Refrigerant Type', type: 'text' },
      { name: 'Tonnage', type: 'number' },
    ],
  },
  {
    id: 'vp-plumbing',
    name: 'Plumbing Services',
    description: 'Residential and commercial plumbing',
    icon: '🔧',
    category: 'Trade Services',
    active: false,
    features: [
      'Pipe size calculator',
      'Water heater specs',
      'Drain cleaning logs',
      'Emergency service tracking',
    ],
    customFields: [
      { name: 'Fixture Type', type: 'select', options: ['Sink', 'Toilet', 'Water Heater'] },
      { name: 'Pipe Material', type: 'text' },
      { name: 'Water Pressure', type: 'number' },
    ],
  },
  {
    id: 'vp-electrical',
    name: 'Electrical Services',
    description: 'Electrical installation and repair',
    icon: '⚡',
    category: 'Trade Services',
    active: false,
    features: [
      'Circuit breaker tracking',
      'Load calculations',
      'NEC code compliance',
      'Permit management',
    ],
    customFields: [
      { name: 'Panel Type', type: 'text' },
      { name: 'Amperage', type: 'number' },
      { name: 'Voltage', type: 'select', options: ['120V', '240V', '480V'] },
    ],
  },
  {
    id: 'vp-landscaping',
    name: 'Landscaping',
    description: 'Lawn care and landscaping services',
    icon: '🌱',
    category: 'Home Services',
    active: false,
    features: [
      'Property measurements',
      'Seasonal service plans',
      'Equipment tracking',
      'Chemical application logs',
    ],
    customFields: [
      { name: 'Property Size', type: 'number' },
      { name: 'Grass Type', type: 'text' },
      { name: 'Irrigation System', type: 'checkbox' },
    ],
  },
  {
    id: 'vp-pool',
    name: 'Pool Services',
    description: 'Pool maintenance and repair',
    icon: '🏊',
    category: 'Home Services',
    active: false,
    features: [
      'Chemical balance tracking',
      'Equipment maintenance logs',
      'Water testing schedules',
      'Seasonal opening/closing',
    ],
    customFields: [
      { name: 'Pool Type', type: 'select', options: ['In-ground', 'Above-ground', 'Spa'] },
      { name: 'Gallons', type: 'number' },
      { name: 'Sanitizer Type', type: 'select', options: ['Chlorine', 'Salt', 'Bromine'] },
    ],
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    let filtered = [...stubVerticalPacks];

    if (category && category !== 'all') {
      filtered = filtered.filter((vp) => vp.category === category);
    }

    if (active === 'true') {
      filtered = filtered.filter((vp) => vp.active);
    } else if (active === 'false') {
      filtered = filtered.filter((vp) => !vp.active);
    }

    return NextResponse.json({
      verticalPacks: filtered,
      total: filtered.length,
      activeCount: stubVerticalPacks.filter((vp) => vp.active).length,
    });
  } catch (error) {
    console.error('Failed to fetch vertical packs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vertical packs' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, active } = body;

    // TODO Phase 2: Update ProviderConfig with activated vertical packs
    // TODO Phase 2: Apply vertical-specific customizations to schema

    return NextResponse.json({
      id,
      active,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to update vertical pack:', error);
    return NextResponse.json(
      { error: 'Failed to update vertical pack' },
      { status: 500 }
    );
  }
}
