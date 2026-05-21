import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createWorkerOrchestrator, runWorkerQueueBatch, runWorkerQueueEntry } from "../worker-orchestrator"
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

describe("worker orchestrator", () => {
  it("runs one queue entry with the default handlers", async () => {
    const entry = createWorkerJobQueueEntry({ job: createJob({ id: "pdf-1" }), now })
    const result = await runWorkerQueueEntry(entry, { now })

    assert.equal(result.ok, true)
    assert.equal(result.entry.status, "completed")
    assert.deepEqual(result.output, {
      jobId: "pdf-1",
      documentId: "doc-1",
      fileName: "invoice-doc-1.pdf",
      contentType: "application/pdf",
      completedAt: now.toISOString()
    })
  })

  it("runs a batch and summarizes completed, failed and skipped entries", async () => {
    const queuedPdf = createWorkerJobQueueEntry({ job: createJob({ id: "pdf-1" }), now })
    const queuedBrokenScheduled = createWorkerJobQueueEntry({
      job: createJob({
        id: "scheduled-broken",
        kind: "scheduled",
        payload: {
          kind: "unknown"
        }
      }),
      now
    })
    const alreadyRunning = startWorkerJobQueueEntry(
      createWorkerJobQueueEntry({ job: createJob({ id: "already-running" }), now }),
      { now }
    )

    const result = await runWorkerQueueBatch([queuedPdf, queuedBrokenScheduled, alreadyRunning], { now })

    assert.equal(result.summary.totalCount, 3)
    assert.equal(result.summary.completedCount, 1)
    assert.equal(result.summary.failedCount, 1)
    assert.equal(result.summary.skippedCount, 1)
    assert.equal(result.summary.startedAt, now.toISOString())
    assert.equal(result.summary.finishedAt, now.toISOString())
    assert.deepEqual(result.skippedEntries.map((entry) => entry.id), ["already-running"])
    assert.deepEqual(
      result.results.map((item) => [item.entry.id, item.ok]),
      [
        ["pdf-1", true],
        ["scheduled-broken", false]
      ]
    )
  })

  it("creates a reusable orchestrator instance", async () => {
    const orchestrator = createWorkerOrchestrator({ now })
    const entry = createWorkerJobQueueEntry({
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

    const result = await orchestrator.runOne(entry)

    assert.equal(result.ok, true)
    assert.equal(result.entry.status, "completed")
    assert.equal(result.output?.jobId, "email-1")
    assert.equal(result.output?.dryRun, true)
  })
})
