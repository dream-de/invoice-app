import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  createDueScheduledWorkerQueueEntries,
  createScheduledWorkerJob,
  createScheduledWorkerQueueEntry,
  enqueueDueScheduledJobs
} from "../scheduled-queue"
import { createInMemoryWorkerJobQueueStore } from "../worker-job-store"
import type { ScheduledJobSchedule, ScheduledProcessingJob } from "../scheduled"

const now = new Date("2026-05-20T10:00:00.000Z")

function createScheduledJob(overrides: Partial<ScheduledProcessingJob> = {}): ScheduledProcessingJob {
  return {
    id: "scheduled-maintenance-1779271200000",
    kind: "maintenance",
    scheduleId: "maintenance-daily",
    window: {
      startsAt: "2026-05-20T09:00:00.000Z",
      endsAt: "2026-05-20T10:00:00.000Z",
      timezone: "Europe/Berlin"
    },
    priority: "normal",
    dryRun: true,
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

describe("scheduled queue bridge", () => {
  it("converts a scheduled processing job into a scheduled worker job", () => {
    const job = createScheduledWorkerJob(createScheduledJob())

    assert.equal(job.id, "scheduled-maintenance-1779271200000-maintenance-daily")
    assert.equal(job.kind, "scheduled")
    assert.equal(job.createdAt, now.toISOString())
    assert.deepEqual(job.payload, {
      id: "scheduled-maintenance-1779271200000",
      kind: "maintenance",
      scheduleId: "maintenance-daily",
      window: {
        startsAt: "2026-05-20T09:00:00.000Z",
        endsAt: "2026-05-20T10:00:00.000Z",
        timezone: "Europe/Berlin"
      },
      requestedBy: undefined,
      priority: "normal",
      dryRun: true,
      createdAt: now.toISOString()
    })
  })

  it("creates a queued worker entry from a scheduled processing job", () => {
    const entry = createScheduledWorkerQueueEntry(createScheduledJob())

    assert.equal(entry.id, "scheduled-maintenance-1779271200000-maintenance-daily")
    assert.equal(entry.kind, "scheduled")
    assert.equal(entry.status, "queued")
    assert.equal(entry.createdAt, now.toISOString())
    assert.equal(entry.updatedAt, now.toISOString())
  })

  it("creates worker queue entries only for due schedules", () => {
    const plan = createDueScheduledWorkerQueueEntries(
      [
        createSchedule({ id: "due-maintenance", kind: "maintenance" }),
        createSchedule({ id: "future-reminder", kind: "payment-reminders", nextRunAt: "2026-05-20T11:00:00.000Z" }),
        createSchedule({ id: "disabled-dunning", kind: "dunning-run", enabled: false })
      ],
      { now }
    )

    assert.equal(plan.createdAt, now.toISOString())
    assert.deepEqual(
      plan.queueEntries.map((entry) => [entry.payload.scheduleId, entry.payload.kind]),
      [["due-maintenance", "maintenance"]]
    )
    assert.deepEqual(plan.skippedScheduleIds, ["future-reminder", "disabled-dunning"])
  })

  it("enqueues due scheduled jobs into a worker queue store", async () => {
    const store = createInMemoryWorkerJobQueueStore()
    const result = await enqueueDueScheduledJobs(
      store,
      [
        createSchedule({ id: "due-recurring", kind: "recurring-invoices" }),
        createSchedule({ id: "future-maintenance", kind: "maintenance", nextRunAt: "2026-05-20T12:00:00.000Z" })
      ],
      { now }
    )

    assert.equal(result.enqueuedCount, 1)
    assert.deepEqual(result.skippedScheduleIds, ["future-maintenance"])
    assert.deepEqual(
      store.getAllEntries().map((entry) => [entry.kind, entry.status, entry.payload.scheduleId]),
      [["scheduled", "queued", "due-recurring"]]
    )
  })
})
