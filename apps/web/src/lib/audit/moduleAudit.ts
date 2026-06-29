import type { SessionUser } from "@/lib/auth/service"
import { auditActor, requestContext, safeJson } from "./audit-event-helpers"
import { logBackendAuditEvent } from "./backendAuditEventWriter"

export async function logModuleAccessDenied(input: {
  request: Request
  actor?: SessionUser | null
  moduleKey: string
  reason: string
}) {
  return logBackendAuditEvent({
    type: "module_access_denied",
    source: "module_engine",
    severity: "warning",
    title: "Modulzugriff verweigert",
    description: `Zugriff auf ${input.moduleKey} wurde verweigert.`,
    actor: auditActor(input.actor),
    requestContext: requestContext(input.request, input.actor),
    moduleKey: input.moduleKey,
    entityType: "module",
    entityId: input.moduleKey,
    metadata: safeJson({ reason: input.reason })
  })
}

export async function logModuleVisibleChanged(input: {
  actor?: SessionUser | null
  moduleKey: string
  visibleBefore: boolean
  visibleAfter: boolean
}) {
  return logBackendAuditEvent({
    type: "module_visible_changed",
    source: "module_engine",
    severity: "info",
    title: "Modulsichtbarkeit geaendert",
    description: `Sichtbarkeit fuer ${input.moduleKey} wurde geaendert.`,
    actor: auditActor(input.actor),
    moduleKey: input.moduleKey,
    entityType: "module",
    entityId: input.moduleKey,
    before: safeJson({ visible: input.visibleBefore }),
    after: safeJson({ visible: input.visibleAfter })
  })
}
