// src/workers/webhookWorker.ts
// Background worker for webhook delivery
import { queue, JobTypes, type Job, type WebhookJobData } from '@/lib/queue';

/**
 * Process webhook job
 */
async function processWebhook(job: Job<WebhookJobData>) {
  console.log(`Processing webhook job ${job.id}...`);

  const { url, method, headers, body, signature } = job.data;

  try {
    // Add signature to headers if provided
    const finalHeaders = {
      'Content-Type': 'application/json',
      ...headers,
      ...(signature && { 'X-Webhook-Signature': signature }),
    };

    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));

    console.log(`Webhook job ${job.id} completed successfully`);
    return { success: true, status: response.status, result };
  } catch (error: any) {
    console.error(`Webhook job ${job.id} failed:`, error);
    throw error;
  }
}

/**
 * Register webhook worker
 */
export function registerWebhookWorker() {
  queue.registerHandler(JobTypes.WEBHOOK_DELIVERY, processWebhook);
  console.log('Webhook worker registered');
}

