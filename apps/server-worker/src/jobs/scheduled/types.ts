export const scheduledJobKinds = ["recurring-invoices", "payment-reminders", "dunning-run", "maintenance"] as const

export type ScheduledJobKind = typeof scheduledJobKinds[number]

export type ScheduledJobPriority = "low" | "normal" | "high"

export type ScheduledJobCadence = "manual" | "hourly" | "daily" | "weekly" | "monthly"

export type ScheduledJobWindow = {
  startsAt: string
  endsAt?: string
  timezone: string
}

export type ScheduledJobSchedule = {
  id: string
  kind: ScheduledJobKind
  enabled: boolean
  cadence: ScheduledJobCadence
  timezone: string
  nextRunAt: string
  lastRunAt?: string
  requestedBy?: string
  priority?: ScheduledJobPriority
  dryRun?: boolean
}

export type ScheduledProcessingJob = {
  id: string
  kind: ScheduledJobKind
  scheduleId?: string
  window: ScheduledJobWindow
  requestedBy?: string
  priority: ScheduledJobPriority
  dryRun: boolean
  createdAt: string
}

export type ScheduledProcessingResult = {
  jobId: string
  kind: ScheduledJobKind
  processedCount: number
  skippedCount: number
  warningCount: number
  completedAt: string
}

export function isScheduledJobKind(value: string): value is ScheduledJobKind {
  return scheduledJobKinds.includes(value as ScheduledJobKind)
}
