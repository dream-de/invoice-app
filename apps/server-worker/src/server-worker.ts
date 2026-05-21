import type { ScheduledJobSchedule } from "./jobs/scheduled"
import { runScheduledWorkerCycle, type ScheduledWorkerCycleOptions, type ScheduledWorkerCycleResult } from "./jobs/scheduled-worker-cycle"
import { runWorkerCycle, type WorkerCycleOptions, type WorkerCycleResult } from "./jobs/worker-cycle"
import type { WorkerJobQueueStore } from "./jobs/worker-job-store"

export type ServerWorkerRunMode = "queue" | "scheduled"

export type ServerWorkerRunOptions = (WorkerCycleOptions | ScheduledWorkerCycleOptions) & {
  mode?: ServerWorkerRunMode
  schedules?: ScheduledJobSchedule[]
}

export type ServerWorkerRunResult =
  | {
      mode: "queue"
      worker: WorkerCycleResult
    }
  | {
      mode: "scheduled"
      scheduled: ScheduledWorkerCycleResult
    }

export async function runServerWorkerOnce(
  store: WorkerJobQueueStore,
  options: ServerWorkerRunOptions = {}
): Promise<ServerWorkerRunResult> {
  const mode = options.mode ?? (Array.isArray(options.schedules) ? "scheduled" : "queue")
  const now = options.now ?? new Date()

  if (mode === "scheduled") {
    const scheduled = await runScheduledWorkerCycle(store, options.schedules ?? [], { ...options, now })

    return {
      mode,
      scheduled
    }
  }

  const worker = await runWorkerCycle(store, { ...options, now })

  return {
    mode,
    worker
  }
}
