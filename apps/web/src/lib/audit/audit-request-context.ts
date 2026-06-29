import type { SessionUser } from "@/lib/auth/service"
import { getAuditRequestMetadata } from "./request-metadata"
import type { AuditRequestContext } from "./audit.types"

function headerValue(request: Request, key: string) {
  const value = request.headers.get(key)?.trim()
  return value || null
}

function requestId(request: Request) {
  return (
    headerValue(request, "x-request-id") ??
    headerValue(request, "x-correlation-id") ??
    headerValue(request, "cf-ray") ??
    crypto.randomUUID()
  )
}

export function createAuditRequestContext(request: Request, actor?: SessionUser | null): AuditRequestContext {
  const metadata = getAuditRequestMetadata(request)
  const location = [metadata.city, metadata.region, metadata.country].filter(Boolean).join(", ") || null

  return {
    tenantId: headerValue(request, "x-tenant-id"),
    workspaceId: headerValue(request, "x-workspace-id") ?? headerValue(request, "x-company-id"),
    actorId: actor?.id ?? null,
    actorName: actor?.name ?? actor?.email ?? null,
    actorRole: actor?.role ?? null,
    actorEmail: actor?.email ?? null,
    ipAddress: metadata.ipAddress,
    userAgent: metadata.userAgent,
    browser: metadata.browser,
    device: metadata.deviceType,
    location,
    requestId: requestId(request)
  }
}
