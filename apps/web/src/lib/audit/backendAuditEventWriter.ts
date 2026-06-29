import { createAuditLog } from "./audit.service"
import type { BackendAuditEventInput } from "./audit.types"

export async function logBackendAuditEvent(input: BackendAuditEventInput) {
  const requestContext = input.requestContext

  try {
    return await createAuditLog({
      tenantId: input.tenantId ?? requestContext?.tenantId ?? null,
      workspaceId: input.workspaceId ?? requestContext?.workspaceId ?? null,
      actorId: input.actorId ?? input.actor?.actorId ?? requestContext?.actorId ?? null,
      actorName: input.actorName ?? input.actor?.actorName ?? requestContext?.actorName ?? "System",
      actorRole: input.actorRole ?? input.actor?.actorRole ?? requestContext?.actorRole ?? null,
      actorEmail: input.actorEmail ?? input.actor?.actorEmail ?? requestContext?.actorEmail ?? null,
      type: input.type,
      source: input.source,
      severity: input.severity,
      title: input.title,
      description: input.description ?? null,
      moduleKey: input.moduleKey ?? null,
      integrationKey: input.integrationKey ?? null,
      marketplaceModuleKey: input.marketplaceModuleKey ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      ipAddress: input.ipAddress ?? requestContext?.ipAddress ?? null,
      userAgent: input.userAgent ?? requestContext?.userAgent ?? null,
      browser: input.browser ?? requestContext?.browser ?? null,
      device: input.device ?? requestContext?.device ?? null,
      location: input.location ?? requestContext?.location ?? null,
      requestId: input.requestId ?? requestContext?.requestId ?? null,
      metadata: input.metadata,
      before: input.before,
      after: input.after
    })
  } catch (error) {
    console.warn("Backend audit event write failed.", error)
    return null
  }
}
