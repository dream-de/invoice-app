import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { runScheduledWorkerCycle } from "../scheduled-worker-cycle"
import { createInMemoryWorkerJobQueueStore } from "../worker-job-store"
import type { ScheduledJobSchedule } from "../scheduled"

const now = new Date("2026-05-20T10:00:00.000Z")

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

describe("scheduled worker cycle", () => {
  it("enqueues due schedules and processes them in one cycle", async () => {
    const store = createInMemoryWorkerJobQueueStore()
    const result = await runScheduledWorkerCycle(
      store,
      [
        createSchedule({ id: "due-recurring", kind: "recurring-invoices" }),
        createSchedule({ id: "future-maintenance", kind: "maintenance", nextRunAt: "2026-05-20T12:00:00.000Z" })
      ],
      { now }
    )

    assert.equal(result.enqueue.enqueuedCount, 1)
    assert.deepEqual(result.enqueue.skippedScheduleIds, ["future-maintenance"])
    assert.equal(result.worker.loadedCount, 1)
    assert.equal(result.worker.savedCount, 1)
    assert.equal(result.worker.summary.completedCount, 1)
    assert.equal(result.worker.summary.failedCount, 0)
    assert.deepEqual(
      store.getAllEntries().map((entry) => [entry.kind, entry.status, entry.payload.scheduleId]),
      [["scheduled", "completed", "due-recurring"]]
    )
  })

  it("returns an empty worker result when no schedules are due", async () => {
    const store = createInMemoryWorkerJobQueueStore()
    const result = await runScheduledWorkerCycle(
      store,
      [
        createSchedule({ id: "future-reminder", kind: "payment-reminders", nextRunAt: "2026-05-20T12:00:00.000Z" }),
        createSchedule({ id: "disabled-dunning", kind: "dunning-run", enabled: false })
      ],
      { now }
    )

    assert.equal(result.enqueue.enqueuedCount, 0)
    assert.deepEqual(result.enqueue.skippedScheduleIds, ["future-reminder", "disabled-dunning"])
    assert.equal(result.worker.loadedCount, 0)
    assert.equal(result.worker.savedCount, 0)
    assert.equal(result.worker.summary.totalCount, 0)
    assert.equal(result.worker.summary.completedCount, 0)
    assert.deepEqual(store.getAllEntries(), [])
  })

  it("passes lookback and limit options through the scheduled and worker cycles", async () => {
    const store = createInMemoryWorkerJobQueueStore()
    const result = await runScheduledWorkerCycle(
      store,
      [
        createSchedule({ id: "due-maintenance-a", kind: "maintenance" }),
        createSchedule({ id: "due-maintenance-b", kind: "maintenance" })
      ],
      { now, lookbackMinutes: 15, limit: 1 }
    )

    assert.equal(result.enqueue.enqueuedCount, 2)
    assert.equal(result.worker.loadedCount, 1)
    assert.equal(result.worker.savedCount, 1)
    assert.deepEqual(
      store.getAllEntries().map((entry) => [entry.payload.scheduleId, entry.status, entry.payload.window]),
      [
        [
          "due-maintenance-a",
          "completed",
          {
            startsAt: "2026-05-20T09:45:00.000Z",
            endsAt: "2026-05-20T10:00:00.000Z",
            timezone: "Europe/Berlin"
          }
        ],
        [
          "due-maintenance-b",
          "queued",
          {
            startsAt: "2026-05-20T09:45:00.000Z",
            endsAt: "2026-05-20T10:00:00.000Z",
            timezone: "Europe/Berlin"
          }
        ]
      ]
    )
  })
})
