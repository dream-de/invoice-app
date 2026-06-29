import type { AuditJson, AuditLogFilters, AuditLogInput } from "./audit.types"

function text(value: unknown) {
  if (typeof value !== "string") return undefined
  const normalized = value.trim()
  return normalized || undefined
}

function numberValue(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

export function parseAuditLogFilters(searchParams: URLSearchParams): AuditLogFilters {
  return {
    tenantId: text(searchParams.get("tenantId")),
    workspaceId: text(searchParams.get("workspaceId")),
    actorId: text(searchParams.get("actorId")),
    type: text(searchParams.get("type")),
    source: text(searchParams.get("source")),
    severity: text(searchParams.get("severity")),
    moduleKey: text(searchParams.get("moduleKey")),
    integrationKey: text(searchParams.get("integrationKey")),
    marketplaceModuleKey: text(searchParams.get("marketplaceModuleKey")),
    requestId: text(searchParams.get("requestId")),
    dateFrom: text(searchParams.get("dateFrom")),
    dateTo: text(searchParams.get("dateTo")),
    search: text(searchParams.get("search") ?? searchParams.get("query")),
    limit: numberValue(searchParams.get("limit"), 50, 1, 200),
    offset: numberValue(searchParams.get("offset"), 0, 0, 10_000),
    cursor: text(searchParams.get("cursor"))
  }
}

export function parseAuditLogInput(value: unknown): Partial<AuditLogInput> {
  if (!value || typeof value !== "object") return {}
  const input = value as Record<string, unknown>

  return {
    tenantId: text(input.tenantId) ?? null,
    workspaceId: text(input.workspaceId) ?? null,
    actorId: text(input.actorId) ?? null,
    actorName: text(input.actorName) ?? "System",
    actorRole: text(input.actorRole) ?? null,
    actorEmail: text(input.actorEmail) ?? null,
    type: text(input.type) ?? "system_event",
    source: text(input.source) ?? "system",
    severity: text(input.severity) === "critical"
      ? "critical"
      : text(input.severity) === "error"
        ? "error"
        : text(input.severity) === "warning"
          ? "warning"
          : text(input.severity) === "success"
            ? "success"
            : "info",
    title: text(input.title) ?? "Audit Event",
    description: text(input.description) ?? null,
    moduleKey: text(input.moduleKey) ?? null,
    integrationKey: text(input.integrationKey) ?? null,
    marketplaceModuleKey: text(input.marketplaceModuleKey) ?? null,
    entityType: text(input.entityType) ?? null,
    entityId: text(input.entityId) ?? null,
    ipAddress: text(input.ipAddress) ?? null,
    userAgent: text(input.userAgent) ?? null,
    browser: text(input.browser) ?? null,
    device: text(input.device) ?? null,
    location: text(input.location) ?? null,
    requestId: text(input.requestId) ?? null,
    metadata: input.metadata === undefined || input.metadata === null ? undefined : input.metadata as AuditJson,
    before: input.before === undefined || input.before === null ? undefined : input.before as AuditJson,
    after: input.after === undefined || input.after === null ? undefined : input.after as AuditJson
  }
}
