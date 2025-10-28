/**
 * Processor registration
 * Attaches BullMQ workers to queues
 */
import { QUEUE_NAMES } from "@cortiware/queue";
import { PROCESSORS } from "@cortiware/queue/jobs";
import { createWorker, createQueueEvents } from "./queues.js";
import { env } from "./env.js";
const workers = [];
const events = [];
export function registerQueues() {
  const queueDefs = [
    { queue: QUEUE_NAMES.IMPORT, processor: PROCESSORS["csv.import"] },
    { queue: QUEUE_NAMES.SCHEDULE, processor: PROCESSORS["schedule.expand"] },
    { queue: QUEUE_NAMES.BILLING, processor: PROCESSORS["billing.closeDay"] },
    { queue: QUEUE_NAMES.QA, processor: PROCESSORS["inspections.generate"] },
    { queue: QUEUE_NAMES.MEDIA, processor: PROCESSORS["s3.image.process"] },
    { queue: QUEUE_NAMES.PDF, processor: PROCESSORS["pdf.generate"] },
    { queue: QUEUE_NAMES.VENDOR, processor: PROCESSORS["vendor.sync"] },
    { queue: QUEUE_NAMES.STRIPE, processor: PROCESSORS["stripe.fanout"] },
  ];
  queueDefs.forEach(({ queue, processor }) => {
    const worker = createWorker(queue, processor, env.WORKER_CONCURRENCY);
    const queueEvents = createQueueEvents(queue);
    worker.on("completed", (job) => {
      console.log(`[${queue}] ✓ Job ${job.id} completed`);
    });
    worker.on("failed", (job, err) => {
      console.error(`[${queue}] ✗ Job ${job?.id} failed:`, err.message);
    });
    queueEvents.on("failed", ({ jobId, failedReason }) => {
      console.error(`[${queue}] Event: Job ${jobId} failed - ${failedReason}`);
    });
    workers.push(worker);
    events.push(queueEvents);
    console.log(`[queues] Registered ${queue}`);
  });
}
export async function closeQueues() {
  await Promise.all([
    ...workers.map((w) => w.close()),
    ...events.map((e) => e.close()),
  ]);
}
//# sourceMappingURL=processors.js.map
