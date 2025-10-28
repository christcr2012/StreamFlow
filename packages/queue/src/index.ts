/**
 * @cortiware/queue
 * 
 * Shared queue types, schemas, and helpers for BullMQ job system.
 * Used by both Vercel API (enqueue) and Worker (process).
 */

// ============================================================================
// Base Types
// ============================================================================

export interface OrgScoped {
  orgId: string;
  locationId?: string;
}

export interface JobBase extends OrgScoped {
  idempotencyKey: string;
}

// ============================================================================
// Job Types
// ============================================================================

export interface CsvImportJob extends JobBase {
  importJobId: string;
  kind: string;
  fileContent: string;
  fileName: string;
  fieldMappings: any[];
  transformRules: any[];
  validationRules: any[];
  batchSize?: number;
  s3Key?: string; // Optional: for S3-based imports
  dryRun?: boolean;
}

export interface ScheduleExpandJob extends JobBase {
  contractId?: string; // Optional: expand specific contract only
  horizonDays: number; // Number of days ahead to expand
}

export interface BillingCloseDayJob extends JobBase {
  dateISO: string; // YYYY-MM-DD
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

// ============================================================================
// Union Type
// ============================================================================

export type AnyJob =
  | CsvImportJob
  | ScheduleExpandJob
  | BillingCloseDayJob
  | InspectionGenerateJob
  | S3ImageProcessJob
  | PdfGenerateJob
  | VendorSyncJob
  | StripeFanoutJob;

// ============================================================================
// Queue Configuration
// ============================================================================

export const QUEUE_NAMES = {
  IMPORT: 'import',
  SCHEDULE: 'schedule',
  BILLING: 'billing',
  QA: 'qa',
  MEDIA: 'media',
  PDF: 'pdf',
  VENDOR: 'vendor',
  STRIPE: 'stripe',
} as const;

export const QUEUE_CONFIG = {
  defaultAttempts: 5,
  defaultBackoffMs: 15000,
  removeOnCompleteCount: 500,
  removeOnFailCount: 1000,
} as const;

// ============================================================================
// Exports
// ============================================================================

// Note: Job processor implementations are exposed via the subpath export "@cortiware/queue/jobs"
// to avoid bundling worker-only code into apps (like Next.js) during build.

