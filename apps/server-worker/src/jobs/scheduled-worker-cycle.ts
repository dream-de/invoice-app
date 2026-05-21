import type { ScheduledJobSchedule } from "./scheduled"
import { enqueueDueScheduledJobs, type EnqueueDueScheduledJobsResult } from "./scheduled-queue"
import { runWorkerCycle, type WorkerCycleOptions, type WorkerCycleResult } from "./worker-cycle"
import type { WorkerJobQueueStore } from "./worker-job-store"

export type ScheduledWorkerCycleOptions = WorkerCycleOptions & {
  lookbackMinutes?: number
}

export type ScheduledWorkerCycleResult = {
  enqueue: EnqueueDueScheduledJobsResult
  worker: WorkerCycleResult
}

export async function runScheduledWorkerCycle(
  store: WorkerJobQueueStore,
  schedules: ScheduledJobSchedule[],
  options: ScheduledWorkerCycleOptions = {}
): Promise<ScheduledWorkerCycleResult> {
  const now = options.now ?? new Date()
  const enqueue = await enqueueDueScheduledJobs(store, schedules, {
    now,
    lookbackMinutes: options.lookbackMinutes
  })
  const worker = await runWorkerCycle(store, { ...options, now })

  return {
    enqueue,
    worker
  }
}
