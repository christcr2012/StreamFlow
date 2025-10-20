/**
 * Queue Enqueue Helper
 * 
 * Provides a simple interface to enqueue jobs to BullMQ
 */

import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queue instances
const queues = new Map<string, Queue>();

/**
 * Get or create a queue
 */
function getQueue(queueName: string): Queue {
  if (!queues.has(queueName)) {
    const queue = new Queue(queueName, { connection });
    queues.set(queueName, queue);
  }
  
  return queues.get(queueName)!;
}

/**
 * Enqueue a job
 */
export async function enqueue(
  queueName: string,
  jobName: string,
  data: any,
  options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  }
): Promise<string> {
  const queue = getQueue(queueName);
  
  const job = await queue.add(jobName, data, {
    delay: options?.delay,
    priority: options?.priority,
    attempts: options?.attempts || 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
  
  return job.id!;
}

/**
 * Close all queue connections
 */
export async function closeQueues(): Promise<void> {
  for (const queue of queues.values()) {
    await queue.close();
  }
  
  queues.clear();
  await connection.quit();
}

