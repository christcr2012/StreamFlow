/**
 * Preview Environment Seed Script
 * 
 * Seeds sample data for Neon preview branches to enable realistic testing
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding preview environment...');
  
  // Create test organization
  const org = await prisma.org.upsert({
    where: { id: 'preview-org-1' },
    update: {},
    create: {
      id: 'preview-org-1',
      name: 'Preview Test Company',
      vertical: 'CLEANING',
      settingsJson: JSON.stringify({
        timezone: 'America/Los_Angeles',
        currency: 'USD',
      }),
    },
  });
  
  console.log('✅ Created organization:', org.name);
  
  // Create test staff
  const passwordHash = await hash('preview123', 10);
  
  const staff = await prisma.staff.upsert({
    where: { email: 'staff@preview.test' },
    update: {},
    create: {
      email: 'staff@preview.test',
      name: 'Preview Staff Member',
      orgId: org.id,
      role: 'STAFF',
      passwordHash,
    },
  });
  
  console.log('✅ Created staff:', staff.email);
  
  // Create test customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 'preview-customer-1' },
      update: {},
      create: {
        id: 'preview-customer-1',
        name: 'Acme Corporation',
        email: 'contact@acme.test',
        phone: '555-0001',
        orgId: org.id,
      },
    }),
    prisma.customer.upsert({
      where: { id: 'preview-customer-2' },
      update: {},
      create: {
        id: 'preview-customer-2',
        name: 'Tech Startup Inc',
        email: 'hello@techstartup.test',
        phone: '555-0002',
        orgId: org.id,
      },
    }),
  ]);
  
  console.log('✅ Created customers:', customers.length);
  
  // Create test contracts
  const contracts = await Promise.all(
    customers.map((customer, i) =>
      prisma.contract.upsert({
        where: { id: `preview-contract-${i + 1}` },
        update: {},
        create: {
          id: `preview-contract-${i + 1}`,
          customerId: customer.id,
          orgId: org.id,
          status: 'ACTIVE',
          startDate: new Date(),
          frequency: 'WEEKLY',
          priceCents: 15000 + i * 5000,
        },
      })
    )
  );
  
  console.log('✅ Created contracts:', contracts.length);
  
  // Create test work orders
  const now = new Date();
  const workOrders = [];
  
  for (let i = 0; i < 10; i++) {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(now.getDate() - 7 + i);
    
    const wo = await prisma.workOrder.create({
      data: {
        contractId: contracts[i % contracts.length].id,
        orgId: org.id,
        scheduledAt,
        status: i < 7 ? 'COMPLETED' : 'SCHEDULED',
        assignedToId: staff.id,
        completedAt: i < 7 ? new Date(scheduledAt.getTime() + 2 * 60 * 60 * 1000) : null,
      },
    });
    
    workOrders.push(wo);
  }
  
  console.log('✅ Created work orders:', workOrders.length);
  
  // Create test inspections
  const inspections = [];
  
  for (let i = 0; i < 5; i++) {
    const inspection = await prisma.inspection.create({
      data: {
        workOrderId: workOrders[i].id,
        orgId: org.id,
        score: 75 + Math.floor(Math.random() * 25),
        checklistJson: JSON.stringify({
          items: [
            { name: 'Floors cleaned', passed: true },
            { name: 'Windows cleaned', passed: true },
            { name: 'Trash removed', passed: Math.random() > 0.3 },
          ],
        }),
      },
    });
    
    inspections.push(inspection);
  }
  
  console.log('✅ Created inspections:', inspections.length);
  
  // Create test invoices
  const invoices = [];
  
  for (let i = 0; i < 3; i++) {
    const invoice = await prisma.invoice.create({
      data: {
        orgId: org.id,
        customerId: customers[i % customers.length].id,
        totalCents: 15000 + i * 5000,
        status: i === 0 ? 'PAID' : i === 1 ? 'PENDING' : 'OVERDUE',
        dueDate: new Date(now.getTime() + (i - 1) * 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    invoices.push(invoice);
  }
  
  console.log('✅ Created invoices:', invoices.length);
  
  // Create test assets
  const assets = await Promise.all([
    prisma.asset.upsert({
      where: { id: 'preview-asset-1' },
      update: {},
      create: {
        id: 'preview-asset-1',
        orgId: org.id,
        name: 'Truck #1',
        type: 'VEHICLE',
        status: 'ACTIVE',
      },
    }),
    prisma.asset.upsert({
      where: { id: 'preview-asset-2' },
      update: {},
      create: {
        id: 'preview-asset-2',
        orgId: org.id,
        name: 'Truck #2',
        type: 'VEHICLE',
        status: 'ACTIVE',
      },
    }),
  ]);
  
  console.log('✅ Created assets:', assets.length);
  
  // Refresh materialized views if they exist
  try {
    await prisma.$executeRaw`SELECT refresh_all_analytics_views()`;
    console.log('✅ Refreshed materialized views');
  } catch (error) {
    console.log('⚠️  Materialized views not yet created (run migrations first)');
  }
  
  console.log('');
  console.log('🎉 Preview environment seeded successfully!');
  console.log('');
  console.log('Test credentials:');
  console.log('  Email: staff@preview.test');
  console.log('  Password: preview123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error seeding preview environment:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

