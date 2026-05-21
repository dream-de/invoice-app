import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { isTerminalWorkerJobStatus, isWorkerJobStatus, workerJobStatuses } from "../worker-job-status"

describe("worker job status", () => {
  it("contains the supported status values", () => {
    assert.deepEqual(workerJobStatuses, ["queued", "running", "completed", "failed", "cancelled"])
  })

  it("guards known and unknown statuses", () => {
    assert.equal(isWorkerJobStatus("queued"), true)
    assert.equal(isWorkerJobStatus("failed"), true)
    assert.equal(isWorkerJobStatus("waiting"), false)
  })

  it("detects terminal statuses", () => {
    assert.equal(isTerminalWorkerJobStatus("queued"), false)
    assert.equal(isTerminalWorkerJobStatus("running"), false)
    assert.equal(isTerminalWorkerJobStatus("completed"), true)
    assert.equal(isTerminalWorkerJobStatus("failed"), true)
    assert.equal(isTerminalWorkerJobStatus("cancelled"), true)
  })
})
