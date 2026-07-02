import type { LogEntry } from "./types"
import {
  buildLogFilename,
  formatDuration,
  formatLogDateTime,
  getLogLevelLabel,
  getLogModuleLabel,
  getLogStatusLabel
} from "./logFormatter"

const csvHeaders = [
  "ID",
  "Datum",
  "Titel",
  "Beschreibung",
  "Modul",
  "Level",
  "Status",
  "Benutzer",
  "E-Mail",
  "Rolle",
  "IP",
  "Browser",
  "Betriebssystem",
  "Standort",
  "Request-ID",
  "Session-ID",
  "Trace-ID",
  "Endpoint",
  "Methode",
  "Dauer",
  "Archiviert",
  "Tags"
]

export function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

export function logToExportRow(log: LogEntry) {
  return [
    log.id,
    formatLogDateTime(log.createdAt),
    log.title,
    log.description,
    getLogModuleLabel(log.module),
    getLogLevelLabel(log.level),
    getLogStatusLabel(log.status),
    log.actor.name,
    log.actor.email,
    log.actor.role,
    log.ipAddress,
    `${log.browser.name} ${log.browser.version}`.trim(),
    `${log.operatingSystem.name} ${log.operatingSystem.version}`.trim(),
    [log.location.city, log.location.country, log.location.timezone].filter(Boolean).join(", "),
    log.metadata.requestId,
    log.metadata.sessionId,
    log.metadata.traceId,
    log.metadata.endpoint,
    log.metadata.method,
    formatDuration(log.metadata.duration),
    log.archived ? "Ja" : "Nein",
    log.tags.join(", ")
  ]
}

export function logsToCsv(logs: readonly LogEntry[]) {
  const rows = logs.map((log) => logToExportRow(log).map(csvCell).join(";"))
  return `\uFEFF${[csvHeaders.map(csvCell).join(";"), ...rows].join("\n")}`
}

export function downloadTextFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function exportLogsToCsv(logs: readonly LogEntry[], filename = buildLogFilename("dreaminvoice-logs", "csv")) {
  downloadTextFile(logsToCsv(logs), filename, "text/csv;charset=utf-8")
}

export function exportSingleLogToCsv(log: LogEntry, filename = buildLogFilename(`dreaminvoice-log-${log.id}`, "csv", new Date(log.createdAt))) {
  exportLogsToCsv([log], filename)
}

export const downloadCsv = exportLogsToCsv
