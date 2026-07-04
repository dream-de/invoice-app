import { createAuditLog } from "@/lib/logs/auditLog.server"
import type { AuditLogInput } from "@/lib/logs/auditLog.server"
import type { LogLevel, LogModule, LogStatus } from "@/lib/logs/types"
import type { RequestAuditContext } from "@/lib/logs/requestContext.server"
import { getRequestAuditContext } from "@/lib/logs/requestContext.server"

type AuditLogMetadata = Record<string, unknown>

export interface AuditWriterInput {
  title?: string | null
  description?: string | null
  module?: LogModule | string
  level?: LogLevel | string
  status?: LogStatus | string
  actorId?: string | null
  actorName?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  request?: Request
  requestContext?: Partial<RequestAuditContext> | null
  metadata?: AuditLogMetadata | null
  tags?: string[]
  action?: string | null
  outcome?: "success" | "failed" | "blocked" | null
  source?: "ui" | "api" | "system" | null
  entityType?: string | null
  entityId?: string | null
  entityLabel?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
}

const SENSITIVE_KEY_PATTERN = /(password|token|secret|apiKey|api[_-]?key|authorization|cookie|set-cookie|refreshToken|accessToken)/i

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item))
  if (typeof value !== "object") return String(value)

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeValue(nestedValue)
    ])
  )
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function fallbackTitle(input: AuditWriterInput) {
  if (input.title) return input.title
  if (input.action) return input.action.split(/[._:-]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
  const module = cleanString(input.module) ?? "System"
  return `${module} Ereignis`
}

function withRequestContext(input: AuditWriterInput) {
  if (input.requestContext) return input.requestContext
  if (!input.request) return null
  return getRequestAuditContext(input.request)
}

async function writeSafely(input: AuditWriterInput, defaults: { module: LogModule | string; level: LogLevel | string }) {
  try {
    const context = withRequestContext(input)
    const metadata = sanitizeValue({
      ...(input.metadata ?? {}),
      action: input.action ?? null,
      outcome: input.outcome ?? null,
      source: input.source ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? null
    }) as AuditLogInput["metadata"]

    const payload: AuditLogInput = {
      title: fallbackTitle(input),
      description: input.description ?? null,
      action: input.action ?? null,
      module: input.module ?? defaults.module,
      level: input.level ?? defaults.level,
      severity: input.level ?? defaults.level,
      outcome: input.outcome ?? (String(input.level ?? defaults.level) === "error" ? "failed" : "success"),
      source: input.source ?? "ui",
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      entityLabel: input.entityLabel ?? null,
      status: input.status ?? "active",
      actorId: input.actorId ?? null,
      actorName: input.actorName ?? null,
      actorEmail: input.actorEmail ?? null,
      actorRole: input.actorRole ?? null,
      ipAddress: context?.ipAddress ?? null,
      browserName: context?.browserName ?? null,
      browserVersion: context?.browserVersion ?? null,
      osName: context?.osName ?? null,
      osVersion: context?.osVersion ?? null,
      requestId: context?.requestId ?? null,
      sessionId: context?.sessionId ?? null,
      traceId: context?.traceId ?? null,
      userAgent: context?.userAgent ?? null,
      referer: context?.referer ?? null,
      method: context?.method ?? null,
      endpoint: context?.endpoint ?? null,
      tags: input.tags ?? [],
      metadata,
      before: sanitizeValue(input.before) as AuditLogInput["before"] ?? undefined,
      after: sanitizeValue(input.after) as AuditLogInput["after"] ?? undefined
    }

    return await createAuditLog(payload)
  } catch (error) {
    console.warn("Audit log could not be written.", error)
    return null
  }
}

export function writeAuditLog(input: AuditWriterInput) {
  return writeSafely(input, { module: "system", level: "info" })
}

export function writeAuthLog(input: AuditWriterInput) {
  return writeSafely(input, { module: "authentication", level: input.level ?? "info" })
}

export function writeSystemLog(input: AuditWriterInput) {
  return writeSafely(input, { module: "system", level: input.level ?? "info" })
}

export function writeApiLog(input: AuditWriterInput) {
  return writeSafely(input, { module: input.module ?? "api", level: input.level ?? "info" })
}

export function writeErrorLog(input: AuditWriterInput) {
  return writeSafely(input, { module: input.module ?? "system", level: "error" })
}

export function writeSecurityLog(input: AuditWriterInput) {
  return writeSafely(input, { module: "authentication", level: input.level ?? "warning" })
}
