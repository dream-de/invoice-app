import type { LogEntry } from "./types"
import { buildLogFilename, safeStringify } from "./logFormatter"
import { downloadTextFile } from "./csvExport"

export function exportLogsToJson(logs: readonly LogEntry[], filename = buildLogFilename("dreaminvoice-logs", "json")) {
  downloadTextFile(safeStringify(logs, 2), filename, "application/json;charset=utf-8")
}

export function exportSingleLogToJson(log: LogEntry, filename = buildLogFilename(`dreaminvoice-log-${log.id}`, "json", new Date(log.createdAt))) {
  downloadTextFile(safeStringify(log, 2), filename, "application/json;charset=utf-8")
}
