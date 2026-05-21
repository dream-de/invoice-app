import assert from "node:assert/strict"
import fs from "node:fs"
import { describe, it } from "node:test"
import { createScheduledWorkerPlan, isScheduledJobKind, type ScheduledJobSchedule } from "../scheduled"

const schedulePath = new URL("../../../config/schedules.example.json", import.meta.url)

describe("server worker schedule example", () => {
  it("contains valid supported dry-run scheduled jobs", () => {
    const schedules = JSON.parse(fs.readFileSync(schedulePath, "utf8")) as ScheduledJobSchedule[]

    assert.equal(schedules.length, 4)
    assert.deepEqual(
      schedules.map((schedule) => schedule.id),
      [
        "recurring-invoices-daily",
        "payment-reminders-daily",
        "dunning-run-weekly",
        "maintenance-nightly"
      ]
    )

    for (const schedule of schedules) {
      assert.equal(isScheduledJobKind(schedule.kind), true)
      assert.equal(schedule.enabled, true)
      assert.equal(schedule.dryRun, true)
      assert.equal(schedule.timezone, "Europe/Berlin")
      assert.equal(Number.isNaN(new Date(schedule.nextRunAt).getTime()), false)
    }
  })

  it("is runnable by the scheduled queue planner", () => {
    const schedules = JSON.parse(fs.readFileSync(schedulePath, "utf8")) as ScheduledJobSchedule[]
    const plan = createScheduledWorkerPlan(schedules, { now: new Date("2026-05-20T10:00:00.000Z") })

    assert.equal(plan.dueJobs.length, 4)
    assert.deepEqual(
      plan.dueJobs.map((job) => job.scheduleId),
      [
        "recurring-invoices-daily",
        "payment-reminders-daily",
        "dunning-run-weekly",
        "maintenance-nightly"
      ]
    )
  })
})
