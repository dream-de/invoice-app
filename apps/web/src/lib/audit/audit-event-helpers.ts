import type { SessionUser } from "@/lib/auth/service"
import { createAuditRequestContext } from "./audit-request-context"
import type { AuditJson, AuditRequestContext } from "./audit.types"

export function requestContext(request: Request, actor?: SessionUser | null): AuditRequestContext {
  return createAuditRequestContext(request, actor)
}

export function auditActor(user: SessionUser | null | undefined, fallbackEmail?: string | null) {
  return {
    actorId: user?.id ?? null,
    actorName: user?.name ?? user?.email ?? fallbackEmail ?? "System",
    actorRole: user?.role ?? null,
    actorEmail: user?.email ?? fallbackEmail ?? null
  }
}

export function maskSecretEnding(value: unknown) {
  const text = String(value ?? "").trim()
  if (!text) return null
  return `****${text.slice(-4)}`
}

export function maskIban(value: unknown) {
  const text = String(value ?? "").replace(/\s/g, "")
  if (!text) return null
  if (text.length <= 8) return "****"
  return `${text.slice(0, 2)}** **** **** **** ${text.slice(-6)}`
}

export function safeJson(value: Record<string, unknown>): AuditJson {
  return value as AuditJson
}
