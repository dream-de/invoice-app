import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  canStartWorkerJob,
  cancelWorkerJobQueueEntry,
  completeWorkerJobQueueEntry,
  createWorkerJobQueueEntry,
  failWorkerJobQueueEntry,
  startWorkerJobQueueEntry
} from "../worker-job-queue"
import type { WorkerJob } from "../worker-job"

const createdAt = new Date("2026-05-20T10:00:00.000Z")
const startedAt = new Date("2026-05-20T10:01:00.000Z")
const finishedAt = new Date("2026-05-20T10:02:00.000Z")

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

describe("worker job queue entries", () => {
  it("creates queued entries with default retry metadata", () => {
    const entry = createWorkerJobQueueEntry({ job: createJob(), now: createdAt })

    assert.equal(entry.status, "queued")
    assert.equal(entry.createdAt, createdAt.toISOString())
    assert.equal(entry.updatedAt, createdAt.toISOString())
    assert.equal(entry.retryState.attempt, 0)
    assert.equal(entry.retryPolicy.strategy, "exponential")
    assert.equal(canStartWorkerJob(entry), true)
  })

  it("starts queued entries and increments the attempt", () => {
    const entry = createWorkerJobQueueEntry({ job: createJob(), now: createdAt })
    const running = startWorkerJobQueueEntry(entry, { now: startedAt })

    assert.equal(running.status, "running")
    assert.equal(running.retryState.attempt, 1)
    assert.equal(running.lockedAt, startedAt.toISOString())
    assert.equal(running.startedAt, startedAt.toISOString())
    assert.equal(canStartWorkerJob(running), false)
  })

  it("completes running entries", () => {
    const entry = createWorkerJobQueueEntry({ job: createJob(), now: createdAt })
    const running = startWorkerJobQueueEntry(entry, { now: startedAt })
    const completed = completeWorkerJobQueueEntry(running, { now: finishedAt })

    assert.equal(completed.status, "completed")
    assert.equal(completed.lockedAt, undefined)
    assert.equal(completed.completedAt, finishedAt.toISOString())
    assert.equal(completed.updatedAt, finishedAt.toISOString())
  })

  it("fails running entries with failure metadata", () => {
    const entry = createWorkerJobQueueEntry({ job: createJob(), now: createdAt })
    const running = startWorkerJobQueueEntry(entry, { now: startedAt })
    const failed = failWorkerJobQueueEntry(running, {
      now: finishedAt,
      failure: {
        code: "PDF_RENDER_FAILED",
        message: "PDF could not be rendered",
        retryable: true
      }
    })

    assert.equal(failed.status, "failed")
    assert.equal(failed.lockedAt, undefined)
    assert.equal(failed.failedAt, finishedAt.toISOString())
    assert.equal(failed.retryState.lastErrorCode, "PDF_RENDER_FAILED")
    assert.deepEqual(failed.lastFailure, {
      code: "PDF_RENDER_FAILED",
      message: "PDF could not be rendered",
      retryable: true
    })
  })

  it("cancels queued and running entries", () => {
    const entry = createWorkerJobQueueEntry({ job: createJob(), now: createdAt })
    const cancelledQueued = cancelWorkerJobQueueEntry(entry, { now: finishedAt })
    const cancelledRunning = cancelWorkerJobQueueEntry(startWorkerJobQueueEntry(entry, { now: startedAt }), { now: finishedAt })

    assert.equal(cancelledQueued.status, "cancelled")
    assert.equal(cancelledQueued.cancelledAt, finishedAt.toISOString())
    assert.equal(cancelledRunning.status, "cancelled")
    assert.equal(cancelledRunning.lockedAt, undefined)
  })

  it("rejects invalid transitions", () => {
    const entry = createWorkerJobQueueEntry({ job: createJob(), now: createdAt })
    const running = startWorkerJobQueueEntry(entry, { now: startedAt })
    const completed = completeWorkerJobQueueEntry(running, { now: finishedAt })

    assert.throws(() => startWorkerJobQueueEntry(running), /Cannot start worker job/)
    assert.throws(() => completeWorkerJobQueueEntry(entry), /Cannot complete worker job/)
    assert.throws(
      () => failWorkerJobQueueEntry(entry, { failure: { code: "X", message: "X", retryable: false } }),
      /Cannot fail worker job/
    )
    assert.throws(() => cancelWorkerJobQueueEntry(completed), /Cannot cancel worker job/)
  })
})
