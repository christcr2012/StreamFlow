/**
 * Queue connection and configuration
 */

import { Queue, QueueEvents, Worker } from 'bullmq';
import { env } from './env.js';

export const connection = {
  url: env.REDIS_URL,
};

export function createQueue(name: string) {
  return new Queue(name, { connection });
}

export function createWorker(
  queueName: string,
  processor: (job: any) => Promise<any>,
  concurrency: number = env.WORKER_CONCURRENCY
) {
  return new Worker(queueName, processor, {
    connection,
    concurrency,
  });
}

export function createQueueEvents(queueName: string) {
  return new QueueEvents(queueName, { connection });
}

