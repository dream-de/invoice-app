import assert from "node:assert/strict"
import fs from "node:fs"
import { describe, it } from "node:test"

const envExampleUrl = new URL("../../../../../.env.example", import.meta.url)

function readEnvExample() {
  return fs.readFileSync(envExampleUrl, "utf8")
}

describe("server worker env example", () => {
  it("keeps worker-only configuration out of the public Docker env example", () => {
    const env = readEnvExample()

    assert.doesNotMatch(env, /SERVER_WORKER_MODE=/)
    assert.doesNotMatch(env, /SERVER_WORKER_SCHEDULE_FILE=/)
    assert.doesNotMatch(env, /SERVER_WORKER_LIMIT=/)
    assert.doesNotMatch(env, /SERVER_WORKER_NOW=/)
  })
})
