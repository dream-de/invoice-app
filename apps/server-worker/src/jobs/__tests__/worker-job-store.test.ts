import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createInMemoryWorkerJobQueueStore } from "../worker-job-store"
import { createWorkerJobQueueEntry, startWorkerJobQueueEntry } from "../worker-job-queue"
import type { WorkerJob } from "../worker-job"

const now = new Date("2026-05-20T10:00:00.000Z")

function createJob(id: string): WorkerJob {
  return {
    id,
    kind: "pdf",
    payload: {
      documentId: id,
      format: "invoice"
    },
    createdAt: now.toISOString()
  }
}

describe("worker job queue store", () => {
  it("lists only queued entries and applies the optional limit", async () => {
    const queuedA = createWorkerJobQueueEntry({ job: createJob("queued-a"), now })
    const queuedB = createWorkerJobQueueEntry({ job: createJob("queued-b"), now })
    const running = startWorkerJobQueueEntry(createWorkerJobQueueEntry({ job: createJob("running"), now }), { now })
    const store = createInMemoryWorkerJobQueueStore([queuedA, running, queuedB])

    assert.deepEqual(
      (await store.listQueuedEntries()).map((entry) => entry.id),
      ["queued-a", "queued-b"]
    )
    assert.deepEqual(
      (await store.listQueuedEntries({ limit: 1 })).map((entry) => entry.id),
      ["queued-a"]
    )
  })

  it("saves updated entries by replacing the previous entry", async () => {
    const queued = createWorkerJobQueueEntry({ job: createJob("queued-a"), now })
    const store = createInMemoryWorkerJobQueueStore([queued])
    const running = startWorkerJobQueueEntry(queued, { now })

    await store.saveEntry(running)

    assert.deepEqual(
      store.getAllEntries().map((entry) => [entry.id, entry.status]),
      [["queued-a", "running"]]
    )
  })
})
