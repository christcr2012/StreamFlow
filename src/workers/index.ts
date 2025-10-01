// src/workers/index.ts
// Initialize all background workers
import { registerAiTaskWorker } from './aiTaskWorker';
import { registerEmailWorker } from './emailWorker';
import { registerWebhookWorker } from './webhookWorker';

/**
 * Initialize all workers
 * Call this on application startup
 */
export function initializeWorkers() {
  console.log('Initializing background workers...');

  registerAiTaskWorker();
  registerEmailWorker();
  registerWebhookWorker();

  console.log('All workers initialized successfully');
}

