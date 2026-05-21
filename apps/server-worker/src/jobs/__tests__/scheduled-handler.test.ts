import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  defaultScheduledJobHandlers,
  runScheduledProcessingJob,
  scheduledJobKinds,
  type ScheduledJobHandlers,
  type ScheduledJobKind,
  type ScheduledProcessingJob
} from "../scheduled"

const now = new Date("2026-05-20T10:00:00.000Z")

function createJob(kind: ScheduledJobKind): ScheduledProcessingJob {
  return {
    id: "scheduled-" + kind + "-1779271200000",
    kind,
    scheduleId: kind + "-schedule",
    window: {
      startsAt: "2026-05-20T09:00:00.000Z",
      endsAt: "2026-05-20T10:00:00.000Z",
      timezone: "Europe/Berlin"
    },
    priority: "normal",
    dryRun: true,
    createdAt: now.toISOString()
  }
}

describe("scheduled worker handlers", () => {
  it("runs all default scheduled handlers without side effects", async () => {
    for (const kind of scheduledJobKinds) {
      const result = await runScheduledProcessingJob(createJob(kind), undefined, { now })

      assert.equal(result.jobId, "scheduled-" + kind + "-1779271200000")
      assert.equal(result.kind, kind)
      assert.equal(result.processedCount, 0)
      assert.equal(result.skippedCount, 0)
      assert.equal(result.warningCount, 0)
      assert.equal(result.completedAt, now.toISOString())
      assert.equal(result.dryRun, true)
      assert.ok(result.notes.length > 0)
    }
  })

  it("allows a scheduled job handler to be overridden later", async () => {
    const handlers: ScheduledJobHandlers = {
      ...defaultScheduledJobHandlers,
      maintenance: (job, options) => ({
        jobId: job.id,
        kind: job.kind,
        processedCount: 2,
        skippedCount: 1,
        warningCount: 0,
        completedAt: (options?.now ?? now).toISOString(),
        dryRun: job.dryRun,
        notes: ["Custom maintenance handler executed."]
      })
    }

    const result = await runScheduledProcessingJob(createJob("maintenance"), handlers, { now })

    assert.equal(result.processedCount, 2)
    assert.equal(result.skippedCount, 1)
    assert.deepEqual(result.notes, ["Custom maintenance handler executed."])
  })
})
