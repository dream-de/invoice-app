import fs from "node:fs"
import { createInMemoryWorkerJobQueueStore } from "../jobs/worker-job-store"
import { runServerWorkerOnce, type ServerWorkerRunMode, type ServerWorkerRunResult } from "../server-worker"
import type { ScheduledJobSchedule } from "../jobs/scheduled"

export type ServerWorkerCliConfig = {
  help: boolean
  limit?: number
  mode?: ServerWorkerRunMode
  now?: Date
  scheduleFile?: string
}

export type ServerWorkerCliIo = {
  stdout?: Pick<typeof process.stdout, "write">
  stderr?: Pick<typeof process.stderr, "write">
}

export type ServerWorkerCliEnv = {
  SERVER_WORKER_LIMIT?: string
  SERVER_WORKER_MODE?: string
  SERVER_WORKER_NOW?: string
  SERVER_WORKER_SCHEDULE_FILE?: string
}

export type ServerWorkerCliRunResult = {
  exitCode: number
  result?: ServerWorkerRunResult
}

const usage = [
  "Usage: pnpm --filter @dream-invoice/server-worker worker -- [options]",
  "",
  "Options:",
  "  --mode queue|scheduled     Worker mode. Defaults to scheduled when --schedule-file is provided.",
  "  --schedule-file <path>     JSON file with scheduled worker jobs.",
  "  --limit <number>           Maximum queue entries to process in one run.",
  "  --now <iso-date>           Fixed timestamp for deterministic runs.",
  "  --help                     Show this help text.",
  "",
  "Environment:",
  "  SERVER_WORKER_MODE          Same as --mode.",
  "  SERVER_WORKER_SCHEDULE_FILE Same as --schedule-file.",
  "  SERVER_WORKER_LIMIT         Same as --limit.",
  "  SERVER_WORKER_NOW           Same as --now."
].join("\n")

export function getServerWorkerCliUsage() {
  return usage
}

function parseServerWorkerMode(value: string, source: string): ServerWorkerRunMode {
  if (value !== "queue" && value !== "scheduled") {
    throw new Error(source + " must be queue or scheduled")
  }

  return value
}

function parseServerWorkerLimit(value: string, source: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(source + " must be a positive integer")
  }

  return parsed
}

function parseServerWorkerDate(value: string, source: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(source + " must be a valid ISO date")
  }

  return date
}

export function parseServerWorkerCliArgs(argv: string[]): ServerWorkerCliConfig {
  const config: ServerWorkerCliConfig = {
    help: false
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--") {
      continue
    }

    if (arg === "--help" || arg === "-h") {
      config.help = true
      continue
    }

    if (arg === "--mode") {
      const value = argv[index + 1]
      if (!value) throw new Error("--mode requires a value")
      config.mode = parseServerWorkerMode(value, "--mode")
      index += 1
      continue
    }

    if (arg === "--schedule-file") {
      const value = argv[index + 1]
      if (!value) throw new Error("--schedule-file requires a path")
      config.scheduleFile = value
      index += 1
      continue
    }

    if (arg === "--limit") {
      const value = argv[index + 1]
      if (!value) throw new Error("--limit requires a value")
      config.limit = parseServerWorkerLimit(value, "--limit")
      index += 1
      continue
    }

    if (arg === "--now") {
      const value = argv[index + 1]
      if (!value) throw new Error("--now requires a value")
      config.now = parseServerWorkerDate(value, "--now")
      index += 1
      continue
    }

    throw new Error("Unknown option: " + arg)
  }

  return config
}

export function applyServerWorkerCliEnv(config: ServerWorkerCliConfig, env: ServerWorkerCliEnv = process.env): ServerWorkerCliConfig {
  return {
    ...config,
    limit: config.limit ?? (env.SERVER_WORKER_LIMIT ? parseServerWorkerLimit(env.SERVER_WORKER_LIMIT, "SERVER_WORKER_LIMIT") : undefined),
    mode: config.mode ?? (env.SERVER_WORKER_MODE ? parseServerWorkerMode(env.SERVER_WORKER_MODE, "SERVER_WORKER_MODE") : undefined),
    now: config.now ?? (env.SERVER_WORKER_NOW ? parseServerWorkerDate(env.SERVER_WORKER_NOW, "SERVER_WORKER_NOW") : undefined),
    scheduleFile: config.scheduleFile ?? env.SERVER_WORKER_SCHEDULE_FILE
  }
}

export function readScheduledJobScheduleFile(filePath: string): ScheduledJobSchedule[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8")) as unknown

  if (!Array.isArray(parsed)) {
    throw new Error("Schedule file must contain a JSON array")
  }

  return parsed as ScheduledJobSchedule[]
}

export function formatServerWorkerCliResult(result: ServerWorkerRunResult) {
  if (result.mode === "scheduled") {
    return [
      "server-worker mode=scheduled",
      "enqueued=" + result.scheduled.enqueue.enqueuedCount,
      "skipped=" + result.scheduled.enqueue.skippedScheduleIds.length,
      "completed=" + result.scheduled.worker.summary.completedCount,
      "failed=" + result.scheduled.worker.summary.failedCount
    ].join(" ")
  }

  return [
    "server-worker mode=queue",
    "loaded=" + result.worker.loadedCount,
    "completed=" + result.worker.summary.completedCount,
    "failed=" + result.worker.summary.failedCount
  ].join(" ")
}

export async function runServerWorkerCli(argv = process.argv.slice(2), io: ServerWorkerCliIo = {}): Promise<ServerWorkerCliRunResult> {
  const stdout = io.stdout ?? process.stdout
  const stderr = io.stderr ?? process.stderr

  try {
    const parsedConfig = parseServerWorkerCliArgs(argv)

    if (parsedConfig.help) {
      stdout.write(getServerWorkerCliUsage() + "\n")
      return { exitCode: 0 }
    }

    const config = applyServerWorkerCliEnv(parsedConfig)
    const schedules = config.scheduleFile ? readScheduledJobScheduleFile(config.scheduleFile) : undefined
    const store = createInMemoryWorkerJobQueueStore()
    const result = await runServerWorkerOnce(store, {
      limit: config.limit,
      mode: config.mode,
      now: config.now,
      schedules
    })

    stdout.write(formatServerWorkerCliResult(result) + "\n")

    return {
      exitCode: result.mode === "scheduled" ? result.scheduled.worker.summary.failedCount : result.worker.summary.failedCount,
      result
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server worker error"
    stderr.write("server-worker error: " + message + "\n")

    return {
      exitCode: 1
    }
  }
}
