import assert from "node:assert/strict"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { describe, it } from "node:test"
import { applyServerWorkerCliEnv, formatServerWorkerCliResult, parseServerWorkerCliArgs, runServerWorkerCli } from "../../runtime/server-worker-cli"
import { runServerWorkerOnce } from "../../server-worker"
import { createInMemoryWorkerJobQueueStore } from "../worker-job-store"

function createWritableBuffer() {
  let value = ""

  return {
    stream: {
      write(chunk: string) {
        value += chunk
        return true
      }
    },
    read() {
      return value
    }
  }
}

describe("server worker CLI", () => {
  it("parses supported CLI options", () => {
    const config = parseServerWorkerCliArgs([
      "--mode",
      "scheduled",
      "--limit",
      "3",
      "--now",
      "2026-05-20T10:00:00.000Z",
      "--schedule-file",
      "/tmp/schedules.json"
    ])

    assert.equal(config.mode, "scheduled")
    assert.equal(config.limit, 3)
    assert.equal(config.now?.toISOString(), "2026-05-20T10:00:00.000Z")
    assert.equal(config.scheduleFile, "/tmp/schedules.json")
  })

  it("ignores the pnpm argument separator", () => {
    const config = parseServerWorkerCliArgs(["--", "--mode", "queue"])

    assert.equal(config.mode, "queue")
  })

  it("rejects invalid CLI options", () => {
    assert.throws(() => parseServerWorkerCliArgs(["--mode", "manual"]), /queue or scheduled/)
    assert.throws(() => parseServerWorkerCliArgs(["--limit", "0"]), /positive integer/)
    assert.throws(() => parseServerWorkerCliArgs(["--unknown"]), /Unknown option/)
  })

  it("applies environment defaults without overriding explicit CLI options", () => {
    const config = applyServerWorkerCliEnv(parseServerWorkerCliArgs(["--mode", "queue"]), {
      SERVER_WORKER_LIMIT: "5",
      SERVER_WORKER_MODE: "scheduled",
      SERVER_WORKER_NOW: "2026-05-20T10:00:00.000Z",
      SERVER_WORKER_SCHEDULE_FILE: "config/schedules.example.json"
    })

    assert.equal(config.mode, "queue")
    assert.equal(config.limit, 5)
    assert.equal(config.now?.toISOString(), "2026-05-20T10:00:00.000Z")
    assert.equal(config.scheduleFile, "config/schedules.example.json")
  })

  it("rejects invalid environment defaults", () => {
    assert.throws(() => applyServerWorkerCliEnv({ help: false }, { SERVER_WORKER_MODE: "manual" }), /SERVER_WORKER_MODE/)
    assert.throws(() => applyServerWorkerCliEnv({ help: false }, { SERVER_WORKER_LIMIT: "0" }), /SERVER_WORKER_LIMIT/)
    assert.throws(() => applyServerWorkerCliEnv({ help: false }, { SERVER_WORKER_NOW: "later" }), /SERVER_WORKER_NOW/)
  })

  it("formats queue and scheduled results", async () => {
    const emptyQueue = await runServerWorkerOnce(createInMemoryWorkerJobQueueStore())
    assert.equal(formatServerWorkerCliResult(emptyQueue), "server-worker mode=queue loaded=0 completed=0 failed=0")

    const emptyScheduled = await runServerWorkerOnce(createInMemoryWorkerJobQueueStore(), { mode: "scheduled" })
    assert.equal(formatServerWorkerCliResult(emptyScheduled), "server-worker mode=scheduled enqueued=0 skipped=0 completed=0 failed=0")
  })

  it("runs the CLI in scheduled mode from a schedule file", async () => {
    const folder = mkdtempSync(path.join(tmpdir(), "invoice-worker-"))
    const scheduleFile = path.join(folder, "schedules.json")
    writeFileSync(
      scheduleFile,
      JSON.stringify([
        {
          id: "maintenance-1",
          kind: "maintenance",
          enabled: true,
          cadence: "daily",
          timezone: "Europe/Berlin",
          nextRunAt: "2026-05-20T09:00:00.000Z",
          dryRun: true
        }
      ])
    )

    const stdout = createWritableBuffer()
    const stderr = createWritableBuffer()
    const run = await runServerWorkerCli(["--schedule-file", scheduleFile, "--now", "2026-05-20T10:00:00.000Z"], {
      stdout: stdout.stream,
      stderr: stderr.stream
    })

    assert.equal(run.exitCode, 0)
    assert.equal(stderr.read(), "")
    assert.match(stdout.read(), /server-worker mode=scheduled enqueued=1 skipped=0 completed=1 failed=0/)
  })



  it("runs the CLI with environment configuration", async () => {
    const folder = mkdtempSync(path.join(tmpdir(), "invoice-worker-env-"))
    const scheduleFile = path.join(folder, "schedules.json")
    writeFileSync(
      scheduleFile,
      JSON.stringify([
        {
          id: "maintenance-env",
          kind: "maintenance",
          enabled: true,
          cadence: "daily",
          timezone: "Europe/Berlin",
          nextRunAt: "2026-05-20T09:00:00.000Z",
          dryRun: true
        }
      ])
    )

    const previous = {
      SERVER_WORKER_NOW: process.env.SERVER_WORKER_NOW,
      SERVER_WORKER_SCHEDULE_FILE: process.env.SERVER_WORKER_SCHEDULE_FILE
    }

    process.env.SERVER_WORKER_NOW = "2026-05-20T10:00:00.000Z"
    process.env.SERVER_WORKER_SCHEDULE_FILE = scheduleFile

    try {
      const stdout = createWritableBuffer()
      const stderr = createWritableBuffer()
      const run = await runServerWorkerCli([], {
        stdout: stdout.stream,
        stderr: stderr.stream
      })

      assert.equal(run.exitCode, 0)
      assert.equal(stderr.read(), "")
      assert.match(stdout.read(), /server-worker mode=scheduled enqueued=1 skipped=0 completed=1 failed=0/)
    } finally {
      if (previous.SERVER_WORKER_NOW === undefined) {
        delete process.env.SERVER_WORKER_NOW
      } else {
        process.env.SERVER_WORKER_NOW = previous.SERVER_WORKER_NOW
      }

      if (previous.SERVER_WORKER_SCHEDULE_FILE === undefined) {
        delete process.env.SERVER_WORKER_SCHEDULE_FILE
      } else {
        process.env.SERVER_WORKER_SCHEDULE_FILE = previous.SERVER_WORKER_SCHEDULE_FILE
      }
    }
  })

  it("prints help without reading environment defaults", async () => {
    const previous = process.env.SERVER_WORKER_NOW
    process.env.SERVER_WORKER_NOW = "not-a-date"

    try {
      const stdout = createWritableBuffer()
      const run = await runServerWorkerCli(["--help"], { stdout: stdout.stream })

      assert.equal(run.exitCode, 0)
      assert.match(stdout.read(), /Usage: pnpm --filter @dream-invoice\/server-worker worker/)
    } finally {
      if (previous === undefined) {
        delete process.env.SERVER_WORKER_NOW
      } else {
        process.env.SERVER_WORKER_NOW = previous
      }
    }
  })

  it("prints help without running the worker", async () => {
    const stdout = createWritableBuffer()
    const run = await runServerWorkerCli(["--help"], { stdout: stdout.stream })

    assert.equal(run.exitCode, 0)
    assert.match(stdout.read(), /Usage: pnpm --filter @dream-invoice\/server-worker worker/)
  })
})
