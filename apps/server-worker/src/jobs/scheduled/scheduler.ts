import { createDueScheduledProcessingJobs, isScheduledJobDue } from "./create-scheduled-job"
import {
  defaultScheduledJobHandlers,
  runScheduledProcessingJob,
  type ScheduledJobHandlerOptions,
  type ScheduledJobHandlerOutput,
  type ScheduledJobHandlers
} from "./handlers"
import type { ScheduledJobSchedule, ScheduledProcessingJob } from "./types"

export type ScheduledWorkerPlan = {
  createdAt: string
  dueJobs: ScheduledProcessingJob[]
  skippedScheduleIds: string[]
}

export type CreateScheduledWorkerPlanOptions = {
  now?: Date
  lookbackMinutes?: number
}

export type RunDueScheduledJobsResult = {
  plan: ScheduledWorkerPlan
  results: ScheduledJobHandlerOutput[]
}

export function createScheduledWorkerPlan(
  schedules: ScheduledJobSchedule[],
  options: CreateScheduledWorkerPlanOptions = {}
): ScheduledWorkerPlan {
  const now = options.now ?? new Date()
  const dueJobs = createDueScheduledProcessingJobs(schedules, { ...options, now })
  const skippedScheduleIds = schedules
    .filter((schedule) => !isScheduledJobDue(schedule, now))
    .map((schedule) => schedule.id)

  return {
    createdAt: now.toISOString(),
    dueJobs,
    skippedScheduleIds
  }
}

export async function runDueScheduledJobs(
  schedules: ScheduledJobSchedule[],
  handlers: ScheduledJobHandlers = defaultScheduledJobHandlers,
  options: CreateScheduledWorkerPlanOptions & ScheduledJobHandlerOptions = {}
): Promise<RunDueScheduledJobsResult> {
  const now = options.now ?? new Date()
  const plan = createScheduledWorkerPlan(schedules, { ...options, now })
  const results: ScheduledJobHandlerOutput[] = []

  for (const job of plan.dueJobs) {
    results.push(await runScheduledProcessingJob(job, handlers, { now }))
  }

  return {
    plan,
    results
  }
}
