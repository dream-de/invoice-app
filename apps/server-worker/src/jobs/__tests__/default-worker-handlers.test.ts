import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createDefaultWorkerJobHandlers } from "../default-worker-handlers"
import { createWorkerJobQueueEntry } from "../worker-job-queue"
import { runWorkerJobQueueEntry } from "../worker-job-runner"
import type { WorkerJob } from "../worker-job"

const now = new Date("2026-05-20T10:00:00.000Z")

function createJob(overrides: Partial<WorkerJob> = {}): WorkerJob {
  return {
    id: "job-1",
    kind: "pdf",
    payload: {},
    createdAt: now.toISOString(),
    ...overrides
  }
}

describe("default worker job handlers", () => {
  it("registers all supported worker job handlers", () => {
    const handlers = createDefaultWorkerJobHandlers({ now })

    assert.equal(typeof handlers.pdf, "function")
    assert.equal(typeof handlers.email, "function")
    assert.equal(typeof handlers.import, "function")
    assert.equal(typeof handlers.scheduled, "function")
  })

  it("runs the PDF handler through the queue runner", async () => {
    const entry = createWorkerJobQueueEntry({
      job: createJob({
        id: "pdf-job",
        kind: "pdf",
        payload: {
          documentId: "doc-42",
          format: "invoice"
        }
      }),
      now
    })

    const result = await runWorkerJobQueueEntry(entry, createDefaultWorkerJobHandlers({ now }), { now })

    assert.equal(result.ok, true)
    assert.equal(result.entry.status, "completed")
    assert.deepEqual(result.output, {
      jobId: "pdf-job",
      documentId: "doc-42",
      fileName: "invoice-doc-42.pdf",
      contentType: "application/pdf",
      completedAt: now.toISOString()
    })
  })

  it("runs the scheduled handler through the queue runner", async () => {
    const entry = createWorkerJobQueueEntry({
      job: createJob({
        id: "scheduled-job",
        kind: "scheduled",
        payload: {
          id: "scheduled-maintenance-1",
          kind: "maintenance",
          window: {
            startsAt: "2026-05-20T09:00:00.000Z",
            endsAt: "2026-05-20T10:00:00.000Z",
            timezone: "Europe/Berlin"
          },
          priority: "normal",
          dryRun: true,
          createdAt: now.toISOString()
        }
      }),
      now
    })

    const result = await runWorkerJobQueueEntry(entry, createDefaultWorkerJobHandlers({ now }), { now })

    assert.equal(result.ok, true)
    assert.equal(result.entry.status, "completed")
    assert.equal(result.output?.jobId, "scheduled-maintenance-1")
    assert.equal(result.output?.kind, "maintenance")
    assert.equal(result.output?.dryRun, true)
  })

  it("fails invalid scheduled payloads without completing the entry", async () => {
    const entry = createWorkerJobQueueEntry({
      job: createJob({
        id: "broken-scheduled-job",
        kind: "scheduled",
        payload: {
          kind: "unknown"
        }
      }),
      now
    })

    const result = await runWorkerJobQueueEntry(entry, createDefaultWorkerJobHandlers({ now }), { now })

    assert.equal(result.ok, false)
    assert.equal(result.entry.status, "failed")
    assert.equal(result.failure.code, "WORKER_JOB_FAILED")
    assert.equal(result.failure.message, "Scheduled worker job payload has an invalid kind")
  })
})
