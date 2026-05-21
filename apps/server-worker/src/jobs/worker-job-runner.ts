import type { WorkerJobKind } from "./worker-job"
import {
  completeWorkerJobQueueEntry,
  failWorkerJobQueueEntry,
  startWorkerJobQueueEntry,
  type WorkerJobQueueEntry
} from "./worker-job-queue"
import type { WorkerJobFailure } from "./worker-job-status"

export type WorkerJobHandlerResult<TOutput = Record<string, unknown>> = {
  output?: TOutput
}

export type WorkerJobHandler<TPayload extends Record<string, unknown> = Record<string, unknown>, TOutput = Record<string, unknown>> = (
  entry: WorkerJobQueueEntry<TPayload>
) => Promise<WorkerJobHandlerResult<TOutput>> | WorkerJobHandlerResult<TOutput>

export type WorkerJobHandlers = Partial<Record<WorkerJobKind, WorkerJobHandler>>

export type WorkerJobRunSuccess<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  ok: true
  entry: WorkerJobQueueEntry<TPayload>
  output?: Record<string, unknown>
}

export type WorkerJobRunFailure<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  ok: false
  entry: WorkerJobQueueEntry<TPayload>
  failure: WorkerJobFailure
}

export type WorkerJobRunResult<TPayload extends Record<string, unknown> = Record<string, unknown>> =
  | WorkerJobRunSuccess<TPayload>
  | WorkerJobRunFailure<TPayload>

type RunWorkerJobOptions = {
  now?: Date
}

export function createWorkerJobFailure(error: unknown, fallbackCode = "WORKER_JOB_FAILED"): WorkerJobFailure {
  if (error instanceof Error) {
    return {
      code: fallbackCode,
      message: error.message,
      retryable: true
    }
  }

  return {
    code: fallbackCode,
    message: "Worker job failed",
    retryable: true
  }
}

export async function runWorkerJobQueueEntry<TPayload extends Record<string, unknown>>(
  entry: WorkerJobQueueEntry<TPayload>,
  handlers: WorkerJobHandlers,
  options: RunWorkerJobOptions = {}
): Promise<WorkerJobRunResult<TPayload>> {
  const handler = handlers[entry.kind]
  const started = startWorkerJobQueueEntry(entry, options)

  if (!handler) {
    const failure: WorkerJobFailure = {
      code: "WORKER_JOB_HANDLER_MISSING",
      message: "No worker job handler registered for kind " + entry.kind,
      retryable: false
    }

    return {
      ok: false,
      entry: failWorkerJobQueueEntry(started, { ...options, failure }),
      failure
    }
  }

  try {
    const result = await handler(started)

    return {
      ok: true,
      entry: completeWorkerJobQueueEntry(started, options),
      output: result.output
    }
  } catch (error) {
    const failure = createWorkerJobFailure(error)

    return {
      ok: false,
      entry: failWorkerJobQueueEntry(started, { ...options, failure }),
      failure
    }
  }
}
