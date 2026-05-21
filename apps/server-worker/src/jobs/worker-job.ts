export const workerJobKinds = ["pdf", "email", "import", "scheduled"] as const

export type WorkerJobKind = typeof workerJobKinds[number]

export type WorkerJob = {
  id: string
  kind: WorkerJobKind
  payload: Record<string, unknown>
  createdAt?: string
}

export function isWorkerJobKind(value: string): value is WorkerJobKind {
  return workerJobKinds.includes(value as WorkerJobKind)
}

export function describeWorkerJob(job: WorkerJob) {
  return `${job.kind}:${job.id}`
}
