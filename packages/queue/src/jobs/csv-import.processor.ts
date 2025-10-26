/**
 * CSV Import Processor
 * 
 * Processes CSV imports in chunks to avoid memory issues:
 * 1. Download CSV from S3
 * 2. Parse CSV in streaming mode
 * 3. Process records in batches of 100
 * 4. Update progress in database
 */

import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client-tenant';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

const prisma = new PrismaClient();

interface CSVImportJobData {
  importJobId: string;
  orgId: string;
  fileUrl: string;
  entityType: string;
  mappings: Record<string, string>;
}

const BATCH_SIZE = 100;

/**
 * Process CSV import job
 */
export async function processCsvImport(job: Job<CSVImportJobData>) {
  const { importJobId, orgId, fileUrl, entityType, mappings } = job.data;
  
  console.log(`[csv-import] Processing import job ${importJobId} for org ${orgId}`);
  
  try {
    // Update status to PROCESSING
    await prisma.importJob.update({
      where: { id: importJobId },
      data: { status: 'PROCESSING' },
    });
    
    // Download CSV from S3
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV
    const records: any[] = [];
    let totalRecords = 0;
    let processedRecords = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];
    
    // Create readable stream from CSV text
    const stream = Readable.from([csvText]);
    
    // Parse CSV with headers
    const parser = stream.pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      })
    );
    
    // Process records in batches
    let batch: any[] = [];
    
    for await (const record of parser) {
      totalRecords++;
      batch.push(record);
      
      // Process batch when it reaches BATCH_SIZE
      if (batch.length >= BATCH_SIZE) {
        const result = await processBatch(batch, orgId, entityType, mappings);
        
        processedRecords += result.processed;
        successCount += result.success;
        errorCount += result.errors.length;
        errors.push(...result.errors);
        
        // Update progress
        await prisma.importJob.update({
          where: { id: importJobId },
          data: {
            totalRecords,
            processedRecords,
            successCount,
            errorCount,
            errorSummary: errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null,
          },
        });
        
        // Update job progress
        await job.updateProgress({
          totalRecords,
          processedRecords,
          successCount,
          errorCount,
        });
        
        batch = [];
      }
    }
    
    // Process remaining records
    if (batch.length > 0) {
      const result = await processBatch(batch, orgId, entityType, mappings);
      
      processedRecords += result.processed;
      successCount += result.success;
      errorCount += result.errors.length;
      errors.push(...result.errors);
    }
    
    // Mark as completed
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'COMPLETED',
        totalRecords,
        processedRecords,
        successCount,
        errorCount,
        errorSummary: errors.length > 0 ? JSON.stringify(errors.slice(0, 100)) : null,
        completedAt: new Date(),
      },
    });
    
    console.log(`[csv-import] Completed import job ${importJobId}: ${successCount} success, ${errorCount} errors`);
    
    return {
      success: true,
      totalRecords,
      successCount,
      errorCount,
    };
  } catch (error) {
    console.error(`[csv-import] Error processing import job ${importJobId}:`, error);
    
    // Mark as failed
    await prisma.importJob.update({
      where: { id: importJobId },
      data: {
        status: 'FAILED',
        errorSummary: JSON.stringify([
          {
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        ]),
        completedAt: new Date(),
      },
    });
    
    throw error;
  }
}

/**
 * Process a batch of records
 */
async function processBatch(
  batch: any[],
  orgId: string,
  entityType: string,
  mappings: Record<string, string>
): Promise<{
  processed: number;
  success: number;
  errors: any[];
}> {
  let success = 0;
  const errors: any[] = [];
  
  for (const record of batch) {
    try {
      // Map CSV columns to entity fields
      const mappedData = mapRecord(record, mappings);
      
      // Create entity based on type
      switch (entityType) {
        case 'customers':
          await prisma.customer.create({
            data: {
              ...mappedData,
              orgId,
              publicId: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            },
          });
          break;
          
        case 'jobs':
          await prisma.job.create({
            data: {
              ...mappedData,
              orgId,
              publicId: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            },
          });
          break;
          
        // Add more entity types as needed
        
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
      
      success++;
    } catch (error) {
      errors.push({
        record,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
  
  return {
    processed: batch.length,
    success,
    errors,
  };
}

/**
 * Map CSV record to entity fields using mappings
 */
function mapRecord(record: any, mappings: Record<string, string>): any {
  const mapped: any = {};
  
  for (const [csvColumn, entityField] of Object.entries(mappings)) {
    if (record[csvColumn] !== undefined) {
      mapped[entityField] = record[csvColumn];
    }
  }
  
  return mapped;
}

