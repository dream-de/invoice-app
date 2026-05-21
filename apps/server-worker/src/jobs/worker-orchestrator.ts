import { createDefaultWorkerJobHandlers, type DefaultWorkerJobHandlerOptions } from "./default-worker-handlers"
import { canStartWorkerJob, type WorkerJobQueueEntry } from "./worker-job-queue"
import {
  runWorkerJobQueueEntry,
  type WorkerJobHandlers,
  type WorkerJobRunFailure,
  type WorkerJobRunResult,
  type WorkerJobRunSuccess
} from "./worker-job-runner"

export type WorkerOrchestratorOptions = DefaultWorkerJobHandlerOptions & {
  handlers?: WorkerJobHandlers
}

export type WorkerBatchRunSummary = {
  totalCount: number
  completedCount: number
  failedCount: number
  skippedCount: number
  startedAt: string
  finishedAt: string
}

export type WorkerBatchRunResult = {
  results: WorkerJobRunResult[]
  skippedEntries: WorkerJobQueueEntry[]
  summary: WorkerBatchRunSummary
}

function resolveNow(options: WorkerOrchestratorOptions) {
  return options.now ?? new Date()
}

function resolveHandlers(options: WorkerOrchestratorOptions) {
  return options.handlers ?? createDefaultWorkerJobHandlers({ now: resolveNow(options) })
}

function isSuccess(result: WorkerJobRunResult): result is WorkerJobRunSuccess {
  return result.ok
}

function isFailure(result: WorkerJobRunResult): result is WorkerJobRunFailure {
  return !result.ok
}

export async function runWorkerQueueEntry(
  entry: WorkerJobQueueEntry,
  options: WorkerOrchestratorOptions = {}
) {
  const now = resolveNow(options)
  const handlers = resolveHandlers({ ...options, now })

  return runWorkerJobQueueEntry(entry, handlers, { now })
}

export async function runWorkerQueueBatch(
  entries: WorkerJobQueueEntry[],
  options: WorkerOrchestratorOptions = {}
): Promise<WorkerBatchRunResult> {
  const now = resolveNow(options)
  const handlers = resolveHandlers({ ...options, now })
  const results: WorkerJobRunResult[] = []
  const skippedEntries: WorkerJobQueueEntry[] = []

  for (const entry of entries) {
    if (!canStartWorkerJob(entry)) {
      skippedEntries.push(entry)
      continue
    }

    results.push(await runWorkerJobQueueEntry(entry, handlers, { now }))
  }

  const finishedAt = now.toISOString()

  return {
    results,
    skippedEntries,
    summary: {
      totalCount: entries.length,
      completedCount: results.filter(isSuccess).length,
      failedCount: results.filter(isFailure).length,
      skippedCount: skippedEntries.length,
      startedAt: finishedAt,
      finishedAt
    }
  }
}

export function createWorkerOrchestrator(options: WorkerOrchestratorOptions = {}) {
  return {
    runOne: (entry: WorkerJobQueueEntry) => runWorkerQueueEntry(entry, options),
    runBatch: (entries: WorkerJobQueueEntry[]) => runWorkerQueueBatch(entries, options)
  }
}
