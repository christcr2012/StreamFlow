/**
 * @cortiware/queue
 *
 * Shared queue types, schemas, and helpers for BullMQ job system.
 * Used by both Vercel API (enqueue) and Worker (process).
 */
export interface OrgScoped {
    orgId: string;
    locationId?: string;
}
export interface JobBase extends OrgScoped {
    idempotencyKey: string;
}
export interface CsvImportJob extends JobBase {
    importJobId: string;
    kind: string;
    fileContent: string;
    fileName: string;
    fieldMappings: any[];
    transformRules: any[];
    validationRules: any[];
    batchSize?: number;
    s3Key?: string;
    dryRun?: boolean;
}
export interface ScheduleExpandJob extends JobBase {
    contractId?: string;
    horizonDays: number;
}
export interface BillingCloseDayJob extends JobBase {
    dateISO: string;
}
export interface InspectionGenerateJob extends JobBase {
    weekStartISO: string;
    percent: number;
    bias?: {
        newCustomersWeight?: number;
        lowScoreBias?: number;
    };
}
export interface S3ImageProcessJob extends JobBase {
    fileKey: string;
    mimeType: string;
}
export interface PdfGenerateJob extends JobBase {
    documentType: 'proposal' | 'invoice';
    documentId: string;
}
export interface VendorSyncJob extends JobBase {
    vendor: 'samsara' | 'geotab' | 'paylocity' | 'holman';
    action?: 'pull' | 'push';
}
export interface StripeFanoutJob extends JobBase {
    webhookId: string;
    eventType: string;
    payload: Record<string, any>;
}
export type AnyJob = CsvImportJob | ScheduleExpandJob | BillingCloseDayJob | InspectionGenerateJob | S3ImageProcessJob | PdfGenerateJob | VendorSyncJob | StripeFanoutJob;
export declare const QUEUE_NAMES: {
    readonly IMPORT: "import";
    readonly SCHEDULE: "schedule";
    readonly BILLING: "billing";
    readonly QA: "qa";
    readonly MEDIA: "media";
    readonly PDF: "pdf";
    readonly VENDOR: "vendor";
    readonly STRIPE: "stripe";
};
export declare const QUEUE_CONFIG: {
    readonly defaultAttempts: 5;
    readonly defaultBackoffMs: 15000;
    readonly removeOnCompleteCount: 500;
    readonly removeOnFailCount: 1000;
};
export * from './jobs/index.js';
