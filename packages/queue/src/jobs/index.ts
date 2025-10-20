/**
 * Job processor exports
 * Each processor is a function that handles a specific job type
 */

import type { Job } from 'bullmq';
import type {
  CsvImportJob,
  ScheduleExpandJob,
  BillingCloseDayJob,
  InspectionGenerateJob,
  S3ImageProcessJob,
  PdfGenerateJob,
  VendorSyncJob,
  StripeFanoutJob,
} from '../index.js';

// Note: These imports will be resolved at runtime in the worker environment
// The worker has access to the full monorepo via Docker build
declare const require: any;
const { parseFile } = require('../../../src/lib/import/file-parser');
const { processImport } = require('../../../src/lib/import/batch-processor');
const { PrismaClient } = require('@prisma/client');
const { ImportStatus } = require('@prisma/client');
const { RRule } = require('rrule');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// ============================================================================
// Processor Signatures
// ============================================================================

export async function csvImport(job: Job<CsvImportJob>) {
  const { orgId, importJobId, kind, fileContent, fileName, fieldMappings, transformRules, validationRules, batchSize = 100 } = job.data;

  console.log(`[csv-import] Processing ${kind} import for org ${orgId}, job ${importJobId}`);

  try {
    // Parse the file
    const parsed = parseFile(fileName, fileContent);
    console.log(`[csv-import] Parsed ${parsed.rows.length} rows from ${fileName}`);

    // Update job with total records
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        totalRecords: parsed.rows.length,
        status: ImportStatus.PROCESSING,
      },
    });

    // Process the import using the existing batch processor
    await processImport({
      importJobId,
      orgId,
      entityType: kind.toUpperCase(),
      records: parsed.rows,
      fieldMappings,
      transformRules,
      validationRules,
      dedupeFields: [],
      batchSize,
    });

    console.log(`[csv-import] Successfully completed import job ${importJobId}`);
    return {
      status: 'completed',
      rows: parsed.rows.length,
      importJobId,
    };
  } catch (error: any) {
    console.error(`[csv-import] Error processing job ${importJobId}:`, error);

    // Update job status to failed
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: ImportStatus.FAILED,
        errorSummary: error.message || 'Import processing failed',
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function scheduleExpand(job: Job<ScheduleExpandJob>) {
  const { orgId, contractId, horizonDays } = job.data;

  console.log(`[schedule-expand] Expanding schedules for org ${orgId}, horizon ${horizonDays} days`);

  const now = new Date();
  const endDate = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  // Find active contracts with recurrence rules
  const contracts = await prisma.cleaningContract.findMany({
    where: {
      orgId,
      status: 'ACTIVE',
      recurrenceRule: { not: null },
      startDate: { lte: endDate },
      ...(contractId && { id: contractId }),
      OR: [
        { endDate: null },
        { endDate: { gte: now } }
      ]
    },
  });

  let created = 0;
  let skipped = 0;

  for (const contract of contracts) {
    try {
      // Parse RRULE
      const rrule = RRule.fromString(contract.recurrenceRule);

      // Get occurrences in the window
      const occurrences = rrule.between(now, endDate, true);

      for (const occurrence of occurrences) {
        // Check if work order already exists for this date
        const existing = await prisma.cleaningWorkOrder.findFirst({
          where: {
            contractId: contract.id,
            scheduledDate: occurrence
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Generate unique public ID
        const publicId = `WO-${contract.id.slice(0, 8)}-${occurrence.getTime()}`;

        // Calculate scheduled start/end times (default 8 AM - 5 PM)
        const scheduledStart = new Date(occurrence);
        scheduledStart.setHours(8, 0, 0, 0);

        const scheduledEnd = new Date(occurrence);
        scheduledEnd.setHours(17, 0, 0, 0);

        // Create work order
        await prisma.cleaningWorkOrder.create({
          data: {
            orgId: contract.orgId,
            contractId: contract.id,
            publicId,
            siteAddress: contract.siteAddress,
            spaceType: contract.spaceType,
            squareFeet: contract.squareFeet,
            scheduledDate: occurrence,
            scheduledStart,
            scheduledEnd,
            status: 'SCHEDULED'
          }
        });

        created++;
      }
    } catch (error: any) {
      console.error(`[schedule-expand] Error expanding contract ${contract.id}:`, error);
      // Continue with other contracts
    }
  }

  console.log(`[schedule-expand] Completed: ${created} created, ${skipped} skipped`);
  return {
    status: 'completed',
    created,
    skipped,
    contractsProcessed: contracts.length,
  };
}

export async function billingCloseDay(job: Job<BillingCloseDayJob>) {
  const { orgId, dateISO } = job.data;

  console.log(`[billing-close-day] Closing day ${dateISO} for org ${orgId}`);

  const cutoffDate = new Date(dateISO);

  // Find completed work orders for this org on this date
  const workOrders = await prisma.cleaningWorkOrder.findMany({
    where: {
      orgId,
      status: 'COMPLETED',
      actualEnd: { gte: cutoffDate }
    }
  });

  if (workOrders.length === 0) {
    console.log(`[billing-close-day] No completed work orders found for org ${orgId} on ${dateISO}`);
    return { status: 'completed', invoicesCreated: 0, itemsCreated: 0 };
  }

  // Get contracts for these work orders
  const contractIds = [...new Set(workOrders.map((wo) => wo.contractId).filter(Boolean))];
  const contracts = await prisma.cleaningContract.findMany({
    where: {
      id: { in: contractIds as string[] }
    },
    include: {
      CleaningEstimate: {
        select: {
          CleaningLead: {
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

  const contractMap = new Map(contracts.map((c: any) => [c.id, c]));

  let invoicesCreated = 0;
  let itemsCreated = 0;

  // Group work orders by customer/contract
  const workOrdersByCustomer = new Map<string, typeof workOrders>();

  for (const wo of workOrders) {
    const contract = wo.contractId ? contractMap.get(wo.contractId) : null;
    const key = (contract as any)?.customerId || wo.contractId || wo.orgId;
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
        console.error(`[billing-close-day] Work order ${firstWO.id}: No contract found`);
        continue;
      }

      // Calculate total amount
      const subtotal = customerWorkOrders.reduce((sum: number, wo: typeof customerWorkOrders[0]) => {
        return sum + Number((contract as any).basePrice);
      }, 0);

      const taxRate = Number((contract as any).taxRate || 0) / 100;
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
            customerWorkOrders.map((wo) => ({
              description: `Cleaning service - ${wo.spaceType} (${wo.squareFeet} sq ft)`,
              date: wo.scheduledDate.toISOString().split('T')[0],
              workOrderId: wo.id,
              quantity: 1,
              unitPrice: Number((contract as any).basePrice),
              total: Number((contract as any).basePrice)
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
          actorId: 'billing-worker',
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
    } catch (error: any) {
      console.error(`[billing-close-day] Error creating invoice for customer ${customerId}:`, error);
      // Continue with other customers
    }
  }

  console.log(`[billing-close-day] Completed: ${invoicesCreated} invoices created, ${itemsCreated} items`);
  return {
    status: 'completed',
    invoicesCreated,
    itemsCreated,
    workOrdersProcessed: workOrders.length,
  };
}

export async function inspectionsGenerate(job: Job<InspectionGenerateJob>) {
  console.log(`[inspections-generate] Generating inspections for org ${job.data.orgId}`);
  // TODO: Implement inspection sampling with bias
  return { status: 'pending', generated: 0 };
}

export async function s3ImageProcess(job: Job<S3ImageProcessJob>) {
  console.log(`[s3-image-process] Processing image ${job.data.fileKey}`);
  // TODO: Implement thumbnail generation, compression, virus scan
  return { status: 'pending', variants: 0 };
}

export async function pdfGenerate(job: Job<PdfGenerateJob>) {
  console.log(`[pdf-generate] Generating ${job.data.documentType} ${job.data.documentId}`);
  // TODO: Implement headless Chromium rendering
  return { status: 'pending', url: '' };
}

export async function vendorSync(job: Job<VendorSyncJob>) {
  console.log(`[vendor-sync] Syncing ${job.data.vendor} for org ${job.data.orgId}`);
  // TODO: Implement vendor-specific sync logic
  return { status: 'pending', synced: 0 };
}

export async function stripeFanout(job: Job<StripeFanoutJob>) {
  const { eventType, webhookId, payload, orgId } = job.data;

  console.log(`[stripe-fanout] Processing ${eventType} (${webhookId}) for org ${orgId}`);

  try {
    // Import the actual handler from the service
    // This will be implemented to call the existing handleStripeWebhookEvent
    // but in a worker context with proper retry/backoff

    // For now, just log the event type
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        console.log(`[stripe-fanout] Subscription event: ${eventType}`);
        // TODO: Call upsertSubscriptionFromStripe
        break;

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        console.log(`[stripe-fanout] Invoice event: ${eventType}`);
        // TODO: Call invoice handlers
        break;

      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
        console.log(`[stripe-fanout] Payment intent event: ${eventType}`);
        // TODO: Call payment intent handlers
        break;

      default:
        console.log(`[stripe-fanout] Unhandled event type: ${eventType}`);
    }

    return {
      status: 'completed',
      processed: true,
      eventType,
      webhookId,
    };
  } catch (error: any) {
    console.error(`[stripe-fanout] Error processing ${eventType}:`, error);
    throw error; // Let BullMQ handle retry
  }
}

// ============================================================================
// Processor Registry
// ============================================================================

export const PROCESSORS = {
  'csv.import': csvImport,
  'schedule.expand': scheduleExpand,
  'billing.closeDay': billingCloseDay,
  'inspections.generate': inspectionsGenerate,
  's3.image.process': s3ImageProcess,
  'pdf.generate': pdfGenerate,
  'vendor.sync': vendorSync,
  'stripe.fanout': stripeFanout,
} as const;

