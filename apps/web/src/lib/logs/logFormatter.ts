import type { LogEntry, LogLevel, LogModule, LogRetention, LogStatus } from "./types"

const dateFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" })
const timeFormatter = new Intl.DateTimeFormat("de-DE", { timeStyle: "medium" })
const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "medium" })
const numberFormatter = new Intl.NumberFormat("de-DE")

const levelLabels: Record<LogLevel, string> = {
  success: "Erfolg",
  info: "Info",
  warning: "Warnung",
  error: "Fehler"
}

const moduleLabels: Record<LogModule, string> = {
  authentication: "Authentifizierung",
  users: "Benutzer",
  invoices: "Rechnungen",
  quotes: "Angebote",
  customers: "Kunden",
  projects: "Projekte",
  timeTracking: "Zeiterfassung",
  banking: "Banking",
  api: "API",
  settings: "Einstellungen",
  system: "System",
  datev: "DATEV",
  ocr: "OCR",
  documents: "Dokumente",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
  email: "E-Mail",
  backup: "Backup",
  integrations: "Integrationen"
}

const statusLabels: Record<LogStatus, string> = {
  active: "Aktiv",
  archived: "Archiviert"
}

function validDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatLogDate(value: string | null | undefined) {
  const date = validDate(value)
  return date ? dateFormatter.format(date) : "-"
}

export function formatLogTime(value: string | null | undefined) {
  const date = validDate(value)
  return date ? timeFormatter.format(date) : "-"
}

export function formatLogDateTime(value: string | null | undefined) {
  const date = validDate(value)
  return date ? dateTimeFormatter.format(date) : "-"
}

export function getLogLevelLabel(level: LogLevel | null | undefined) {
  return level ? levelLabels[level] : "-"
}

export function getLogModuleLabel(module: LogModule | null | undefined) {
  return module ? moduleLabels[module] : "-"
}

export function getLogStatusLabel(status: LogStatus | null | undefined) {
  return status ? statusLabels[status] : "-"
}

export function formatLogLevel(level: LogLevel | null | undefined) {
  return getLogLevelLabel(level)
}

export function formatLogModule(module: LogModule | null | undefined) {
  return getLogModuleLabel(module)
}

export function formatRetention(retention: LogRetention | null | undefined) {
  if (retention === "unlimited") return "Unbegrenzt"
  if (typeof retention === "number") return `${retention} Tage`
  return "-"
}

export function formatBytes(value: number | null | undefined) {
  const bytes = value ?? 0
  if (bytes < 1024) return `${numberFormatter.format(bytes)} B`

  const units = ["KB", "MB", "GB", "TB"]
  let size = bytes / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: size >= 10 ? 0 : 1 }).format(size)} ${units[unitIndex]}`
}

export function formatDuration(value: number | null | undefined) {
  const duration = value ?? 0
  if (duration < 1000) return `${numberFormatter.format(duration)} ms`
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(duration / 1000)} s`
}

export function safeStringify(value: unknown, space = 2) {
  const seen = new WeakSet<object>()

  try {
    return JSON.stringify(value ?? {}, (_key, nestedValue) => {
      if (typeof nestedValue !== "object" || nestedValue === null) return nestedValue
      if (seen.has(nestedValue)) return "[Circular]"
      seen.add(nestedValue)
      return nestedValue
    }, space)
  } catch {
    return JSON.stringify({ error: "Wert konnte nicht serialisiert werden." }, null, space)
  }
}

export function truncateMiddle(value: string | null | undefined, start = 12, end = 8) {
  const text = String(value ?? "")
  if (!text) return "-"
  if (text.length <= start + end + 3) return text
  return `${text.slice(0, start)}...${text.slice(-end)}`
}

export function getLogSearchText(log: LogEntry) {
  return [
    log.id,
    log.createdAt,
    log.updatedAt,
    log.title,
    log.description,
    getLogModuleLabel(log.module),
    getLogLevelLabel(log.level),
    getLogStatusLabel(log.status),
    log.actor.id,
    log.actor.name,
    log.actor.email,
    log.actor.role,
    log.ipAddress,
    log.browser.name,
    log.browser.version,
    log.operatingSystem.name,
    log.operatingSystem.version,
    log.location.country,
    log.location.city,
    log.location.timezone,
    log.metadata.requestId,
    log.metadata.sessionId,
    log.metadata.traceId,
    log.metadata.method,
    log.metadata.endpoint,
    ...log.tags
  ].filter(Boolean).join(" ").toLowerCase()
}

export function buildLogFilename(prefix = "dreaminvoice-logs", extension = "csv", date = new Date()) {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date)

  return `${prefix}-${stamp}.${extension}`
}

export const moduleLabel = getLogModuleLabel
export const statusLabel = getLogLevelLabel
