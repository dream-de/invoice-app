import { Prisma, prisma } from "@dream-invoice/database"
import type { AuditEvent } from "./auditTypes"
import type { AuditLogFilters, AuditLogInput, AuditLogListResponse, AuditLogStats } from "./audit.types"

const SENSITIVE_KEY_PATTERN = /(password|secret|token|api[_-]?key|authorization|cookie|credential)/i

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function sanitizeJsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined
  if (value === null) return undefined
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeJsonValue(entry) ?? null)
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeJsonValue(entry) ?? null
      ])
    )
  }

  return String(value)
}

function normalizeLimit(limit: number | undefined) {
  if (!limit || !Number.isFinite(limit)) return 50
  return Math.min(Math.max(Math.trunc(limit), 1), 200)
}

function normalizeOffset(offset: number | undefined) {
  if (!offset || !Number.isFinite(offset)) return 0
  return Math.min(Math.max(Math.trunc(offset), 0), 10_000)
}

function toWhere(filters: AuditLogFilters): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {}

  if (filters.tenantId) where.tenantId = filters.tenantId
  if (filters.workspaceId) where.workspaceId = filters.workspaceId
  if (filters.actorId) where.actorId = filters.actorId
  if (filters.type) where.type = filters.type
  if (filters.source) where.source = filters.source
  if (filters.severity) where.severity = filters.severity
  if (filters.moduleKey) where.moduleKey = filters.moduleKey
  if (filters.integrationKey) where.integrationKey = filters.integrationKey
  if (filters.marketplaceModuleKey) where.marketplaceModuleKey = filters.marketplaceModuleKey
  if (filters.requestId) where.requestId = filters.requestId

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {})
    }
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
      { actorName: { contains: filters.search, mode: "insensitive" } },
      { actorEmail: { contains: filters.search, mode: "insensitive" } },
      { moduleKey: { contains: filters.search, mode: "insensitive" } },
      { integrationKey: { contains: filters.search, mode: "insensitive" } },
      { marketplaceModuleKey: { contains: filters.search, mode: "insensitive" } },
      { ipAddress: { contains: filters.search, mode: "insensitive" } },
      { requestId: { contains: filters.search, mode: "insensitive" } },
      { action: { contains: filters.search, mode: "insensitive" } },
      { entity: { contains: filters.search, mode: "insensitive" } },
      { entityId: { contains: filters.search, mode: "insensitive" } }
    ]
  }

  return where
}

function jsonObject(value: Prisma.JsonValue | null): Record<string, string | number | boolean | null> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      entry === null || typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean"
        ? entry
        : JSON.stringify(entry)
    ])
  )
}

function serializeAuditLog(row: Prisma.AuditLogGetPayload<Record<string, never>>): AuditEvent {
  return {
    id: row.id,
    timestamp: row.createdAt.toISOString(),
    type: row.type as AuditEvent["type"],
    source: row.source as AuditEvent["source"],
    severity: row.severity as AuditEvent["severity"],
    title: row.title,
    description: row.description ?? row.reason ?? "",
    actor: {
      actorId: row.actorId ?? undefined,
      actorName: row.actorName,
      actorRole: row.actorRole ?? "System"
    },
    moduleKey: row.moduleKey ?? undefined,
    integrationKey: row.integrationKey ?? undefined,
    licensePlan: undefined,
    featureFlag: undefined,
    ipAddress: row.ipAddress ?? undefined,
    requestId: row.requestId ?? undefined,
    metadata: jsonObject(row.metadata),
    before: jsonObject(row.before),
    after: jsonObject(row.after)
  }
}

export async function createAuditLog(input: AuditLogInput) {
  const metadata = sanitizeJsonValue(input.metadata)
  const before = sanitizeJsonValue(input.before)
  const after = sanitizeJsonValue(input.after)

  return prisma.auditLog.create({
    data: {
      action: input.type,
      entity: input.entityType ?? input.moduleKey ?? input.integrationKey ?? input.marketplaceModuleKey ?? input.source,
      entityId: input.entityId ?? null,
      reason: input.description ?? null,
      data: metadata,
      tenantId: input.tenantId ?? null,
      workspaceId: input.workspaceId ?? null,
      actorId: input.actorId ?? null,
      actorName: input.actorName,
      actorRole: input.actorRole ?? null,
      actorEmail: input.actorEmail ?? null,
      type: input.type,
      source: input.source,
      severity: input.severity,
      title: input.title,
      description: input.description ?? null,
      moduleKey: input.moduleKey ?? null,
      integrationKey: input.integrationKey ?? null,
      marketplaceModuleKey: input.marketplaceModuleKey ?? null,
      entityType: input.entityType ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      browser: input.browser ?? null,
      device: input.device ?? null,
      location: input.location ?? null,
      requestId: input.requestId ?? null,
      metadata,
      before,
      after
    }
  })
}

export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
  const limit = normalizeLimit(filters.limit)
  const offset = normalizeOffset(filters.offset)
  const where = toWhere(filters)

  const [rows, count] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset
    }),
    prisma.auditLog.count({ where })
  ])

  return {
    ok: true,
    logs: rows.map(serializeAuditLog),
    count,
    nextCursor: offset + rows.length < count ? String(offset + rows.length) : null
  }
}

export async function getAuditLogById(id: string) {
  const row = await prisma.auditLog.findUnique({ where: { id } })
  return row ? serializeAuditLog(row) : null
}

export async function countAuditLogs(filters: AuditLogFilters = {}) {
  return prisma.auditLog.count({ where: toWhere(filters) })
}

export async function getAuditLogStats(filters: AuditLogFilters = {}): Promise<AuditLogStats> {
  const where = toWhere(filters)
  const [total, severityRows, sourceRows, typeRows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ["severity"], where, _count: { _all: true } }),
    prisma.auditLog.groupBy({ by: ["source"], where, _count: { _all: true } }),
    prisma.auditLog.groupBy({ by: ["type"], where, _count: { _all: true } })
  ])

  return {
    total,
    bySeverity: Object.fromEntries(severityRows.map((row) => [row.severity, row._count._all])),
    bySource: Object.fromEntries(sourceRows.map((row) => [row.source, row._count._all])),
    byType: Object.fromEntries(typeRows.map((row) => [row.type, row._count._all]))
  }
}
