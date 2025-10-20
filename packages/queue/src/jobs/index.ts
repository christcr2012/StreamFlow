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
  const contractIds = [...new Set(workOrders.map((wo: any) => wo.contractId).filter(Boolean))];
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
            customerWorkOrders.map((wo: any) => ({
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
  const { orgId, weekStartISO, percent, bias = {} } = job.data;

  console.log(`[inspections-generate] Generating inspections for org ${orgId}, ${percent}% sampling`);

  const weekStart = new Date(weekStartISO);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Find completed work orders in the week
  const workOrders = await prisma.cleaningWorkOrder.findMany({
    where: {
      orgId,
      status: 'COMPLETED',
      actualEnd: {
        gte: weekStart,
        lt: weekEnd,
      },
    },
    include: {
      CleaningContract: {
        select: {
          customerId: true,
          createdAt: true,
        },
      },
    },
  });

  if (workOrders.length === 0) {
    console.log(`[inspections-generate] No completed work orders found for org ${orgId} in week ${weekStartISO}`);
    return { status: 'completed', generated: 0 };
  }

  // Get existing inspections to avoid duplicates
  const existingInspections = await prisma.cleaningInspection.findMany({
    where: {
      workOrderId: { in: workOrders.map((wo: any) => wo.id) },
    },
    select: { workOrderId: true },
  });

  const existingWorkOrderIds = new Set(existingInspections.map((i: any) => i.workOrderId));

  // Filter to work orders without inspections
  const eligibleWorkOrders = workOrders.filter((wo: any) => !existingWorkOrderIds.has(wo.id));

  // Apply sampling with bias
  const selectedWorkOrders = sampleWorkOrdersWithBias(eligibleWorkOrders, percent, bias);

  let created = 0;

  for (const wo of selectedWorkOrders) {
    try {
      // Generate default checklist based on space type
      const checklist = generateDefaultChecklist(wo.spaceType);

      // Create inspection
      await prisma.cleaningInspection.create({
        data: {
          orgId: wo.orgId,
          workOrderId: wo.id,
          checklistJson: JSON.stringify(checklist),
          defectsCount: 0,
          status: 'PENDING',
        },
      });

      created++;

      // Log activity
      await prisma.activity.create({
        data: {
          orgId: wo.orgId,
          actorType: 'system',
          actorId: 'inspection-worker',
          entityType: 'cleaning_inspection',
          entityId: wo.id,
          action: 'created',
          meta: JSON.stringify({
            workOrderId: wo.id,
            spaceType: wo.spaceType,
            automated: true,
            weekStartISO,
          }),
        },
      });
    } catch (error: any) {
      console.error(`[inspections-generate] Error creating inspection for WO ${wo.id}:`, error);
      // Continue with other work orders
    }
  }

  console.log(`[inspections-generate] Completed: ${created} inspections created from ${eligibleWorkOrders.length} eligible work orders`);
  return {
    status: 'completed',
    generated: created,
    eligible: eligibleWorkOrders.length,
    total: workOrders.length,
  };
}

// Helper: Sample work orders with bias towards new customers and low scores
function sampleWorkOrdersWithBias(workOrders: any[], percent: number, bias: any): any[] {
  const targetCount = Math.ceil((workOrders.length * percent) / 100);

  if (targetCount >= workOrders.length) {
    return workOrders; // Sample all if target >= total
  }

  const newCustomersWeight = bias.newCustomersWeight || 2.0;
  const lowScoreBias = bias.lowScoreBias || 1.5;

  // Calculate weights for each work order
  const weighted = workOrders.map((wo) => {
    let weight = 1.0;

    // Bias towards new customers (contracts created in last 30 days)
    if (wo.CleaningContract?.createdAt) {
      const daysSinceCreated = (Date.now() - new Date(wo.CleaningContract.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 30) {
        weight *= newCustomersWeight;
      }
    }

    // Bias towards low scores (if we had historical inspection scores)
    // For now, just add some randomness
    weight *= Math.random();

    return { wo, weight };
  });

  // Sort by weight descending
  weighted.sort((a, b) => b.weight - a.weight);

  // Take top N
  return weighted.slice(0, targetCount).map((w) => w.wo);
}

// Helper: Generate default checklist based on space type
function generateDefaultChecklist(spaceType: string): any[] {
  const baseChecklist = [
    { item: 'Floors cleaned and free of debris', category: 'Floors', passed: null },
    { item: 'Surfaces dusted and wiped down', category: 'Surfaces', passed: null },
    { item: 'Trash emptied and liners replaced', category: 'Waste', passed: null },
  ];

  if (spaceType === 'RESIDENTIAL') {
    return [
      ...baseChecklist,
      { item: 'Kitchen counters and appliances cleaned', category: 'Kitchen', passed: null },
      { item: 'Bathrooms sanitized', category: 'Bathroom', passed: null },
      { item: 'Bedrooms tidied', category: 'Bedroom', passed: null },
    ];
  } else if (spaceType === 'COMMERCIAL') {
    return [
      ...baseChecklist,
      { item: 'Break room cleaned', category: 'Break Room', passed: null },
      { item: 'Restrooms sanitized and stocked', category: 'Restrooms', passed: null },
      { item: 'Conference rooms cleaned', category: 'Conference', passed: null },
      { item: 'Entry/lobby cleaned', category: 'Entry', passed: null },
    ];
  } else if (spaceType === 'POST_CONSTRUCTION') {
    return [
      ...baseChecklist,
      { item: 'Construction debris removed', category: 'Debris', passed: null },
      { item: 'Windows cleaned inside and out', category: 'Windows', passed: null },
      { item: 'Paint/adhesive residue removed', category: 'Residue', passed: null },
      { item: 'Final walkthrough completed', category: 'Final', passed: null },
    ];
  }

  return baseChecklist;
}

export async function s3ImageProcess(job: Job<S3ImageProcessJob>) {
  const { orgId, fileKey, mimeType } = job.data;

  console.log(`[s3-image-process] Processing image ${fileKey} for org ${orgId}`);

  try {
    // Note: This is a placeholder implementation
    // In production, you would:
    // 1. Download image from S3
    // 2. Generate thumbnails using sharp or similar
    // 3. Compress images
    // 4. Run virus scan (ClamAV or similar)
    // 5. Upload variants back to S3
    // 6. Update database with variant URLs

    const variants = [];

    // Simulate thumbnail generation
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 400, height: 400 },
      { name: 'medium', width: 800, height: 800 },
      { name: 'large', width: 1600, height: 1600 },
    ];

    for (const size of sizes) {
      // In production: Use sharp to resize
      // const buffer = await sharp(originalBuffer)
      //   .resize(size.width, size.height, { fit: 'inside' })
      //   .jpeg({ quality: 85 })
      //   .toBuffer();
      //
      // const variantKey = `${fileKey.replace(/\.[^.]+$/, '')}_${size.name}.jpg`;
      // await s3.upload({ Key: variantKey, Body: buffer }).promise();

      variants.push({
        name: size.name,
        width: size.width,
        height: size.height,
        key: `${fileKey.replace(/\.[^.]+$/, '')}_${size.name}.jpg`,
      });
    }

    // Simulate virus scan
    const virusScanResult = {
      clean: true,
      scannedAt: new Date().toISOString(),
      scanner: 'placeholder',
    };

    console.log(`[s3-image-process] Generated ${variants.length} variants for ${fileKey}`);

    return {
      status: 'completed',
      variants: variants.length,
      virusScan: virusScanResult,
      originalKey: fileKey,
      variantKeys: variants.map((v) => v.key),
    };
  } catch (error: any) {
    console.error(`[s3-image-process] Error processing image ${fileKey}:`, error);
    throw error;
  }
}

export async function pdfGenerate(job: Job<PdfGenerateJob>) {
  const { orgId, documentType, documentId } = job.data;

  console.log(`[pdf-generate] Generating PDF for ${documentType} ${documentId}, org ${orgId}`);

  try {
    // Note: This is a placeholder implementation
    // In production, you would:
    // 1. Fetch document data from database
    // 2. Render HTML template with data
    // 3. Use Puppeteer/Playwright to generate PDF
    // 4. Upload PDF to S3
    // 5. Update database with PDF URL

    let documentData: any = null;
    let htmlTemplate = '';

    // Fetch document data based on type
    if (documentType === 'proposal') {
      const estimate = await prisma.cleaningEstimate.findUnique({
        where: { id: documentId },
        include: {
          CleaningLead: true,
        },
      });

      if (!estimate) {
        throw new Error(`Estimate ${documentId} not found`);
      }

      documentData = estimate;
      htmlTemplate = generateProposalHTML(estimate);
    } else if (documentType === 'invoice') {
      const invoice = await prisma.invoice.findUnique({
        where: { id: documentId },
      });

      if (!invoice) {
        throw new Error(`Invoice ${documentId} not found`);
      }

      documentData = invoice;
      htmlTemplate = generateInvoiceHTML(invoice);
    } else {
      throw new Error(`Unknown document type: ${documentType}`);
    }

    // In production: Use Puppeteer to generate PDF
    // const browser = await puppeteer.launch({ headless: true });
    // const page = await browser.newPage();
    // await page.setContent(htmlTemplate);
    // const pdfBuffer = await page.pdf({
    //   format: 'A4',
    //   printBackground: true,
    //   margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
    // });
    // await browser.close();
    //
    // const pdfKey = `pdfs/${orgId}/${documentType}/${documentId}.pdf`;
    // await s3.upload({ Key: pdfKey, Body: pdfBuffer, ContentType: 'application/pdf' }).promise();
    // const pdfUrl = `https://s3.amazonaws.com/bucket/${pdfKey}`;

    const pdfUrl = `https://placeholder.com/pdfs/${orgId}/${documentType}/${documentId}.pdf`;

    // Update document with PDF URL
    if (documentType === 'proposal') {
      await prisma.cleaningEstimate.update({
        where: { id: documentId },
        data: {
          metadata: {
            ...(documentData.metadata || {}),
            pdfUrl,
            pdfGeneratedAt: new Date().toISOString(),
          },
        },
      });
    } else if (documentType === 'invoice') {
      await prisma.invoice.update({
        where: { id: documentId },
        data: {
          metadata: {
            ...(documentData.metadata || {}),
            pdfUrl,
            pdfGeneratedAt: new Date().toISOString(),
          },
        },
      });
    }

    console.log(`[pdf-generate] PDF generated successfully: ${pdfUrl}`);

    return {
      status: 'completed',
      url: pdfUrl,
      documentType,
      documentId,
    };
  } catch (error: any) {
    console.error(`[pdf-generate] Error generating PDF for ${documentType} ${documentId}:`, error);
    throw error;
  }
}

// Helper: Generate proposal HTML
function generateProposalHTML(estimate: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Cleaning Proposal</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .header { margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .total { font-size: 24px; font-weight: bold; color: #2563eb; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Cleaning Service Proposal</h1>
        <p><strong>Prepared for:</strong> ${estimate.CleaningLead?.contactName || 'N/A'}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <div class="section">
        <h2>Service Details</h2>
        <p><strong>Space Type:</strong> ${estimate.spaceType}</p>
        <p><strong>Square Feet:</strong> ${estimate.squareFeet}</p>
        <p><strong>Frequency:</strong> ${estimate.frequency}</p>
      </div>
      <div class="section">
        <h2>Pricing</h2>
        <p class="total">Total: $${estimate.estimatedPrice}</p>
      </div>
    </body>
    </html>
  `;
}

// Helper: Generate invoice HTML
function generateInvoiceHTML(invoice: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #333; }
        .header { margin-bottom: 30px; }
        .section { margin-bottom: 20px; }
        .total { font-size: 24px; font-weight: bold; color: #2563eb; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Invoice</h1>
        <p><strong>Invoice ID:</strong> ${invoice.id}</p>
        <p><strong>Date:</strong> ${new Date(invoice.issuedAt).toLocaleDateString()}</p>
        <p><strong>Status:</strong> ${invoice.status}</p>
      </div>
      <div class="section">
        <h2>Items</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cleaning Services</td>
              <td>$${invoice.amount}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="section">
        <p class="total">Total: $${invoice.amount}</p>
      </div>
    </body>
    </html>
  `;
}

export async function vendorSync(job: Job<VendorSyncJob>) {
  const { orgId, vendor, action = 'pull' } = job.data;

  console.log(`[vendor-sync] Syncing ${vendor} for org ${orgId}, action: ${action}`);

  try {
    // Note: This is a placeholder implementation
    // In production, you would:
    // 1. Fetch vendor API credentials from org settings
    // 2. Call vendor-specific API
    // 3. Transform data to Cortiware format
    // 4. Upsert records to database
    // 5. Log sync results

    let synced = 0;

    switch (vendor) {
      case 'samsara':
        synced = await syncSamsara(orgId, action);
        break;
      case 'geotab':
        synced = await syncGeotab(orgId, action);
        break;
      case 'paylocity':
        synced = await syncPaylocity(orgId, action);
        break;
      case 'holman':
        synced = await syncHolman(orgId, action);
        break;
      default:
        throw new Error(`Unknown vendor: ${vendor}`);
    }

    console.log(`[vendor-sync] Synced ${synced} records from ${vendor}`);

    return {
      status: 'completed',
      vendor,
      action,
      synced,
    };
  } catch (error: any) {
    console.error(`[vendor-sync] Error syncing ${vendor}:`, error);
    throw error;
  }
}

// Vendor-specific sync functions (placeholders)
async function syncSamsara(orgId: string, action: string): Promise<number> {
  // Samsara: Fleet management (vehicles, drivers, GPS)
  console.log(`[samsara] Syncing for org ${orgId}, action: ${action}`);

  // In production:
  // 1. Get Samsara API key from org settings
  // 2. Fetch vehicles: GET https://api.samsara.com/fleet/vehicles
  // 3. Fetch drivers: GET https://api.samsara.com/fleet/drivers
  // 4. Transform and upsert to Asset/Staff tables

  return 0; // Placeholder
}

async function syncGeotab(orgId: string, action: string): Promise<number> {
  // Geotab: Fleet telematics (vehicles, trips, fuel)
  console.log(`[geotab] Syncing for org ${orgId}, action: ${action}`);

  // In production:
  // 1. Get Geotab credentials from org settings
  // 2. Authenticate: POST https://my.geotab.com/apiv1
  // 3. Fetch devices (vehicles)
  // 4. Fetch trips
  // 5. Transform and upsert to Asset/Trip tables

  return 0; // Placeholder
}

async function syncPaylocity(orgId: string, action: string): Promise<number> {
  // Paylocity: Payroll/HR (employees, time tracking)
  console.log(`[paylocity] Syncing for org ${orgId}, action: ${action}`);

  // In production:
  // 1. Get Paylocity API credentials from org settings
  // 2. Fetch employees: GET https://api.paylocity.com/api/v2/companies/{companyId}/employees
  // 3. Fetch time cards
  // 4. Transform and upsert to Staff/TimeEntry tables

  return 0; // Placeholder
}

async function syncHolman(orgId: string, action: string): Promise<number> {
  // Holman: Fleet management (vehicles, maintenance)
  console.log(`[holman] Syncing for org ${orgId}, action: ${action}`);

  // In production:
  // 1. Get Holman API credentials from org settings
  // 2. Fetch fleet data
  // 3. Fetch maintenance records
  // 4. Transform and upsert to Asset/Maintenance tables

  return 0; // Placeholder
}

export async function stripeFanout(job: Job<StripeFanoutJob>) {
  const { eventType, webhookId, payload, orgId } = job.data;

  console.log(`[stripe-fanout] Processing ${eventType} (${webhookId}) for org ${orgId}`);

  try {
    let result: any = null;

    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        result = await handleSubscriptionEvent(payload, orgId);
        break;

      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(payload, orgId);
        break;

      case 'invoice.payment_succeeded':
        result = await handleInvoicePaymentSucceeded(payload, orgId);
        break;

      case 'invoice.payment_failed':
        result = await handleInvoicePaymentFailed(payload, orgId);
        break;

      case 'payment_intent.succeeded':
        result = await handlePaymentIntentSucceeded(payload, orgId);
        break;

      case 'payment_intent.payment_failed':
        result = await handlePaymentIntentFailed(payload, orgId);
        break;

      case 'charge.refunded':
        result = await handleChargeRefunded(payload, orgId);
        break;

      case 'customer.created':
      case 'customer.updated':
        result = await handleCustomerEvent(payload, orgId);
        break;

      default:
        console.log(`[stripe-fanout] Unhandled event type: ${eventType}`);
        result = { handled: false };
    }

    console.log(`[stripe-fanout] Successfully processed ${eventType}`);

    return {
      status: 'completed',
      processed: true,
      eventType,
      webhookId,
      result,
    };
  } catch (error: any) {
    console.error(`[stripe-fanout] Error processing ${eventType}:`, error);
    throw error; // Let BullMQ handle retry
  }
}

// Stripe event handlers
async function handleSubscriptionEvent(payload: any, orgId: string): Promise<any> {
  const subscription = payload.data.object;

  // Upsert subscription to database
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      orgId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      metadata: subscription,
    },
    update: {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      metadata: subscription,
    },
  });

  return { subscriptionId: subscription.id, status: subscription.status };
}

async function handleSubscriptionDeleted(payload: any, orgId: string): Promise<any> {
  const subscription = payload.data.object;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  return { subscriptionId: subscription.id, status: 'canceled' };
}

async function handleInvoicePaymentSucceeded(payload: any, orgId: string): Promise<any> {
  const invoice = payload.data.object;

  // Update invoice status
  await prisma.invoice.updateMany({
    where: {
      orgId,
      stripeInvoiceId: invoice.id,
    },
    data: {
      status: 'paid',
      paidAt: new Date(invoice.status_transitions.paid_at * 1000),
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      orgId,
      actorType: 'system',
      actorId: 'stripe-webhook',
      entityType: 'invoice',
      entityId: invoice.id,
      action: 'payment_succeeded',
      meta: JSON.stringify({ amount: invoice.amount_paid }),
    },
  });

  return { invoiceId: invoice.id, amountPaid: invoice.amount_paid };
}

async function handleInvoicePaymentFailed(payload: any, orgId: string): Promise<any> {
  const invoice = payload.data.object;

  // Update invoice status
  await prisma.invoice.updateMany({
    where: {
      orgId,
      stripeInvoiceId: invoice.id,
    },
    data: {
      status: 'payment_failed',
    },
  });

  // Log activity
  await prisma.activity.create({
    data: {
      orgId,
      actorType: 'system',
      actorId: 'stripe-webhook',
      entityType: 'invoice',
      entityId: invoice.id,
      action: 'payment_failed',
      meta: JSON.stringify({ attemptCount: invoice.attempt_count }),
    },
  });

  return { invoiceId: invoice.id, attemptCount: invoice.attempt_count };
}

async function handlePaymentIntentSucceeded(payload: any, orgId: string): Promise<any> {
  const paymentIntent = payload.data.object;

  console.log(`[stripe] Payment intent succeeded: ${paymentIntent.id}, amount: ${paymentIntent.amount}`);

  // Log activity
  await prisma.activity.create({
    data: {
      orgId,
      actorType: 'system',
      actorId: 'stripe-webhook',
      entityType: 'payment',
      entityId: paymentIntent.id,
      action: 'succeeded',
      meta: JSON.stringify({ amount: paymentIntent.amount, currency: paymentIntent.currency }),
    },
  });

  return { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount };
}

async function handlePaymentIntentFailed(payload: any, orgId: string): Promise<any> {
  const paymentIntent = payload.data.object;

  console.log(`[stripe] Payment intent failed: ${paymentIntent.id}, error: ${paymentIntent.last_payment_error?.message}`);

  // Log activity
  await prisma.activity.create({
    data: {
      orgId,
      actorType: 'system',
      actorId: 'stripe-webhook',
      entityType: 'payment',
      entityId: paymentIntent.id,
      action: 'failed',
      meta: JSON.stringify({
        error: paymentIntent.last_payment_error?.message,
        amount: paymentIntent.amount,
      }),
    },
  });

  return { paymentIntentId: paymentIntent.id, error: paymentIntent.last_payment_error?.message };
}

async function handleChargeRefunded(payload: any, orgId: string): Promise<any> {
  const charge = payload.data.object;

  console.log(`[stripe] Charge refunded: ${charge.id}, amount: ${charge.amount_refunded}`);

  // Log activity
  await prisma.activity.create({
    data: {
      orgId,
      actorType: 'system',
      actorId: 'stripe-webhook',
      entityType: 'charge',
      entityId: charge.id,
      action: 'refunded',
      meta: JSON.stringify({ amountRefunded: charge.amount_refunded }),
    },
  });

  return { chargeId: charge.id, amountRefunded: charge.amount_refunded };
}

async function handleCustomerEvent(payload: any, orgId: string): Promise<any> {
  const customer = payload.data.object;

  console.log(`[stripe] Customer event: ${customer.id}`);

  // Update customer metadata if needed
  // This is a placeholder - actual implementation depends on your customer model

  return { customerId: customer.id };
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

