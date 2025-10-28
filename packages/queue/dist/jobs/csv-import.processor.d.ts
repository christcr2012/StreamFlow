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
interface CSVImportJobData {
    importJobId: string;
    orgId: string;
    fileUrl: string;
    entityType: string;
    mappings: Record<string, string>;
}
/**
 * Process CSV import job
 */
export declare function processCsvImport(job: Job<CSVImportJobData>): Promise<{
    success: boolean;
    totalRecords: number;
    successCount: number;
    errorCount: number;
}>;
export {};
