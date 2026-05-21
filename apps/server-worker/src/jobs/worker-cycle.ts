import { runWorkerQueueBatch, type WorkerBatchRunResult, type WorkerOrchestratorOptions } from "./worker-orchestrator"
import type { WorkerJobQueueEntry } from "./worker-job-queue"
import type { WorkerJobQueueStore } from "./worker-job-store"

export type WorkerCycleOptions = WorkerOrchestratorOptions & {
  limit?: number
}

export type WorkerCycleResult = WorkerBatchRunResult & {
  loadedCount: number
  savedCount: number
}

export async function runWorkerCycle(
  store: WorkerJobQueueStore,
  options: WorkerCycleOptions = {}
): Promise<WorkerCycleResult> {
  const entries = await store.listQueuedEntries({ limit: options.limit })
  const batch = await runWorkerQueueBatch(entries, options)
  const savedEntries: WorkerJobQueueEntry[] = batch.results.map((result) => result.entry)

  for (const entry of savedEntries) {
    await store.saveEntry(entry)
  }

  return {
    ...batch,
    loadedCount: entries.length,
    savedCount: savedEntries.length
  }
}
