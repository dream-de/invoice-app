import type { ScheduledJobKind, ScheduledJobPriority, ScheduledJobSchedule, ScheduledJobWindow, ScheduledProcessingJob } from "./types"

const defaultScheduledWindowMinutes = 60

type CreateScheduledJobInput = {
  kind: ScheduledJobKind
  window: ScheduledJobWindow
  scheduleId?: string
  requestedBy?: string
  priority?: ScheduledJobPriority
  dryRun?: boolean
  now?: Date
}

type CreateScheduledJobWindowInput = {
  now?: Date
  timezone: string
  lookbackMinutes?: number
}

type CreateDueScheduledJobsOptions = {
  now?: Date
  lookbackMinutes?: number
}

export function createScheduledProcessingJob(input: CreateScheduledJobInput): ScheduledProcessingJob {
  const now = input.now ?? new Date()

  return {
    id: `scheduled-${input.kind}-${now.getTime()}`,
    kind: input.kind,
    scheduleId: input.scheduleId,
    window: input.window,
    requestedBy: input.requestedBy,
    priority: input.priority ?? "normal",
    dryRun: input.dryRun ?? false,
    createdAt: now.toISOString()
  }
}

export function createScheduledJobWindow(input: CreateScheduledJobWindowInput): ScheduledJobWindow {
  const now = input.now ?? new Date()
  const lookbackMinutes = input.lookbackMinutes ?? defaultScheduledWindowMinutes
  const startsAt = new Date(now.getTime() - lookbackMinutes * 60_000)

  return {
    startsAt: startsAt.toISOString(),
    endsAt: now.toISOString(),
    timezone: input.timezone
  }
}

export function isScheduledJobDue(schedule: ScheduledJobSchedule, now = new Date()) {
  if (!schedule.enabled) return false

  const nextRunAt = new Date(schedule.nextRunAt)
  if (Number.isNaN(nextRunAt.getTime())) return false

  return nextRunAt.getTime() <= now.getTime()
}

export function createScheduledProcessingJobFromSchedule(
  schedule: ScheduledJobSchedule,
  options: CreateDueScheduledJobsOptions = {}
) {
  const now = options.now ?? new Date()

  return createScheduledProcessingJob({
    kind: schedule.kind,
    scheduleId: schedule.id,
    window: createScheduledJobWindow({
      now,
      timezone: schedule.timezone,
      lookbackMinutes: options.lookbackMinutes
    }),
    requestedBy: schedule.requestedBy,
    priority: schedule.priority,
    dryRun: schedule.dryRun,
    now
  })
}

export function createDueScheduledProcessingJobs(
  schedules: ScheduledJobSchedule[],
  options: CreateDueScheduledJobsOptions = {}
) {
  const now = options.now ?? new Date()

  return schedules
    .filter((schedule) => isScheduledJobDue(schedule, now))
    .map((schedule) => createScheduledProcessingJobFromSchedule(schedule, { ...options, now }))
}
