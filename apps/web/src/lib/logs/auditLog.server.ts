import { prisma } from "@dream-invoice/database"
import type {
  ArchiveStatistics,
  LogEntry,
  LogLevel,
  LogModule,
  LogOutcome,
  LogRetention,
  LogSource,
  LogStatistics,
  LogStatus,
  Pagination
} from "./types"

type SortOrder = "newest" | "oldest"
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined }
type JsonRecord = Record<string, JsonValue | undefined>

export interface AuditLogInput {
  title: string
  description?: string | null
  action?: string | null
  module: LogModule | string
  level: LogLevel | string
  severity?: LogLevel | string | null
  outcome?: LogOutcome | string | null
  source?: LogSource | string | null
  status?: LogStatus | string
  actorId?: string | null
  actorName?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  entityType?: string | null
  entityId?: string | null
  entityLabel?: string | null
  ipAddress?: string | null
  browserName?: string | null
  browserVersion?: string | null
  osName?: string | null
  osVersion?: string | null
  country?: string | null
  city?: string | null
  timezone?: string | null
  requestId?: string | null
  sessionId?: string | null
  traceId?: string | null
  userAgent?: string | null
  referer?: string | null
  method?: string | null
  endpoint?: string | null
  duration?: number | null
  tags?: string[]
  metadata?: JsonValue
  before?: JsonValue
  after?: JsonValue
}

export interface AuditLogQueryParams {
  page?: number
  pageSize?: number
  search?: string | null
  module?: string | null
  level?: string | null
  status?: string | null
  outcome?: string | null
  actorId?: string | null
  dateFrom?: string | null
  dateTo?: string | null
  archived?: boolean | null
  sort?: SortOrder
}

type AuditLogRecord = {
  id: string
  createdAt: Date
  updatedAt?: Date | null
  title: string
  description?: string | null
  module?: string | null
  level?: string | null
  status?: string | null
  actorId?: string | null
  actorName?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  ipAddress?: string | null
  browserName?: string | null
  browserVersion?: string | null
  osName?: string | null
  osVersion?: string | null
  country?: string | null
  city?: string | null
  timezone?: string | null
  requestId?: string | null
  sessionId?: string | null
  traceId?: string | null
  userAgent?: string | null
  referer?: string | null
  method?: string | null
  endpoint?: string | null
  duration?: number | null
  tags?: string[]
  metadata?: unknown
  data?: unknown
  before?: unknown
  after?: unknown
  archived?: boolean
  archivedAt?: Date | null
  searchableText?: string | null
  action?: string | null
  entity?: string | null
  entityId?: string | null
  entityType?: string | null
  type?: string | null
  source?: string | null
  severity?: string | null
  moduleKey?: string | null
}

type AuditLogDelegate = {
  create(args: unknown): Promise<AuditLogRecord>
  findMany(args: unknown): Promise<AuditLogRecord[]>
  count(args?: unknown): Promise<number>
  updateMany(args: unknown): Promise<{ count: number }>
  deleteMany(args: unknown): Promise<{ count: number }>
  groupBy(args: unknown): Promise<Array<{ level?: string | null; severity?: string | null; source?: string | null; _count: { _all: number } }>>
}

type LogSettingsRecord = {
  id: string
  retention: string
  autoArchive: boolean
  archiveDayOfWeek: number
  createdAt: Date
  updatedAt: Date
}

type LogSettingsDelegate = {
  findFirst(args?: unknown): Promise<LogSettingsRecord | null>
  create(args: unknown): Promise<LogSettingsRecord>
  update(args: unknown): Promise<LogSettingsRecord>
}

type PrismaLogClient = {
  auditLog: AuditLogDelegate
  logSettings?: LogSettingsDelegate
}

const db = prisma as unknown as PrismaLogClient
const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 50
const EXPORT_LIMIT = 5000
const RETENTION_CHECK_INTERVAL_MS = 60 * 60 * 1000
let lastRetentionCheck = 0
const SENSITIVE_KEY_PATTERN = /(password|token|secret|apiKey|api[_-]?key|authorization|cookie|set-cookie|refreshToken|accessToken|bank|iban|bic|privateKey)/i

const modules: LogModule[] = ["authentication", "users", "invoices", "quotes", "offers", "customers", "projects", "timeTracking", "banking", "api", "settings", "system", "datev", "ocr", "documents", "shopify", "woocommerce", "email", "backup", "integrations"]

function text(value: unknown) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

function numberParam(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

function boolParam(value: unknown) {
  if (value === true || value === "true") return true
  if (value === false || value === "false") return false
  return null
}

function dateParam(value: string | null | undefined, endOfDay = false) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) && endOfDay) date.setHours(23, 59, 59, 999)
  return date
}

function safeJson(value: unknown): JsonValue {
  if (value === null || value === undefined) return null
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map((item) => safeJson(item))
  if (typeof value !== "object") return String(value)

  const result: JsonRecord = {}
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : safeJson(nestedValue)
  }
  return result
}

function jsonRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeAction(action: string | null | undefined) {
  const value = (action ?? "").trim()
  const map: Record<string, string> = {
    "auth.login": "login.success",
    "auth.login_failed": "login.failed",
    "auth.logout": "logout",
    "user.create": "user.created",
    "user.update": "user.updated",
    "user.delete": "user.disabled",
    "settings.company.update": "settings.updated",
    "settings.number_ranges.update": "settings.updated",
    "settings.update": "settings.updated",
    "license.activate": "license.updated",
    "license.generate": "license.updated",
    "license.verify": "license.updated",
    "license_synced": "license.updated",
    "license_sync_failed": "license.updated",
    "invoice.finalize": "invoice.finalized",
    "invoice.delete": "invoice.deleted",
    "invoice.payment.create": "payment.created",
    "invoice.payment.update": "payment.created",
    "premium.time.create": "time_entry.created",
    "open_banking.connection_start": "banking.connection_started",
    "open_banking.connection_callback": "banking.connection_started",
    "open_banking.connection_blocked": "banking.provider_missing",
    "open_banking.connection_requires_live_provider": "banking.connection_failed",
    "open_banking.status_check": "banking.provider_missing",
    "open_banking.bank_connected": "banking.connection_success",
    "open_banking_bank_connected": "banking.connection_success",
    "open_banking_sync_failed": "banking.connection_failed",
    "open_banking_sync_success": "banking.connection_success",
    "open_banking.sync_failed": "banking.connection_failed",
    "open_banking.sync_succeeded": "banking.connection_success",
    "api_request": "api.request",
    "integration_configured": "webhook.created"
  }
  return map[value] ?? (value.replace(/_/g, ".") || "system.event")
}

function moduleFromAction(action: string, fallback?: string | null): LogModule {
  const value = fallback || action.split(".")[0]
  if (modules.includes(value as LogModule)) return value as LogModule
  if (value === "auth" || action.startsWith("login.") || action === "logout") return "authentication"
  if (value === "offer") return "offers"
  if (value === "invoice" || value === "payment") return "invoices"
  if (value === "article") return "documents"
  if (value === "customer") return "customers"
  if (value === "project") return "projects"
  if (value === "time_entry") return "timeTracking"
  if (value === "api_key" || value === "webhook") return "api"
  if (value === "permission" || value === "user") return "users"
  if (value === "banking" || value === "open_banking") return "banking"
  if (value === "export") return "documents"
  if (value === "license" || value === "settings") return "settings"
  return "system"
}

function normalizeLevel(value: string | null | undefined): LogLevel {
  if (value === "critical") return "critical"
  if (value === "success" || value === "info" || value === "warning" || value === "error") return value
  return "info"
}

function normalizeOutcome(action: string, level: LogLevel, value: unknown): LogOutcome {
  if (value === "failed" || value === "blocked" || value === "success") return value
  if (action.includes(".failed") || level === "error" || level === "critical") return "failed"
  if (action.includes(".blocked") || action.includes("provider_missing")) return "blocked"
  return "success"
}

function normalizeSource(value: unknown): LogSource {
  if (value === "api" || value === "system" || value === "ui") return value
  if (value === "auth" || value === "open_banking" || value === "finance" || value === "billing") return "system"
  return "ui"
}

function normalizeStatus(value: string | null | undefined): LogStatus {
  return value === "archived" ? "archived" : "active"
}

function searchableText(input: AuditLogInput) {
  return [
    input.title,
    input.description,
    input.action,
    input.module,
    input.level,
    input.status,
    input.outcome,
    input.source,
    input.actorId,
    input.actorName,
    input.actorEmail,
    input.actorRole,
    input.entityType,
    input.entityId,
    input.entityLabel,
    input.ipAddress,
    input.requestId,
    input.sessionId,
    input.traceId,
    input.method,
    input.endpoint,
    ...(input.tags ?? [])
  ].filter(Boolean).join(" ").toLowerCase()
}

function whereFromParams(params: AuditLogQueryParams) {
  const where: Record<string, unknown> = {}
  const filters: Record<string, unknown>[] = []
  const search = text(params.search)
  const dateFrom = dateParam(params.dateFrom)
  const dateTo = dateParam(params.dateTo, true)
  const archived = boolParam(params.archived)

  if (text(params.module)) {
    where.module = params.module
  }
  if (text(params.level)) where.level = params.level
  if (text(params.status)) where.status = params.status
  if (text(params.actorId)) where.actorId = params.actorId
  if (archived !== null) where.archived = archived

  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {})
    }
  }

  if (search) {
    for (const field of ["searchableText", "title", "description", "actorEmail", "actorName", "ipAddress", "requestId", "endpoint", "action", "entity", "entityId", "entityType", "type"]) {
      filters.push({ [field]: { contains: search, mode: "insensitive" } })
    }
    where.OR = [...(Array.isArray(where.OR) ? where.OR : []), ...filters]
  }

  return where
}

function filterByOutcome(logs: LogEntry[], outcome?: string | null) {
  return outcome ? logs.filter((log) => log.outcome === outcome) : logs
}

function normalizeRetention(value: unknown): LogRetention {
  if (value === "unlimited") return "unlimited"
  const parsed = Number.parseInt(String(value ?? ""), 10)
  if (parsed === 30 || parsed === 90 || parsed === 180 || parsed === 365) return parsed
  return 30
}

function toLogEntry(row: AuditLogRecord): LogEntry {
  const metadata = jsonRecord(row.metadata ?? row.data)
  const rawAction = row.type && row.type !== "legacy" ? row.type : row.action ?? metadata.action as string | undefined
  const action = normalizeAction(rawAction)
  const level = normalizeLevel(row.severity ?? row.level)
  const outcome = normalizeOutcome(action, level, metadata.outcome)
  const module = moduleFromAction(action, row.moduleKey ?? row.module)
  const entityType = String(row.entityType ?? row.entity ?? metadata.entityType ?? action.split(".")[0] ?? "")
  const entityLabel = String(metadata.entityLabel ?? metadata.label ?? metadata.name ?? row.entityId ?? "")

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: (row.updatedAt ?? row.createdAt).toISOString(),
    title: row.title,
    description: row.description ?? "",
    action,
    module,
    level,
    severity: level,
    outcome,
    source: normalizeSource(row.source ?? metadata.source),
    status: normalizeStatus(row.status),
    entityType,
    entityId: row.entityId ?? String(metadata.entityId ?? ""),
    entityLabel,
    actor: {
      id: row.actorId ?? "",
      name: row.actorName ?? "System",
      email: row.actorEmail ?? "",
      role: row.actorRole ?? "",
      avatar: null
    },
    ipAddress: row.ipAddress ?? "",
    browser: {
      name: row.browserName ?? "",
      version: row.browserVersion ?? ""
    },
    operatingSystem: {
      name: row.osName ?? "",
      version: row.osVersion ?? ""
    },
    location: {
      country: row.country ?? "",
      city: row.city ?? "",
      timezone: row.timezone ?? ""
    },
    metadata: {
      requestId: row.requestId ?? "",
      sessionId: row.sessionId ?? "",
      traceId: row.traceId ?? "",
      userAgent: row.userAgent ?? "",
      referer: row.referer ?? "",
      method: row.method ?? "",
      endpoint: row.endpoint ?? "",
      duration: row.duration ?? 0,
      additionalData: metadata
    },
    before: Object.keys(jsonRecord(row.before)).length ? jsonRecord(row.before) : null,
    after: Object.keys(jsonRecord(row.after)).length ? jsonRecord(row.after) : null,
    archived: Boolean(row.archived),
    archivedAt: row.archivedAt?.toISOString() ?? null,
    tags: row.tags ?? [],
    searchableText: row.searchableText ?? ""
  }
}

export function paramsFromSearchParams(searchParams: URLSearchParams): AuditLogQueryParams {
  return {
    page: numberParam(searchParams.get("page"), 1, 1, 1_000_000),
    pageSize: numberParam(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
    search: text(searchParams.get("search")),
    module: text(searchParams.get("module")),
    level: text(searchParams.get("level")),
    status: text(searchParams.get("status")),
    outcome: text(searchParams.get("outcome")),
    actorId: text(searchParams.get("actorId")),
    dateFrom: text(searchParams.get("dateFrom")),
    dateTo: text(searchParams.get("dateTo")),
    archived: boolParam(searchParams.get("archived")),
    sort: searchParams.get("sort") === "oldest" ? "oldest" : "newest"
  }
}

export async function createAuditLog(input: AuditLogInput) {
  const action = normalizeAction(input.action)
  const level = normalizeLevel(input.severity ?? input.level)
  const outcome = normalizeOutcome(action, level, input.outcome)
  const source = normalizeSource(input.source)
  const module = moduleFromAction(action, String(input.module || "system"))
  const metadata = safeJson({
    ...(jsonRecord(input.metadata)),
    outcome,
    source,
    entityLabel: input.entityLabel ?? null
  })

  const data = {
    title: input.title,
    description: input.description ?? null,
    module,
    level,
    status: String(input.status || "active"),
    actorId: input.actorId ?? null,
    actorName: input.actorName ?? null,
    actorEmail: input.actorEmail ?? null,
    actorRole: input.actorRole ?? null,
    ipAddress: input.ipAddress ?? null,
    browserName: input.browserName ?? null,
    browserVersion: input.browserVersion ?? null,
    osName: input.osName ?? null,
    osVersion: input.osVersion ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    timezone: input.timezone ?? null,
    requestId: input.requestId ?? null,
    sessionId: input.sessionId ?? null,
    traceId: input.traceId ?? null,
    userAgent: input.userAgent ?? null,
    referer: input.referer ?? null,
    method: input.method ?? null,
    endpoint: input.endpoint ?? null,
    duration: input.duration ?? null,
    tags: input.tags ?? [],
    metadata,
    data: metadata,
    before: safeJson(input.before),
    after: safeJson(input.after),
    archived: false,
    archivedAt: null,
    searchableText: searchableText({ ...input, action, module, level, outcome, source }),
    action,
    entity: input.entityType ?? module,
    entityType: input.entityType ?? null,
    entityId: input.entityId ?? null,
    type: action,
    source,
    severity: level,
    moduleKey: module
  }

  return toLogEntry(await db.auditLog.create({ data }))
}

export async function getAuditLogs(params: AuditLogQueryParams) {
  await enforceRetentionPolicy()
  const page = numberParam(params.page, 1, 1, 1_000_000)
  const pageSize = numberParam(params.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)
  const where = whereFromParams(params)
  const orderBy = { createdAt: params.sort === "oldest" ? "asc" : "desc" }
  const [totalItemsRaw, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])
  const logs = filterByOutcome(rows.map(toLogEntry), params.outcome)
  const totalItems = params.outcome ? logs.length : totalItemsRaw

  const pagination: Pagination = {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(Math.ceil(totalItems / pageSize), 1)
  }

  return { logs, pagination }
}

export async function exportLogsQuery(params: AuditLogQueryParams) {
  const where = whereFromParams(params)
  const rows = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: params.sort === "oldest" ? "asc" : "desc" },
    take: EXPORT_LIMIT
  })

  return filterByOutcome(rows.map(toLogEntry), params.outcome)
}

export async function getAuditLogStats(params: AuditLogQueryParams = {}): Promise<LogStatistics> {
  await enforceRetentionPolicy()
  const where = whereFromParams(params)
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
  const [total, todayCount, lastHourCount, rows, archivedRows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.count({ where: { ...where, createdAt: { gte: today } } }),
    db.auditLog.count({ where: { ...where, createdAt: { gte: lastHour } } }),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: EXPORT_LIMIT }),
    db.auditLog.findMany({ where: { ...where, archived: true }, take: EXPORT_LIMIT })
  ])
  const logs = rows.map(toLogEntry)

  return {
    total,
    success: logs.filter((log) => log.outcome === "success").length,
    warning: logs.filter((log) => log.level === "warning").length,
    error: logs.filter((log) => log.level === "error" || log.level === "critical").length,
    info: logs.filter((log) => log.level === "info").length,
    today: todayCount,
    lastHour: lastHourCount,
    critical: logs.filter((log) => log.level === "critical").length,
    failed: logs.filter((log) => log.outcome === "failed" || log.outcome === "blocked").length,
    adminActions: logs.filter((log) => log.module === "users" || log.action.startsWith("permission.") || log.action.startsWith("settings.") || log.action.startsWith("license.")).length,
    exports: logs.filter((log) => log.action === "export.created").length,
    storageSize: total * 1024,
    archiveSize: archivedRows.reduce((size, row) => size + JSON.stringify(row).length, 0)
  }
}

export async function getArchiveStatistics(): Promise<ArchiveStatistics> {
  const retention = await getRetention()
  const [activeLogs, archivedLogs, activeRows, archivedRows, oldestRows] = await Promise.all([
    db.auditLog.count({ where: { archived: false } }),
    db.auditLog.count({ where: { archived: true } }),
    db.auditLog.findMany({ where: { archived: false }, take: EXPORT_LIMIT }),
    db.auditLog.findMany({ where: { archived: true }, take: EXPORT_LIMIT }),
    db.auditLog.findMany({ where: { archived: false }, orderBy: { createdAt: "asc" }, take: 1 })
  ])

  return {
    activeLogs,
    archivedLogs,
    activeSize: activeRows.reduce((size, row) => size + JSON.stringify(row).length, 0),
    archiveSize: archivedRows.reduce((size, row) => size + JSON.stringify(row).length, 0),
    oldestLog: oldestRows[0]?.createdAt.toISOString() ?? null,
    nextArchiveDate: nextArchiveDate(),
    retention
  }
}

export async function archiveLogs(params: AuditLogQueryParams = {}) {
  const where = whereFromParams({ ...params, archived: false })
  await db.auditLog.updateMany({ where, data: { archived: true, archivedAt: new Date(), status: "archived" } })
  return getArchiveStatistics()
}

export async function restoreArchivedLogs(params: AuditLogQueryParams = {}) {
  const where = whereFromParams({ ...params, archived: true })
  await db.auditLog.updateMany({ where, data: { archived: false, archivedAt: null, status: "active" } })
  return getArchiveStatistics()
}

export async function updateRetention(retention: LogRetention) {
  const current = await db.logSettings?.findFirst()
  if (!db.logSettings) return getArchiveStatistics()
  if (current) {
    await db.logSettings.update({ where: { id: current.id }, data: { retention: String(retention) } })
  } else {
    await db.logSettings.create({ data: { retention: String(retention), autoArchive: true, archiveDayOfWeek: 0 } })
  }
  return getArchiveStatistics()
}

async function getRetention(): Promise<LogRetention> {
  const settings = await db.logSettings?.findFirst()
  return normalizeRetention(settings?.retention)
}

function nextArchiveDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  date.setHours(2, 0, 0, 0)
  return date.toISOString()
}

async function enforceRetentionPolicy() {
  const now = Date.now()
  if (now - lastRetentionCheck < RETENTION_CHECK_INTERVAL_MS) return
  lastRetentionCheck = now

  const retention = await getRetention()
  if (retention === "unlimited") return

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - retention)
  await db.auditLog.updateMany({
    where: { archived: false, createdAt: { lt: cutoff } },
    data: { archived: true, archivedAt: new Date(), status: "archived" }
  })
}


export async function getArchiveStats() {
  return getArchiveStatistics()
}

export async function archiveActiveLogs() {
  return archiveLogs({ archived: false })
}

export async function getRetentionPolicy() {
  return getRetention()
}

export async function updateRetentionPolicy(retention: LogRetention) {
  return updateRetention(retention)
}

export async function archiveOldLogs(retention?: LogRetention) {
  const effectiveRetention = retention ?? await getRetention()
  if (effectiveRetention === "unlimited") return getArchiveStatistics()
  const olderThan = new Date()
  olderThan.setDate(olderThan.getDate() - effectiveRetention)
  await db.auditLog.updateMany({
    where: { archived: false, createdAt: { lt: olderThan } },
    data: { archived: true, archivedAt: new Date(), status: "archived" }
  })
  return getArchiveStatistics()
}
