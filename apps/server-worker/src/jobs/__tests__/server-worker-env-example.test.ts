import assert from "node:assert/strict"
import fs from "node:fs"
import { describe, it } from "node:test"

const envExampleUrl = new URL("../../../../../.env.example", import.meta.url)

function readEnvExample() {
  return fs.readFileSync(envExampleUrl, "utf8")
}

describe("server worker env example", () => {
  it("documents the supported worker environment variables", () => {
    const env = readEnvExample()

    assert.match(env, /SERVER_WORKER_MODE=scheduled/)
    assert.match(env, /SERVER_WORKER_SCHEDULE_FILE="config\/schedules\.example\.json"/)
    assert.match(env, /SERVER_WORKER_LIMIT=25/)
    assert.match(env, /SERVER_WORKER_NOW=""/)
  })
})
