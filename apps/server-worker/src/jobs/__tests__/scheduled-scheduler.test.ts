import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createScheduledWorkerPlan, runDueScheduledJobs, type ScheduledJobSchedule } from "../scheduled"

const now = new Date("2026-05-20T10:00:00.000Z")

function createSchedule(overrides: Partial<ScheduledJobSchedule> = {}): ScheduledJobSchedule {
  return {
    id: "schedule-1",
    kind: "recurring-invoices",
    enabled: true,
    cadence: "daily",
    timezone: "Europe/Berlin",
    nextRunAt: "2026-05-20T09:30:00.000Z",
    dryRun: true,
    ...overrides
  }
}

describe("scheduled worker scheduler", () => {
  it("creates a plan with due jobs and skipped schedule ids", () => {
    const plan = createScheduledWorkerPlan(
      [
        createSchedule({ id: "due-recurring", kind: "recurring-invoices" }),
        createSchedule({ id: "future-reminder", kind: "payment-reminders", nextRunAt: "2026-05-20T11:00:00.000Z" }),
        createSchedule({ id: "disabled-dunning", kind: "dunning-run", enabled: false }),
        createSchedule({ id: "due-maintenance", kind: "maintenance" })
      ],
      { now, lookbackMinutes: 20 }
    )

    assert.equal(plan.createdAt, now.toISOString())
    assert.deepEqual(
      plan.dueJobs.map((job) => [job.scheduleId, job.kind, job.window.startsAt, job.window.endsAt]),
      [
        ["due-recurring", "recurring-invoices", "2026-05-20T09:40:00.000Z", "2026-05-20T10:00:00.000Z"],
        ["due-maintenance", "maintenance", "2026-05-20T09:40:00.000Z", "2026-05-20T10:00:00.000Z"]
      ]
    )
    assert.deepEqual(plan.skippedScheduleIds, ["future-reminder", "disabled-dunning"])
  })

  it("runs due scheduled jobs through the default handlers", async () => {
    const result = await runDueScheduledJobs(
      [
        createSchedule({ id: "due-reminder", kind: "payment-reminders" }),
        createSchedule({ id: "future-maintenance", kind: "maintenance", nextRunAt: "2026-05-20T12:00:00.000Z" })
      ],
      undefined,
      { now }
    )

    assert.deepEqual(
      result.plan.dueJobs.map((job) => job.scheduleId),
      ["due-reminder"]
    )
    assert.deepEqual(result.plan.skippedScheduleIds, ["future-maintenance"])
    assert.equal(result.results.length, 1)
    assert.equal(result.results[0]?.kind, "payment-reminders")
    assert.equal(result.results[0]?.processedCount, 0)
    assert.equal(result.results[0]?.dryRun, true)
  })
})
