// apps/tenant-app/src/lib/schedule-actions.ts
// Schedule UI actions with optimistic updates

import { showToast } from '@/components/ui/toast';

export interface Job {
  id: string;
  publicId: string;
  title: string;
  customerName: string;
  customerPhone: string;
  address: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: number;
  status: string;
  priority: string;
  assignedToId: string | null;
  assignedToName: string | null;
  jobType: string;
  estimatedRevenue: number;
  notes: string;
}

export async function assignJob(
  jobId: string,
  technicianId: string | null
): Promise<Job> {
  const response = await fetch('/api/schedule/jobs/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, technicianId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to assign job');
  }

  const data = await response.json();
  return data.job;
}

export async function rescheduleJob(
  jobId: string,
  scheduledStart: string,
  scheduledEnd: string
): Promise<Job> {
  const response = await fetch('/api/schedule/jobs/reschedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, scheduledStart, scheduledEnd }),
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 409) {
      // Conflict detected
      throw new Error(`Schedule conflict: ${error.conflicts?.length || 0} overlapping jobs`);
    }
    throw new Error(error.error || 'Failed to reschedule job');
  }

  const data = await response.json();
  return data.job;
}

export function optimisticallyAssignJob(
  jobs: Job[],
  jobId: string,
  technicianId: string | null,
  technicianName: string | null
): Job[] {
  return jobs.map((job) =>
    job.id === jobId
      ? { ...job, assignedToId: technicianId, assignedToName: technicianName }
      : job
  );
}

export function optimisticallyRescheduleJob(
  jobs: Job[],
  jobId: string,
  scheduledStart: string,
  scheduledEnd: string
): Job[] {
  return jobs.map((job) =>
    job.id === jobId
      ? {
          ...job,
          scheduledStart,
          scheduledEnd,
          duration: Math.round(
            (new Date(scheduledEnd).getTime() - new Date(scheduledStart).getTime()) / 60000
          ),
        }
      : job
  );
}

export async function handleAssignJobWithToast(
  jobs: Job[],
  setJobs: (jobs: Job[]) => void,
  jobId: string,
  technicianId: string | null,
  technicianName: string | null
): Promise<boolean> {
  // Optimistic update
  const previousJobs = jobs;
  setJobs(optimisticallyAssignJob(jobs, jobId, technicianId, technicianName));

  try {
    const updatedJob = await assignJob(jobId, technicianId);
    // Update with server response
    setJobs(jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    showToast(
      technicianId ? 'Job assigned successfully' : 'Job unassigned',
      'success'
    );
    return true;
  } catch (error) {
    // Rollback on error
    setJobs(previousJobs);
    showToast(
      error instanceof Error ? error.message : 'Failed to assign job',
      'error'
    );
    return false;
  }
}

export async function handleRescheduleJobWithToast(
  jobs: Job[],
  setJobs: (jobs: Job[]) => void,
  jobId: string,
  scheduledStart: string,
  scheduledEnd: string
): Promise<boolean> {
  // Optimistic update
  const previousJobs = jobs;
  setJobs(optimisticallyRescheduleJob(jobs, jobId, scheduledStart, scheduledEnd));

  try {
    const updatedJob = await rescheduleJob(jobId, scheduledStart, scheduledEnd);
    // Update with server response
    setJobs(jobs.map((j) => (j.id === updatedJob.id ? updatedJob : j)));
    showToast('Job rescheduled successfully', 'success');
    return true;
  } catch (error) {
    // Rollback on error
    setJobs(previousJobs);
    showToast(
      error instanceof Error ? error.message : 'Failed to reschedule job',
      'error'
    );
    return false;
  }
}
