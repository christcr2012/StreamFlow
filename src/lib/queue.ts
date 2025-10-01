// src/lib/queue.ts
// Background job queue system (BullMQ-ready interface)
// TODO: Replace with actual BullMQ when Redis is available
// For now, using in-memory queue as fallback

// ===== QUEUE TYPES =====

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: any;
}

export interface JobOptions {
  maxAttempts?: number;
  delay?: number; // Delay in milliseconds
  priority?: number; // Higher = more important
}

export type JobHandler<T = any> = (job: Job<T>) => Promise<any>;

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

// ===== IN-MEMORY QUEUE (FALLBACK) =====

class InMemoryQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private isProcessing: boolean = false;

  async enqueue<T>(type: string, data: T, options: JobOptions = {}): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: Job<T> = {
      id: jobId,
      type,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return jobId;
  }

  registerHandler(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  private async startProcessing() {
    this.isProcessing = true;

    while (this.jobs.size > 0) {
      const pendingJobs = Array.from(this.jobs.values()).filter(
        (job) => !this.processing.has(job.id) && !job.completedAt && !job.failedAt
      );

      if (pendingJobs.length === 0) {
        break;
      }

      // Process jobs in parallel (limit to 5 concurrent)
      const batch = pendingJobs.slice(0, 5);
      await Promise.all(batch.map((job) => this.processJob(job)));

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  private async processJob(job: Job) {
    this.processing.add(job.id);
    job.processedAt = new Date();
    job.attempts++;

    const handler = this.handlers.get(job.type);

    if (!handler) {
      console.error(`No handler registered for job type: ${job.type}`);
      job.failedAt = new Date();
      job.error = `No handler for type: ${job.type}`;
      this.processing.delete(job.id);
      return;
    }

    try {
      const result = await handler(job);
      job.result = result;
      job.completedAt = new Date();
      console.log(`Job ${job.id} completed successfully`);
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error);
      job.error = error.message;

      if (job.attempts >= job.maxAttempts) {
        job.failedAt = new Date();
        console.error(`Job ${job.id} failed permanently after ${job.attempts} attempts`);
      } else {
        // Retry with exponential backoff
        const delay = Math.pow(2, job.attempts) * 1000;
        console.log(`Job ${job.id} will retry in ${delay}ms`);
        setTimeout(() => {
          this.processing.delete(job.id);
          this.processJob(job);
        }, delay);
        return;
      }
    }

    this.processing.delete(job.id);
  }

  getStats(): QueueStats {
    const jobs = Array.from(this.jobs.values());

    return {
      pending: jobs.filter((j) => !j.processedAt && !j.completedAt && !j.failedAt).length,
      processing: this.processing.size,
      completed: jobs.filter((j) => j.completedAt).length,
      failed: jobs.filter((j) => j.failedAt).length,
    };
  }

  async getJob(jobId: string): Promise<Job | null> {
    return this.jobs.get(jobId) || null;
  }

  async clearCompleted() {
    const completed = Array.from(this.jobs.values()).filter((j) => j.completedAt);
    completed.forEach((j) => this.jobs.delete(j.id));
    return completed.length;
  }

  async clearFailed() {
    const failed = Array.from(this.jobs.values()).filter((j) => j.failedAt);
    failed.forEach((j) => this.jobs.delete(j.id));
    return failed.length;
  }
}

// ===== QUEUE SERVICE =====

export class QueueService {
  private backend: InMemoryQueue;

  constructor() {
    // TODO: Initialize BullMQ when Redis is available
    // For now, use in-memory queue
    this.backend = new InMemoryQueue();
  }

  /**
   * Enqueue a job
   */
  async enqueue<T>(type: string, data: T, options: JobOptions = {}): Promise<string> {
    return this.backend.enqueue(type, data, options);
  }

  /**
   * Register a job handler
   */
  registerHandler(type: string, handler: JobHandler) {
    this.backend.registerHandler(type, handler);
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<Job | null> {
    return this.backend.getJob(jobId);
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    return this.backend.getStats();
  }

  /**
   * Clear completed jobs
   */
  async clearCompleted(): Promise<number> {
    return this.backend.clearCompleted();
  }

  /**
   * Clear failed jobs
   */
  async clearFailed(): Promise<number> {
    return this.backend.clearFailed();
  }
}

// ===== JOB TYPES =====

export const JobTypes = {
  AI_TASK: 'ai_task',
  REPORT_GENERATION: 'report_generation',
  EMAIL_SEND: 'email_send',
  WEBHOOK_DELIVERY: 'webhook_delivery',
  CSV_IMPORT: 'csv_import',
  DATA_EXPORT: 'data_export',
  CACHE_WARM: 'cache_warm',
  CLEANUP: 'cleanup',
};

// ===== SINGLETON INSTANCE =====

export const queue = new QueueService();

// ===== JOB DATA TYPES =====

export interface AiTaskJobData {
  orgId: string;
  userId: string;
  userRole: string;
  agentType: string;
  actionType: string;
  input: Record<string, any>;
}

export interface ReportJobData {
  orgId: string;
  userId: string;
  reportType: string;
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv';
}

export interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{ filename: string; content: string }>;
}

export interface WebhookJobData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: Record<string, string>;
  body: any;
  signature?: string;
}

export interface CsvImportJobData {
  orgId: string;
  userId: string;
  entityType: string;
  csvData: string;
  mapping: Record<string, string>;
}

// ===== HELPER FUNCTIONS =====

/**
 * Enqueue AI task for background processing
 */
export async function enqueueAiTask(data: AiTaskJobData): Promise<string> {
  return queue.enqueue(JobTypes.AI_TASK, data, { maxAttempts: 3 });
}

/**
 * Enqueue report generation
 */
export async function enqueueReport(data: ReportJobData): Promise<string> {
  return queue.enqueue(JobTypes.REPORT_GENERATION, data, { maxAttempts: 2 });
}

/**
 * Enqueue email sending
 */
export async function enqueueEmail(data: EmailJobData): Promise<string> {
  return queue.enqueue(JobTypes.EMAIL_SEND, data, { maxAttempts: 5 });
}

/**
 * Enqueue webhook delivery
 */
export async function enqueueWebhook(data: WebhookJobData): Promise<string> {
  return queue.enqueue(JobTypes.WEBHOOK_DELIVERY, data, { maxAttempts: 5 });
}

/**
 * Enqueue CSV import
 */
export async function enqueueCsvImport(data: CsvImportJobData): Promise<string> {
  return queue.enqueue(JobTypes.CSV_IMPORT, data, { maxAttempts: 1 });
}

