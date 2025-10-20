/**
 * Job processor exports
 * Each processor is a function that handles a specific job type
 */
import type { Job } from 'bullmq';
import type { CsvImportJob, ScheduleExpandJob, BillingCloseDayJob, InspectionGenerateJob, S3ImageProcessJob, PdfGenerateJob, VendorSyncJob, StripeFanoutJob } from '../index.js';
export declare function csvImport(job: Job<CsvImportJob>): Promise<{
    status: string;
    rows: any;
    importJobId: string;
}>;
export declare function scheduleExpand(job: Job<ScheduleExpandJob>): Promise<{
    status: string;
    created: number;
    skipped: number;
    contractsProcessed: any;
}>;
export declare function billingCloseDay(job: Job<BillingCloseDayJob>): Promise<{
    status: string;
    invoicesCreated: number;
    itemsCreated: number;
    workOrdersProcessed?: undefined;
} | {
    status: string;
    invoicesCreated: number;
    itemsCreated: number;
    workOrdersProcessed: any;
}>;
export declare function inspectionsGenerate(job: Job<InspectionGenerateJob>): Promise<{
    status: string;
    generated: number;
    eligible?: undefined;
    total?: undefined;
} | {
    status: string;
    generated: number;
    eligible: any;
    total: any;
}>;
export declare function s3ImageProcess(job: Job<S3ImageProcessJob>): Promise<{
    status: string;
    variants: number;
    virusScan: {
        clean: boolean;
        scannedAt: string;
        scanner: string;
    };
    originalKey: string;
    variantKeys: string[];
}>;
export declare function pdfGenerate(job: Job<PdfGenerateJob>): Promise<{
    status: string;
    url: string;
    documentType: "proposal" | "invoice";
    documentId: string;
}>;
export declare function vendorSync(job: Job<VendorSyncJob>): Promise<{
    status: string;
    vendor: "samsara" | "geotab" | "paylocity" | "holman";
    action: "pull" | "push";
    synced: number;
}>;
export declare function stripeFanout(job: Job<StripeFanoutJob>): Promise<{
    status: string;
    processed: boolean;
    eventType: string;
    webhookId: string;
    result: any;
}>;
export declare const PROCESSORS: {
    readonly 'csv.import': typeof csvImport;
    readonly 'schedule.expand': typeof scheduleExpand;
    readonly 'billing.closeDay': typeof billingCloseDay;
    readonly 'inspections.generate': typeof inspectionsGenerate;
    readonly 's3.image.process': typeof s3ImageProcess;
    readonly 'pdf.generate': typeof pdfGenerate;
    readonly 'vendor.sync': typeof vendorSync;
    readonly 'stripe.fanout': typeof stripeFanout;
};
