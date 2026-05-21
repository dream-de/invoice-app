export type WorkerJobRetryStrategy = "none" | "fixed" | "exponential"

export type WorkerJobRetryPolicy = {
  strategy: WorkerJobRetryStrategy
  maxAttempts: number
  delayMs: number
  maxDelayMs?: number
}

export type WorkerJobRetryState = {
  attempt: number
  nextRunAt?: string
  lastErrorCode?: string
}

export const noRetryPolicy: WorkerJobRetryPolicy = {
  strategy: "none",
  maxAttempts: 1,
  delayMs: 0
}

export const defaultRetryPolicy: WorkerJobRetryPolicy = {
  strategy: "exponential",
  maxAttempts: 3,
  delayMs: 30_000,
  maxDelayMs: 5 * 60_000
}

export function canRetryWorkerJob(policy: WorkerJobRetryPolicy, state: WorkerJobRetryState) {
  return policy.strategy !== "none" && state.attempt < policy.maxAttempts
}

export function getNextRetryDelayMs(policy: WorkerJobRetryPolicy, state: WorkerJobRetryState) {
  if (policy.strategy === "none") return 0
  if (policy.strategy === "fixed") return policy.delayMs

  const delay = policy.delayMs * 2 ** Math.max(0, state.attempt - 1)
  return Math.min(delay, policy.maxDelayMs ?? delay)
}
