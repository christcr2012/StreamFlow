/**
 * Queue Enqueue Helper
 *
 * Provides a simple interface to enqueue jobs to BullMQ
 */

import { Queue } from "bullmq";
import Redis from "ioredis";

// Lazily create Redis connection to avoid build-time connection attempts
let connection: Redis | null = null;

function getConnection(): Redis | null {
  if (connection) return connection;

  const url = process.env.REDIS_URL || process.env.KV_REDIS_URL;

  // During Next.js build (SSG), avoid creating connections when not configured
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  if (!url) {
    if (isBuildPhase) return null;
    console.warn(
      "REDIS_URL or KV_REDIS_URL not configured; queue operations will be disabled.",
    );
    return null;
  }

  connection = new Redis(url, {
    lazyConnect: true,
    // BullMQ recommends null so commands fail fast if Redis is unreachable
    maxRetriesPerRequest: null,
  });

  // Do not auto-connect; a first command will trigger connect
  connection.on("error", (err) => {
    // Keep noise minimal during builds where Redis may not be present
    if (isBuildPhase) return;
    console.error("[queue] Redis error:", err);
  });

  return connection;
}

// Queue instances
const queues = new Map<string, Queue>();

/**
 * Get or create a queue
 */
function getQueue(queueName: string): Queue {
  if (!queues.has(queueName)) {
    const conn = getConnection();
    if (!conn) {
      throw new Error(
        "Redis not configured; cannot create queue. Set REDIS_URL or KV_REDIS_URL.",
      );
    }
    const queue = new Queue(queueName, { connection: conn });
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
  },
): Promise<string> {
  const queue = getQueue(queueName);

  const job = await queue.add(jobName, data, {
    delay: options?.delay,
    priority: options?.priority,
    attempts: options?.attempts || 3,
    backoff: {
      type: "exponential",
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
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
