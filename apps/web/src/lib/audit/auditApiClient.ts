import { getAuditEvents } from "./auditLogger"
import type { AuditEvent } from "./auditTypes"
import type { AuditLogFilters, AuditLogStats } from "./audit.types"

// TODO: Realtime via WebSocket/SSE spaeter ergaenzen.

function appendParam(params: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return
  params.set(key, String(value))
}

function toQuery(filters: AuditLogFilters = {}) {
  const params = new URLSearchParams()
  appendParam(params, "tenantId", filters.tenantId)
  appendParam(params, "workspaceId", filters.workspaceId)
  appendParam(params, "actorId", filters.actorId)
  appendParam(params, "type", filters.type)
  appendParam(params, "source", filters.source)
  appendParam(params, "severity", filters.severity)
  appendParam(params, "moduleKey", filters.moduleKey)
  appendParam(params, "integrationKey", filters.integrationKey)
  appendParam(params, "marketplaceModuleKey", filters.marketplaceModuleKey)
  appendParam(params, "requestId", filters.requestId)
  appendParam(params, "dateFrom", filters.dateFrom)
  appendParam(params, "dateTo", filters.dateTo)
  appendParam(params, "search", filters.search)
  appendParam(params, "limit", filters.limit)
  appendParam(params, "offset", filters.offset)
  appendParam(params, "cursor", filters.cursor)
  return params.toString()
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store"
  })

  if (!response.ok) {
    throw new Error(`Audit API request failed with ${response.status}`)
  }

  return response.json() as Promise<T>
}

export async function fetchAuditLogs(filters: AuditLogFilters = {}) {
  const query = toQuery(filters)
  return fetchJson<{ ok: true; logs: AuditEvent[]; count: number; nextCursor: string | null }>(
    `/api/audit-logs${query ? `?${query}` : ""}`
  )
}

export async function fetchAuditLogById(id: string) {
  return fetchJson<{ ok: true; log: AuditEvent }>(`/api/audit-logs/${encodeURIComponent(id)}`)
}

export async function fetchAuditLogStats(filters: AuditLogFilters = {}) {
  const query = toQuery(filters)
  return fetchJson<{ ok: true; stats: AuditLogStats }>(
    `/api/audit-logs/stats${query ? `?${query}` : ""}`
  )
}

export async function fetchAuditLogsWithFallback(filters: AuditLogFilters = {}) {
  try {
    return await fetchAuditLogs(filters)
  } catch {
    return {
      ok: true as const,
      logs: getAuditEvents(),
      count: getAuditEvents().length,
      nextCursor: null
    }
  }
}
