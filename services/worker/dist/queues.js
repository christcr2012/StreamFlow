/**
 * Queue connection and configuration
 */
import { Queue, QueueEvents, Worker } from 'bullmq';
import { env } from './env.js';
export const connection = {
    url: env.REDIS_URL,
};
export function createQueue(name) {
    return new Queue(name, { connection });
}
export function createWorker(queueName, processor, concurrency = env.WORKER_CONCURRENCY) {
    return new Worker(queueName, processor, {
        connection,
        concurrency,
    });
}
export function createQueueEvents(queueName) {
    return new QueueEvents(queueName, { connection });
}
//# sourceMappingURL=queues.js.map