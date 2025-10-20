/**
 * Queue enqueue helper
 * Used by Vercel API routes to enqueue jobs
 */

import { Queue } from 'bullmq';
import type { AnyJob } from '@cortiware/queue';
import { QUEUE_CONFIG } from '@cortiware/queue';

const connection = { url: process.env.REDIS_URL! };

function getQueue(name: string) {
  return new Queue(name, { connection });
}

export async function enqueue<T extends AnyJob>(
  queueName: string,
  jobName: string,
  data: T,
  opts?: any
) {
  const queue = getQueue(queueName);

  try {
    const job = await queue.add(jobName, data, {
      removeOnComplete: QUEUE_CONFIG.removeOnCompleteCount,
      removeOnFail: QUEUE_CONFIG.removeOnFailCount,
      attempts: parseInt(process.env.WORKER_MAX_RETRIES || '5', 10),
      backoff: {
        type: 'exponential',
        delay: parseInt(process.env.WORKER_BACKOFF_MS || '15000', 10),
      },
      jobId: data.idempotencyKey,
      ...opts,
    });

    console.log(`[enqueue] Job ${job.id} added to ${queueName}/${jobName}`);
    return job;
  } finally {
    await queue.close();
  }
}

export async function getJobStatus(queueName: string, jobId: string) {
  const queue = getQueue(queueName);

  try {
    const job = await queue.getJob(jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      state: await job.getState(),
      progress: job.progress(),
      attempts: job.attemptsMade,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  } finally {
    await queue.close();
  }
}

