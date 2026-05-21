import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { runServerWorkerOnce } from "../../server-worker"
import { createWorkerJobQueueEntry } from "../worker-job-queue"
import { createInMemoryWorkerJobQueueStore } from "../worker-job-store"
import type { ScheduledJobSchedule } from "../scheduled"
import type { WorkerJob } from "../worker-job"

const now = new Date("2026-05-20T10:00:00.000Z")

function createJob(overrides: Partial<WorkerJob> = {}): WorkerJob {
  return {
    id: "pdf-1",
    kind: "pdf",
    payload: {
      documentId: "doc-1",
      format: "invoice"
    },
    createdAt: now.toISOString(),
    ...overrides
  }
}

function createSchedule(overrides: Partial<ScheduledJobSchedule> = {}): ScheduledJobSchedule {
  return {
    id: "schedule-1",
    kind: "maintenance",
    enabled: true,
    cadence: "daily",
    timezone: "Europe/Berlin",
    nextRunAt: "2026-05-20T09:30:00.000Z",
    dryRun: true,
    ...overrides
  }
}

describe("server worker entrypoint", () => {
  it("runs the queue worker mode by default", async () => {
    const store = createInMemoryWorkerJobQueueStore([
      createWorkerJobQueueEntry({ job: createJob(), now })
    ])

    const result = await runServerWorkerOnce(store, { now })

    assert.equal(result.mode, "queue")
    if (result.mode !== "queue") throw new Error("Expected queue mode")
    assert.equal(result.worker.loadedCount, 1)
    assert.equal(result.worker.summary.completedCount, 1)
    assert.deepEqual(
      store.getAllEntries().map((entry) => [entry.id, entry.status]),
      [["pdf-1", "completed"]]
    )
  })

  it("runs scheduled mode when schedules are provided", async () => {
    const store = createInMemoryWorkerJobQueueStore()
    const result = await runServerWorkerOnce(store, {
      now,
      schedules: [
        createSchedule({ id: "due-maintenance", kind: "maintenance" }),
        createSchedule({ id: "future-reminder", kind: "payment-reminders", nextRunAt: "2026-05-20T12:00:00.000Z" })
      ]
    })

    assert.equal(result.mode, "scheduled")
    if (result.mode !== "scheduled") throw new Error("Expected scheduled mode")
    assert.equal(result.scheduled.enqueue.enqueuedCount, 1)
    assert.deepEqual(result.scheduled.enqueue.skippedScheduleIds, ["future-reminder"])
    assert.equal(result.scheduled.worker.summary.completedCount, 1)
    assert.deepEqual(
      store.getAllEntries().map((entry) => [entry.kind, entry.status, entry.payload.scheduleId]),
      [["scheduled", "completed", "due-maintenance"]]
    )
  })

  it("can force scheduled mode even without schedules", async () => {
    const store = createInMemoryWorkerJobQueueStore()
    const result = await runServerWorkerOnce(store, { now, mode: "scheduled" })

    assert.equal(result.mode, "scheduled")
    if (result.mode !== "scheduled") throw new Error("Expected scheduled mode")
    assert.equal(result.scheduled.enqueue.enqueuedCount, 0)
    assert.equal(result.scheduled.worker.loadedCount, 0)
  })
})
