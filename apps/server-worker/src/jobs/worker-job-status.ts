import type { WorkerJobKind } from "./worker-job"

export const workerJobStatuses = ["queued", "running", "completed", "failed", "cancelled"] as const

export type WorkerJobStatus = typeof workerJobStatuses[number]

export type WorkerJobFailure = {
  code: string
  message: string
  retryable: boolean
}

export type WorkerJobExecutionResult<TOutput = Record<string, unknown>> = {
  jobId: string
  kind: WorkerJobKind
  status: Extract<WorkerJobStatus, "completed" | "failed" | "cancelled">
  output?: TOutput
  failure?: WorkerJobFailure
  completedAt: string
}

export function isWorkerJobStatus(value: string): value is WorkerJobStatus {
  return workerJobStatuses.includes(value as WorkerJobStatus)
}

export function isTerminalWorkerJobStatus(status: WorkerJobStatus) {
  return status === "completed" || status === "failed" || status === "cancelled"
}
