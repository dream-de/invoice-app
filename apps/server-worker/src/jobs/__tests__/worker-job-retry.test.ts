import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { canRetryWorkerJob, defaultRetryPolicy, getNextRetryDelayMs, noRetryPolicy } from "../worker-job-retry"

describe("worker job retry policy", () => {
  it("does not retry when retry is disabled", () => {
    assert.equal(canRetryWorkerJob(noRetryPolicy, { attempt: 0 }), false)
    assert.equal(getNextRetryDelayMs(noRetryPolicy, { attempt: 1 }), 0)
  })

  it("allows retry while attempts are below the max", () => {
    assert.equal(canRetryWorkerJob(defaultRetryPolicy, { attempt: 1 }), true)
    assert.equal(canRetryWorkerJob(defaultRetryPolicy, { attempt: 3 }), false)
  })

  it("calculates exponential retry delays with a maximum cap", () => {
    assert.equal(getNextRetryDelayMs(defaultRetryPolicy, { attempt: 1 }), 30_000)
    assert.equal(getNextRetryDelayMs(defaultRetryPolicy, { attempt: 2 }), 60_000)
    assert.equal(getNextRetryDelayMs(defaultRetryPolicy, { attempt: 10 }), 300_000)
  })

  it("calculates fixed retry delays", () => {
    assert.equal(
      getNextRetryDelayMs({ strategy: "fixed", maxAttempts: 5, delayMs: 15_000 }, { attempt: 4 }),
      15_000
    )
  })
})
