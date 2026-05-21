import type { EmailDeliveryResult } from "./email"
import type { ImportProcessingResult } from "./import"
import type { PdfRenderResult } from "./pdf"
import {
  isScheduledJobKind,
  runScheduledProcessingJob,
  type ScheduledJobPriority,
  type ScheduledJobWindow,
  type ScheduledProcessingJob
} from "./scheduled"
import type { WorkerJobHandler, WorkerJobHandlers } from "./worker-job-runner"

export type DefaultWorkerJobHandlerOptions = {
  now?: Date
}

type UnknownPayload = Record<string, unknown>

function getNow(options: DefaultWorkerJobHandlerOptions) {
  return options.now ?? new Date()
}

function getString(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function getPriority(value: unknown): ScheduledJobPriority {
  return value === "low" || value === "high" || value === "normal" ? value : "normal"
}

function createPdfHandler(options: DefaultWorkerJobHandlerOptions): WorkerJobHandler {
  return (entry) => {
    const documentId = getString(entry.payload.documentId) ?? entry.id
    const format = getString(entry.payload.format) ?? "document"
    const completedAt = getNow(options).toISOString()

    const output: PdfRenderResult = {
      jobId: entry.id,
      documentId,
      fileName: format + "-" + documentId + ".pdf",
      contentType: "application/pdf",
      completedAt
    }

    return { output: { ...output } }
  }
}

function createEmailHandler(options: DefaultWorkerJobHandlerOptions): WorkerJobHandler {
  return (entry) => {
    const output: EmailDeliveryResult = {
      jobId: entry.id,
      deliveredAt: getNow(options).toISOString()
    }

    return { output: { ...output, dryRun: true, note: "Email delivery handler is registered in dry-run mode." } }
  }
}

function createImportHandler(options: DefaultWorkerJobHandlerOptions): WorkerJobHandler {
  return (entry) => {
    const kind = getString(entry.payload.kind) ?? "manual-upload"
    const output: ImportProcessingResult = {
      jobId: entry.id,
      kind: kind as ImportProcessingResult["kind"],
      importedCount: 0,
      skippedCount: 0,
      warningCount: 0,
      completedAt: getNow(options).toISOString()
    }

    return { output: { ...output, dryRun: true, note: "Import handler is registered in dry-run mode." } }
  }
}

function normalizeScheduledPayload(payload: UnknownPayload, fallbackId: string, options: DefaultWorkerJobHandlerOptions): ScheduledProcessingJob {
  const kind = getString(payload.kind)

  if (!kind || !isScheduledJobKind(kind)) {
    throw new Error("Scheduled worker job payload has an invalid kind")
  }

  const rawWindow = typeof payload.window === "object" && payload.window !== null ? payload.window as UnknownPayload : undefined
  const startsAt = getString(rawWindow?.startsAt)
  const timezone = getString(rawWindow?.timezone)

  if (!startsAt || !timezone) {
    throw new Error("Scheduled worker job payload requires a window with startsAt and timezone")
  }

  const window: ScheduledJobWindow = {
    startsAt,
    timezone,
    endsAt: getString(rawWindow?.endsAt)
  }

  return {
    id: getString(payload.id) ?? fallbackId,
    kind,
    scheduleId: getString(payload.scheduleId),
    window,
    requestedBy: getString(payload.requestedBy),
    priority: getPriority(payload.priority),
    dryRun: typeof payload.dryRun === "boolean" ? payload.dryRun : true,
    createdAt: getString(payload.createdAt) ?? getNow(options).toISOString()
  }
}

function createScheduledHandler(options: DefaultWorkerJobHandlerOptions): WorkerJobHandler {
  return async (entry) => {
    const scheduledJob = normalizeScheduledPayload(entry.payload, entry.id, options)
    const output = await runScheduledProcessingJob(scheduledJob, undefined, { now: getNow(options) })

    return { output: { ...output } }
  }
}

export function createDefaultWorkerJobHandlers(options: DefaultWorkerJobHandlerOptions = {}): WorkerJobHandlers {
  return {
    pdf: createPdfHandler(options),
    email: createEmailHandler(options),
    import: createImportHandler(options),
    scheduled: createScheduledHandler(options)
  }
}
