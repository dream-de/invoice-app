import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { runWorkerCycle } from "../worker-cycle"
import { createInMemoryWorkerJobQueueStore } from "../worker-job-store"
import { createWorkerJobQueueEntry, startWorkerJobQueueEntry } from "../worker-job-queue"
import type { WorkerJob } from "../worker-job"

const now = new Date("2026-05-20T10:00:00.000Z")

function createJob(overrides: Partial<WorkerJob> = {}): WorkerJob {
  return {
    id: "job-1",
    kind: "pdf",
    payload: {
      documentId: "doc-1",
      format: "invoice"
    },
    createdAt: now.toISOString(),
    ...overrides
  }
}

describe("worker cycle", () => {
  it("loads queued jobs, runs them and persists their final status", async () => {
    const queuedPdf = createWorkerJobQueueEntry({ job: createJob({ id: "pdf-1" }), now })
    const queuedEmail = createWorkerJobQueueEntry({
      job: createJob({
        id: "email-1",
        kind: "email",
        payload: {
          subject: "Test",
          recipients: [{ email: "demo@example.com" }]
        }
      }),
      now
    })
    const running = startWorkerJobQueueEntry(createWorkerJobQueueEntry({ job: createJob({ id: "running-1" }), now }), { now })
    const store = createInMemoryWorkerJobQueueStore([queuedPdf, running, queuedEmail])

    const result = await runWorkerCycle(store, { now })

    assert.equal(result.loadedCount, 2)
    assert.equal(result.savedCount, 2)
    assert.equal(result.summary.totalCount, 2)
    assert.equal(result.summary.completedCount, 2)
    assert.equal(result.summary.failedCount, 0)
    assert.equal(result.summary.skippedCount, 0)
    assert.deepEqual(
      store.getAllEntries().map((entry) => [entry.id, entry.status]),
      [
        ["pdf-1", "completed"],
        ["running-1", "running"],
        ["email-1", "completed"]
      ]
    )
  })

  it("respects the cycle limit", async () => {
    const store = createInMemoryWorkerJobQueueStore([
      createWorkerJobQueueEntry({ job: createJob({ id: "pdf-1" }), now }),
      createWorkerJobQueueEntry({ job: createJob({ id: "pdf-2", payload: { documentId: "doc-2", format: "invoice" } }), now })
    ])

    const result = await runWorkerCycle(store, { now, limit: 1 })

    assert.equal(result.loadedCount, 1)
    assert.equal(result.savedCount, 1)
    assert.deepEqual(
      store.getAllEntries().map((entry) => [entry.id, entry.status]),
      [
        ["pdf-1", "completed"],
        ["pdf-2", "queued"]
      ]
    )
  })
})
