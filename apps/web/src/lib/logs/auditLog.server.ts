import { prisma } from "@dream-invoice/database"
import type {
  ArchiveStatistics,
  LogEntry,
  LogLevel,
  LogModule,
  LogRetention,
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
  module: LogModule | string
  level: LogLevel | string
  status?: LogStatus | string
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
  metadata?: JsonValue
}

export interface AuditLogQueryParams {
  page?: number
  pageSize?: number
  search?: string | null
  module?: string | null
  level?: string | null
  status?: string | null
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
  archived?: boolean
  archivedAt?: Date | null
  searchableText?: string | null
}

type AuditLogDelegate = {
  create(args: unknown): Promise<AuditLogRecord>
  findMany(args: unknown): Promise<AuditLogRecord[]>
  count(args?: unknown): Promise<number>
  updateMany(args: unknown): Promise<{ count: number }>
  deleteMany(args: unknown): Promise<{ count: number }>
  groupBy(args: unknown): Promise<Array<{ level?: string | null; _count: { _all: number } }>>
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
const SENSITIVE_KEY_PATTERN = /(password|token|secret|apiKey|api[_-]?key|authorization|cookie|set-cookie)/i

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

function dateParam(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function safeJson(value: unknown): JsonValue {
  if (value === null || value === undefined) return null
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map((item) => safeJson(item))
  if (typeof value !== "object") return String(value)

  const result: JsonRecord = {}
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      result[key] = "[redacted]"
      continue
    }
    result[key] = safeJson(nestedValue)
  }
  return result
}

function searchableText(input: AuditLogInput) {
  return [
    input.title,
    input.description,
    input.module,
    input.level,
    input.status,
    input.actorId,
    input.actorName,
    input.actorEmail,
    input.actorRole,
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
  const dateTo = dateParam(params.dateTo)
  const archived = boolParam(params.archived)

  if (text(params.module)) where.module = params.module
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
    for (const field of ["searchableText", "title", "description", "actorEmail", "actorName", "ipAddress", "requestId", "endpoint"]) {
      filters.push({ [field]: { contains: search, mode: "insensitive" } })
    }
    where.OR = filters
  }

  return where
}

function normalizeRetention(value: unknown): LogRetention {
  if (value === "unlimited") return "unlimited"
  const parsed = Number.parseInt(String(value ?? ""), 10)
  if (parsed === 30 || parsed === 90 || parsed === 180 || parsed === 365) return parsed
  return 30
}

function normalizeModule(value: string | null | undefined): LogModule {
  const modules: LogModule[] = ["authentication", "users", "invoices", "quotes", "customers", "projects", "timeTracking", "banking", "api", "settings", "system", "datev", "ocr", "documents", "shopify", "woocommerce", "email", "backup", "integrations"]
  return modules.includes(value as LogModule) ? value as LogModule : "system"
}

function normalizeLevel(value: string | null | undefined): LogLevel {
  if (value === "success" || value === "info" || value === "warning" || value === "error") return value
  return "info"
}

function normalizeStatus(value: string | null | undefined): LogStatus {
  return value === "archived" ? "archived" : "active"
}

function toLogEntry(row: AuditLogRecord): LogEntry {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: (row.updatedAt ?? row.createdAt).toISOString(),
    title: row.title,
    description: row.description ?? "",
    module: normalizeModule(row.module),
    level: normalizeLevel(row.level),
    status: normalizeStatus(row.status),
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
      additionalData: typeof row.metadata === "object" && row.metadata !== null ? row.metadata as Record<string, unknown> : {}
    },
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
    actorId: text(searchParams.get("actorId")),
    dateFrom: text(searchParams.get("dateFrom")),
    dateTo: text(searchParams.get("dateTo")),
    archived: boolParam(searchParams.get("archived")),
    sort: searchParams.get("sort") === "oldest" ? "oldest" : "newest"
  }
}

export async function createAuditLog(input: AuditLogInput) {
  const data = {
    title: input.title,
    description: input.description ?? null,
    module: String(input.module || "system"),
    level: String(input.level || "info"),
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
    metadata: safeJson(input.metadata),
    archived: false,
    archivedAt: null,
    searchableText: searchableText(input)
  }

  return toLogEntry(await db.auditLog.create({ data }))
}

export async function getAuditLogs(params: AuditLogQueryParams) {
  await enforceRetentionPolicy()
  const page = numberParam(params.page, 1, 1, 1_000_000)
  const pageSize = numberParam(params.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)
  const where = whereFromParams(params)
  const orderBy = { createdAt: params.sort === "oldest" ? "asc" : "desc" }
  const [totalItems, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    })
  ])

  const pagination: Pagination = {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(Math.ceil(totalItems / pageSize), 1)
  }

  return {
    logs: rows.map(toLogEntry),
    pagination
  }
}

export async function exportLogsQuery(params: AuditLogQueryParams) {
  const where = whereFromParams(params)
  const rows = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: params.sort === "oldest" ? "asc" : "desc" },
    take: EXPORT_LIMIT
  })

  return rows.map(toLogEntry)
}

export async function getAuditLogStats(params: AuditLogQueryParams = {}): Promise<LogStatistics> {
  await enforceRetentionPolicy()
  const where = whereFromParams(params)
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000)
  const [total, todayCount, lastHourCount, levels, archivedRows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.count({ where: { ...where, createdAt: { gte: today } } }),
    db.auditLog.count({ where: { ...where, createdAt: { gte: lastHour } } }),
    db.auditLog.groupBy({ by: ["level"], where, _count: { _all: true } }),
    db.auditLog.findMany({ where: { ...where, archived: true }, take: EXPORT_LIMIT })
  ])

  const byLevel = new Map(levels.map((entry) => [entry.level ?? "info", entry._count._all]))
  const archiveSize = archivedRows.reduce((size, row) => size + JSON.stringify(row).length, 0)

  return {
    total,
    success: byLevel.get("success") ?? 0,
    warning: byLevel.get("warning") ?? 0,
    error: byLevel.get("error") ?? 0,
    info: byLevel.get("info") ?? 0,
    today: todayCount,
    lastHour: lastHourCount,
    storageSize: total * 1024,
    archiveSize
  }
}

export async function getArchiveStats(): Promise<ArchiveStatistics> {
  await enforceRetentionPolicy()
  const [activeLogs, archivedLogs, retention, oldestRows, nextArchiveRows] = await Promise.all([
    db.auditLog.count({ where: { archived: false } }),
    db.auditLog.count({ where: { archived: true } }),
    getRetentionPolicy(),
    db.auditLog.findMany({ where: { archived: false }, orderBy: { createdAt: "asc" }, take: 1 }),
    db.auditLog.findMany({ where: { archived: false }, orderBy: { createdAt: "desc" }, take: 1 })
  ])
  const activeRows = await db.auditLog.findMany({ where: { archived: false }, take: EXPORT_LIMIT })
  const archivedRows = await db.auditLog.findMany({ where: { archived: true }, take: EXPORT_LIMIT })
  const nextArchiveDate = nextArchiveRows[0]?.createdAt ? new Date(nextArchiveRows[0].createdAt.getTime() + 24 * 60 * 60 * 1000) : null

  return {
    activeLogs,
    archivedLogs,
    archiveSize: archivedRows.reduce((size, row) => size + JSON.stringify(row).length, 0),
    activeSize: activeRows.reduce((size, row) => size + JSON.stringify(row).length, 0),
    oldestLog: oldestRows[0]?.createdAt.toISOString() ?? null,
    nextArchiveDate: nextArchiveDate?.toISOString() ?? null,
    retention
  }
}

export async function deleteExpiredActiveLogs(retention: LogRetention) {
  if (retention === "unlimited") return { count: 0 }
  const threshold = new Date(Date.now() - retention * 24 * 60 * 60 * 1000)
  return db.auditLog.deleteMany({
    where: { archived: false, createdAt: { lt: threshold } }
  })
}

export async function enforceRetentionPolicy(force = false) {
  const now = Date.now()
  if (!force && now - lastRetentionCheck < RETENTION_CHECK_INTERVAL_MS) return { count: 0 }
  lastRetentionCheck = now
  const retention = await getRetentionPolicy()
  return deleteExpiredActiveLogs(retention)
}

export async function archiveActiveLogs() {
  await enforceRetentionPolicy(true)
  await db.auditLog.updateMany({
    where: { archived: false },
    data: { archived: true, archivedAt: new Date(), status: "archived" }
  })
  return getArchiveStats()
}

export async function archiveOldLogs(retention: LogRetention) {
  await deleteExpiredActiveLogs(retention)
  return getArchiveStats()
}

export async function restoreArchivedLogs(params: AuditLogQueryParams = {}) {
  await db.auditLog.updateMany({
    where: { ...whereFromParams(params), archived: true },
    data: { archived: false, archivedAt: null, status: "active" }
  })
  return getArchiveStats()
}

export async function getRetentionPolicy(): Promise<LogRetention> {
  if (!db.logSettings) return 30
  const settings = await db.logSettings.findFirst({ orderBy: { createdAt: "asc" } })
  return normalizeRetention(settings?.retention)
}

export async function updateRetentionPolicy(retention: LogRetention) {
  if (!db.logSettings) return getArchiveStats()
  const value = String(retention)
  const existing = await db.logSettings.findFirst({ orderBy: { createdAt: "asc" } })
  if (existing) {
    await db.logSettings.update({
      where: { id: existing.id },
      data: { retention: value }
    })
  } else {
    await db.logSettings.create({
      data: { retention: value, autoArchive: true, archiveDayOfWeek: 0 }
    })
  }
  return getArchiveStats()
}
