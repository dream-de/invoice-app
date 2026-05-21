import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  createDueScheduledProcessingJobs,
  createScheduledJobWindow,
  createScheduledProcessingJob,
  createScheduledProcessingJobFromSchedule,
  isScheduledJobDue,
  isScheduledJobKind,
  scheduledJobKinds,
  type ScheduledJobSchedule
} from "../scheduled"

const now = new Date("2026-05-20T10:00:00.000Z")

function createSchedule(overrides: Partial<ScheduledJobSchedule> = {}): ScheduledJobSchedule {
  return {
    id: "schedule-1",
    kind: "recurring-invoices",
    enabled: true,
    cadence: "daily",
    timezone: "Europe/Berlin",
    nextRunAt: "2026-05-20T09:30:00.000Z",
    ...overrides
  }
}

describe("scheduled worker jobs", () => {
  it("contains the supported scheduled job families", () => {
    assert.deepEqual(scheduledJobKinds, ["recurring-invoices", "payment-reminders", "dunning-run", "maintenance"])
  })

  it("guards known and unknown scheduled job kinds", () => {
    assert.equal(isScheduledJobKind("recurring-invoices"), true)
    assert.equal(isScheduledJobKind("payment-reminders"), true)
    assert.equal(isScheduledJobKind("unknown"), false)
  })

  it("creates a manual scheduled processing job with defaults", () => {
    const job = createScheduledProcessingJob({
      kind: "maintenance",
      window: {
        startsAt: "2026-05-20T09:00:00.000Z",
        endsAt: "2026-05-20T10:00:00.000Z",
        timezone: "Europe/Berlin"
      },
      now
    })

    assert.equal(job.id, "scheduled-maintenance-1779271200000")
    assert.equal(job.priority, "normal")
    assert.equal(job.dryRun, false)
    assert.equal(job.createdAt, now.toISOString())
  })

  it("creates a stable processing window with a configurable lookback", () => {
    assert.deepEqual(createScheduledJobWindow({ now, timezone: "Europe/Berlin", lookbackMinutes: 30 }), {
      startsAt: "2026-05-20T09:30:00.000Z",
      endsAt: "2026-05-20T10:00:00.000Z",
      timezone: "Europe/Berlin"
    })
  })

  it("detects due schedules", () => {
    assert.equal(isScheduledJobDue(createSchedule(), now), true)
    assert.equal(isScheduledJobDue(createSchedule({ nextRunAt: "2026-05-20T10:01:00.000Z" }), now), false)
    assert.equal(isScheduledJobDue(createSchedule({ enabled: false }), now), false)
    assert.equal(isScheduledJobDue(createSchedule({ nextRunAt: "not-a-date" }), now), false)
  })

  it("creates scheduled processing jobs from schedules", () => {
    const job = createScheduledProcessingJobFromSchedule(
      createSchedule({
        id: "dunning-daily",
        kind: "dunning-run",
        priority: "high",
        dryRun: true,
        requestedBy: "system"
      }),
      { now, lookbackMinutes: 15 }
    )

    assert.equal(job.id, "scheduled-dunning-run-1779271200000")
    assert.equal(job.scheduleId, "dunning-daily")
    assert.equal(job.priority, "high")
    assert.equal(job.dryRun, true)
    assert.equal(job.requestedBy, "system")
    assert.deepEqual(job.window, {
      startsAt: "2026-05-20T09:45:00.000Z",
      endsAt: "2026-05-20T10:00:00.000Z",
      timezone: "Europe/Berlin"
    })
  })

  it("creates only due scheduled processing jobs", () => {
    const jobs = createDueScheduledProcessingJobs(
      [
        createSchedule({ id: "due-1", kind: "recurring-invoices" }),
        createSchedule({ id: "future-1", kind: "payment-reminders", nextRunAt: "2026-05-20T11:00:00.000Z" }),
        createSchedule({ id: "due-2", kind: "maintenance" })
      ],
      { now }
    )

    assert.deepEqual(
      jobs.map((job) => [job.scheduleId, job.kind]),
      [
        ["due-1", "recurring-invoices"],
        ["due-2", "maintenance"]
      ]
    )
  })
})
