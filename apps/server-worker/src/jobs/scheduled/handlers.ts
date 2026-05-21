import type { ScheduledJobKind, ScheduledProcessingJob, ScheduledProcessingResult } from "./types"

export type ScheduledJobHandlerOptions = {
  now?: Date
}

export type ScheduledJobHandlerOutput = ScheduledProcessingResult & {
  dryRun: boolean
  notes: string[]
}

export type ScheduledJobHandler = (
  job: ScheduledProcessingJob,
  options?: ScheduledJobHandlerOptions
) => Promise<ScheduledJobHandlerOutput> | ScheduledJobHandlerOutput

export type ScheduledJobHandlers = Record<ScheduledJobKind, ScheduledJobHandler>

type ScheduledJobResultInput = Partial<Pick<ScheduledProcessingResult, "processedCount" | "skippedCount" | "warningCount">> & {
  notes?: string[]
}

function createScheduledJobResult(
  job: ScheduledProcessingJob,
  input: ScheduledJobResultInput,
  options: ScheduledJobHandlerOptions = {}
): ScheduledJobHandlerOutput {
  const completedAt = options.now ?? new Date()

  return {
    jobId: job.id,
    kind: job.kind,
    processedCount: input.processedCount ?? 0,
    skippedCount: input.skippedCount ?? 0,
    warningCount: input.warningCount ?? 0,
    completedAt: completedAt.toISOString(),
    dryRun: job.dryRun,
    notes: input.notes ?? []
  }
}

export const defaultScheduledJobHandlers: ScheduledJobHandlers = {
  "recurring-invoices": (job, options) =>
    createScheduledJobResult(
      job,
      {
        notes: ["Recurring invoice scan prepared; automatic invoice creation is not enabled in the foundation worker."]
      },
      options
    ),
  "payment-reminders": (job, options) =>
    createScheduledJobResult(
      job,
      {
        notes: ["Payment reminder scan prepared; no customer notifications were sent."]
      },
      options
    ),
  "dunning-run": (job, options) =>
    createScheduledJobResult(
      job,
      {
        notes: ["Dunning scan prepared; no dunning documents were generated."]
      },
      options
    ),
  maintenance: (job, options) =>
    createScheduledJobResult(
      job,
      {
        notes: ["Maintenance checks prepared; no destructive cleanup was executed."]
      },
      options
    )
}

export function getScheduledJobHandler(
  kind: ScheduledJobKind,
  handlers: ScheduledJobHandlers = defaultScheduledJobHandlers
) {
  return handlers[kind]
}

export async function runScheduledProcessingJob(
  job: ScheduledProcessingJob,
  handlers: ScheduledJobHandlers = defaultScheduledJobHandlers,
  options: ScheduledJobHandlerOptions = {}
) {
  const handler = getScheduledJobHandler(job.kind, handlers)

  return handler(job, options)
}
