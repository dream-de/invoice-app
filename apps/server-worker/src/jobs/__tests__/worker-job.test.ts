import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { describeWorkerJob, isWorkerJobKind, workerJobKinds } from "../worker-job"

describe("worker job registry", () => {
  it("contains the supported job families", () => {
    assert.deepEqual(workerJobKinds, ["pdf", "email", "import", "scheduled"])
  })

  it("guards known and unknown job kinds", () => {
    assert.equal(isWorkerJobKind("pdf"), true)
    assert.equal(isWorkerJobKind("email"), true)
    assert.equal(isWorkerJobKind("unknown"), false)
  })

  it("describes a worker job consistently", () => {
    assert.equal(
      describeWorkerJob({ id: "job-1", kind: "pdf", payload: {} }),
      "pdf:job-1"
    )
  })
})
