// src/workers/aiTaskWorker.ts
// Background worker for AI task processing
import { queue, JobTypes, type Job, type AiTaskJobData } from '@/lib/queue';
import { aiTaskService } from '@/server/services/aiTaskService';

/**
 * Process AI task job
 */
async function processAiTask(job: Job<AiTaskJobData>) {
  console.log(`Processing AI task job ${job.id}...`);

  const { orgId, userId, userRole, agentType, actionType, input } = job.data;

  try {
    const result = await aiTaskService.execute(orgId, userId, userRole, {
      agentType,
      actionType,
      preview: false,
      metadata: input,
    });

    console.log(`AI task job ${job.id} completed successfully`);
    return result;
  } catch (error: any) {
    console.error(`AI task job ${job.id} failed:`, error);
    throw error;
  }
}

/**
 * Register AI task worker
 */
export function registerAiTaskWorker() {
  queue.registerHandler(JobTypes.AI_TASK, processAiTask);
  console.log('AI task worker registered');
}

