import { canStartWorkerJob, type WorkerJobQueueEntry } from "./worker-job-queue"

export type WorkerJobQueueListOptions = {
  limit?: number
}

export type WorkerJobQueueStore = {
  listQueuedEntries(options?: WorkerJobQueueListOptions): Promise<WorkerJobQueueEntry[]> | WorkerJobQueueEntry[]
  saveEntry(entry: WorkerJobQueueEntry): Promise<void> | void
}

export type InMemoryWorkerJobQueueStore = WorkerJobQueueStore & {
  getAllEntries(): WorkerJobQueueEntry[]
  replaceEntries(entries: WorkerJobQueueEntry[]): void
}

export function createInMemoryWorkerJobQueueStore(initialEntries: WorkerJobQueueEntry[] = []): InMemoryWorkerJobQueueStore {
  let entries = [...initialEntries]

  return {
    listQueuedEntries(options: WorkerJobQueueListOptions = {}) {
      const queuedEntries = entries.filter(canStartWorkerJob)

      if (typeof options.limit === "number") {
        return queuedEntries.slice(0, Math.max(0, options.limit))
      }

      return queuedEntries
    },
    saveEntry(entry: WorkerJobQueueEntry) {
      const index = entries.findIndex((item) => item.id === entry.id)

      if (index === -1) {
        entries.push(entry)
        return
      }

      entries = [
        ...entries.slice(0, index),
        entry,
        ...entries.slice(index + 1)
      ]
    },
    getAllEntries() {
      return [...entries]
    },
    replaceEntries(nextEntries: WorkerJobQueueEntry[]) {
      entries = [...nextEntries]
    }
  }
}
