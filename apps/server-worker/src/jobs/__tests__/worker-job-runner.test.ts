import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createWorkerJobQueueEntry } from "../worker-job-queue"
import { createWorkerJobFailure, runWorkerJobQueueEntry } from "../worker-job-runner"
import type { WorkerJob } from "../worker-job"

const now = new Date("2026-05-20T10:00:00.000Z")
const runAt = new Date("2026-05-20T10:01:00.000Z")

function createJob(overrides: Partial<WorkerJob> = {}): WorkerJob {
  return {
    id: "job-1",
    kind: "pdf",
    payload: {
      documentId: "doc-1"
    },
    ...overrides
  }
}

describe("worker job runner", () => {
  it("runs a matching handler and completes the queue entry", async () => {
    const entry = createWorkerJobQueueEntry({ job: createJob(), now })
    const result = await runWorkerJobQueueEntry(
      entry,
      {
        pdf: (startedEntry) => {
          assert.equal(startedEntry.status, "running")
          assert.equal(startedEntry.retryState.attempt, 1)

          return {
            output: {
              fileName: "invoice.pdf"
            }
          }
        }
      },
      { now: runAt }
    )

    assert.equal(result.ok, true)
    assert.equal(result.entry.status, "completed")
    assert.equal(result.entry.startedAt, runAt.toISOString())
    assert.equal(result.entry.completedAt, runAt.toISOString())
    assert.deepEqual(result.output, { fileName: "invoice.pdf" })
  })

  it("fails when no handler is registered for the job kind", async () => {
    const entry = createWorkerJobQueueEntry({ job: createJob({ kind: "email" }), now })
    const result = await runWorkerJobQueueEntry(entry, {}, { now: runAt })

    assert.equal(result.ok, false)
    assert.equal(result.entry.status, "failed")
    assert.equal(result.failure.code, "WORKER_JOB_HANDLER_MISSING")
    assert.equal(result.failure.retryable, false)
    assert.equal(result.entry.lastFailure?.code, "WORKER_JOB_HANDLER_MISSING")
  })

  it("fails when a handler throws", async () => {
    const entry = createWorkerJobQueueEntry({ job: createJob(), now })
    const result = await runWorkerJobQueueEntry(
      entry,
      {
        pdf: () => {
          throw new Error("PDF renderer is unavailable")
        }
      },
      { now: runAt }
    )

    assert.equal(result.ok, false)
    assert.equal(result.entry.status, "failed")
    assert.equal(result.failure.code, "WORKER_JOB_FAILED")
    assert.equal(result.failure.message, "PDF renderer is unavailable")
    assert.equal(result.failure.retryable, true)
    assert.equal(result.entry.retryState.lastErrorCode, "WORKER_JOB_FAILED")
  })

  it("normalizes unknown thrown values", () => {
    assert.deepEqual(createWorkerJobFailure("boom"), {
      code: "WORKER_JOB_FAILED",
      message: "Worker job failed",
      retryable: true
    })
  })
})
