import type { WorkerJob } from "./worker-job"
import { isTerminalWorkerJobStatus, type WorkerJobFailure, type WorkerJobStatus } from "./worker-job-status"
import { defaultRetryPolicy, type WorkerJobRetryPolicy, type WorkerJobRetryState } from "./worker-job-retry"

export type WorkerJobQueueEntry<TPayload extends Record<string, unknown> = Record<string, unknown>> = WorkerJob & {
  payload: TPayload
  status: WorkerJobStatus
  retryPolicy: WorkerJobRetryPolicy
  retryState: WorkerJobRetryState
  lockedAt?: string
  startedAt?: string
  completedAt?: string
  failedAt?: string
  cancelledAt?: string
  lastFailure?: WorkerJobFailure
  updatedAt: string
}

type CreateWorkerJobQueueEntryInput<TPayload extends Record<string, unknown> = Record<string, unknown>> = {
  job: WorkerJob & { payload: TPayload }
  retryPolicy?: WorkerJobRetryPolicy
  now?: Date
}

type UpdateWorkerJobQueueEntryOptions = {
  now?: Date
}

type FailWorkerJobQueueEntryOptions = UpdateWorkerJobQueueEntryOptions & {
  failure: WorkerJobFailure
}

export function createWorkerJobQueueEntry<TPayload extends Record<string, unknown>>(
  input: CreateWorkerJobQueueEntryInput<TPayload>
): WorkerJobQueueEntry<TPayload> {
  const now = input.now ?? new Date()
  const timestamp = now.toISOString()

  return {
    ...input.job,
    status: "queued",
    retryPolicy: input.retryPolicy ?? defaultRetryPolicy,
    retryState: {
      attempt: 0
    },
    createdAt: input.job.createdAt ?? timestamp,
    updatedAt: timestamp
  }
}

export function canStartWorkerJob(entry: WorkerJobQueueEntry) {
  return entry.status === "queued"
}

export function startWorkerJobQueueEntry<TPayload extends Record<string, unknown>>(
  entry: WorkerJobQueueEntry<TPayload>,
  options: UpdateWorkerJobQueueEntryOptions = {}
): WorkerJobQueueEntry<TPayload> {
  if (!canStartWorkerJob(entry)) {
    throw new Error("Cannot start worker job " + entry.id + " from status " + entry.status)
  }

  const now = options.now ?? new Date()
  const timestamp = now.toISOString()

  return {
    ...entry,
    status: "running",
    retryState: {
      ...entry.retryState,
      attempt: entry.retryState.attempt + 1
    },
    lockedAt: timestamp,
    startedAt: timestamp,
    updatedAt: timestamp
  }
}

export function completeWorkerJobQueueEntry<TPayload extends Record<string, unknown>>(
  entry: WorkerJobQueueEntry<TPayload>,
  options: UpdateWorkerJobQueueEntryOptions = {}
): WorkerJobQueueEntry<TPayload> {
  if (entry.status !== "running") {
    throw new Error("Cannot complete worker job " + entry.id + " from status " + entry.status)
  }

  const now = options.now ?? new Date()
  const timestamp = now.toISOString()

  return {
    ...entry,
    status: "completed",
    lockedAt: undefined,
    completedAt: timestamp,
    updatedAt: timestamp
  }
}

export function failWorkerJobQueueEntry<TPayload extends Record<string, unknown>>(
  entry: WorkerJobQueueEntry<TPayload>,
  options: FailWorkerJobQueueEntryOptions
): WorkerJobQueueEntry<TPayload> {
  if (entry.status !== "running") {
    throw new Error("Cannot fail worker job " + entry.id + " from status " + entry.status)
  }

  const now = options.now ?? new Date()
  const timestamp = now.toISOString()

  return {
    ...entry,
    status: "failed",
    lockedAt: undefined,
    failedAt: timestamp,
    lastFailure: options.failure,
    retryState: {
      ...entry.retryState,
      lastErrorCode: options.failure.code
    },
    updatedAt: timestamp
  }
}

export function cancelWorkerJobQueueEntry<TPayload extends Record<string, unknown>>(
  entry: WorkerJobQueueEntry<TPayload>,
  options: UpdateWorkerJobQueueEntryOptions = {}
): WorkerJobQueueEntry<TPayload> {
  if (isTerminalWorkerJobStatus(entry.status)) {
    throw new Error("Cannot cancel worker job " + entry.id + " from status " + entry.status)
  }

  const now = options.now ?? new Date()
  const timestamp = now.toISOString()

  return {
    ...entry,
    status: "cancelled",
    lockedAt: undefined,
    cancelledAt: timestamp,
    updatedAt: timestamp
  }
}
