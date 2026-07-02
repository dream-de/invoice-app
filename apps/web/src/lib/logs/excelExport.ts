import type { LogEntry } from "./types"
import { buildLogFilename } from "./logFormatter"
import { exportLogsToCsv, exportSingleLogToCsv } from "./csvExport"

export function exportLogsToExcel(logs: readonly LogEntry[], filename = buildLogFilename("dreaminvoice-logs", "xls")) {
  exportLogsToCsv(logs, filename)
}

export function exportSingleLogToExcel(log: LogEntry, filename = buildLogFilename(`dreaminvoice-log-${log.id}`, "xls", new Date(log.createdAt))) {
  exportSingleLogToCsv(log, filename)
}

export const downloadExcel = exportLogsToExcel
