import { createScheduledWorkerPlan, type CreateScheduledWorkerPlanOptions, type ScheduledJobSchedule, type ScheduledProcessingJob } from "./scheduled"
import { createWorkerJobQueueEntry, type WorkerJobQueueEntry } from "./worker-job-queue"
import type { WorkerJob } from "./worker-job"
import type { WorkerJobQueueStore } from "./worker-job-store"

export type ScheduledWorkerQueuePlan = {
  createdAt: string
  queueEntries: WorkerJobQueueEntry[]
  skippedScheduleIds: string[]
}

export type EnqueueDueScheduledJobsResult = ScheduledWorkerQueuePlan & {
  enqueuedCount: number
}

export function createScheduledWorkerJob(job: ScheduledProcessingJob): WorkerJob {
  const id = job.scheduleId ? job.id + "-" + job.scheduleId : job.id

  return {
    id,
    kind: "scheduled",
    payload: {
      id: job.id,
      kind: job.kind,
      scheduleId: job.scheduleId,
      window: job.window,
      requestedBy: job.requestedBy,
      priority: job.priority,
      dryRun: job.dryRun,
      createdAt: job.createdAt
    },
    createdAt: job.createdAt
  }
}

export function createScheduledWorkerQueueEntry(job: ScheduledProcessingJob): WorkerJobQueueEntry {
  return createWorkerJobQueueEntry({
    job: createScheduledWorkerJob(job),
    now: new Date(job.createdAt)
  })
}

export function createDueScheduledWorkerQueueEntries(
  schedules: ScheduledJobSchedule[],
  options: CreateScheduledWorkerPlanOptions = {}
): ScheduledWorkerQueuePlan {
  const plan = createScheduledWorkerPlan(schedules, options)

  return {
    createdAt: plan.createdAt,
    queueEntries: plan.dueJobs.map(createScheduledWorkerQueueEntry),
    skippedScheduleIds: plan.skippedScheduleIds
  }
}

export async function enqueueDueScheduledJobs(
  store: WorkerJobQueueStore,
  schedules: ScheduledJobSchedule[],
  options: CreateScheduledWorkerPlanOptions = {}
): Promise<EnqueueDueScheduledJobsResult> {
  const plan = createDueScheduledWorkerQueueEntries(schedules, options)

  for (const entry of plan.queueEntries) {
    await store.saveEntry(entry)
  }

  return {
    ...plan,
    enqueuedCount: plan.queueEntries.length
  }
}
