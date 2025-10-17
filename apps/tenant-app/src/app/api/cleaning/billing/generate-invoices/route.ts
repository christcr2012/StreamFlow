/**
 * Cleaning Billing - Generate Invoices API
 * 
 * POST /api/cleaning/billing/generate-invoices - Generate invoices for completed work orders
 * 
 * This endpoint is designed to be called by a cron job (nightly)
 * to generate invoices for completed work orders that haven't been billed yet.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-context';

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    
    // Allow both authenticated users and cron jobs
    const cronSecret = request.headers.get('x-cron-secret');
    const isValidCron = cronSecret === process.env.CRON_SECRET;
    
    if (!authContext.isAuthenticated && !isValidCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get billing period from request or use default (last 24 hours)
    const body = await request.json().catch(() => ({}));
    const hoursBack = body.hoursBack || 24;
    
    const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    // Find completed work orders
    const workOrders = await prisma.cleaningWorkOrder.findMany({
      where: {
        status: 'COMPLETED',
        actualEnd: { gte: cutoffDate }
      }
    });

    // Get contracts for these work orders
    const contractIds = [...new Set(workOrders.map(wo => wo.contractId).filter(Boolean))];
    const contracts = await prisma.cleaningContract.findMany({
      where: {
        id: { in: contractIds as string[] }
      },
      include: { CleaningEstimate: {
          select: { CleaningLead: {
              select: {
                contactName: true,
                email: true,
                company: true
              }
            }
          }
        }
      }
    });

    const contractMap = new Map(contracts.map(c => [c.id, c]));

    let invoicesCreated = 0;
    let itemsCreated = 0;
    const errors: string[] = [];

    // Group work orders by customer/contract
    const workOrdersByCustomer = new Map<string, typeof workOrders>();

    for (const wo of workOrders) {
      const contract = wo.contractId ? contractMap.get(wo.contractId) : null;
      const key = contract?.customerId || wo.contractId || wo.orgId;
      if (!workOrdersByCustomer.has(key)) {
        workOrdersByCustomer.set(key, []);
      }
      workOrdersByCustomer.get(key)!.push(wo);
    }

    // Create invoices for each customer
    for (const [customerId, customerWorkOrders] of workOrdersByCustomer) {
      try {
        const firstWO = customerWorkOrders[0];
        const contract = firstWO.contractId ? contractMap.get(firstWO.contractId) : null;

        if (!contract) {
          errors.push(`Work order ${firstWO.id}: No contract found`);
          continue;
        }

        // Calculate total amount
        const subtotal = customerWorkOrders.reduce((sum, wo) => {
          return sum + Number(contract.basePrice);
        }, 0);

        const taxRate = Number(contract.taxRate || 0) / 100;
        const taxAmount = subtotal * taxRate;
        const total = subtotal + taxAmount;

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            orgId: firstWO.orgId,
            amount: total.toFixed(2),
            status: 'open',
            issuedAt: new Date(),
            items: JSON.stringify(
              customerWorkOrders.map(wo => ({
                description: `Cleaning service - ${wo.spaceType} (${wo.squareFeet} sq ft)`,
                date: wo.scheduledDate.toISOString().split('T')[0],
                workOrderId: wo.id,
                quantity: 1,
                unitPrice: Number(contract.basePrice),
                total: Number(contract.basePrice)
              }))
            )
          }
        });

        invoicesCreated++;
        itemsCreated += customerWorkOrders.length;

        // Log activity
        await prisma.activity.create({
          data: {
            orgId: firstWO.orgId,
            actorType: 'system',
            actorId: 'billing-cron',
            entityType: 'invoice',
            entityId: invoice.id,
            action: 'created',
            meta: JSON.stringify({
              workOrderCount: customerWorkOrders.length,
              subtotal,
              taxAmount,
              total,
              customerId
            })
          }
        });
      } catch (error) {
        console.error(`Error creating invoice for customer ${customerId}:`, error);
        errors.push(`Customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        workOrdersProcessed: workOrders.length,
        invoicesCreated,
        itemsCreated,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error generating invoices:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoices' },
      { status: 500 }
    );
  }
}

