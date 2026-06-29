import type { SessionUser } from "@/lib/auth/service"
import { auditActor, maskSecretEnding, requestContext, safeJson } from "./audit-event-helpers"
import { logBackendAuditEvent } from "./backendAuditEventWriter"
import type { AuditSeverity } from "./audit.types"

type IntegrationAuditInput = {
  request?: Request
  actor?: SessionUser | null
  integrationKey: string
  title?: string
  description?: string
  severity?: AuditSeverity
  status?: string
  provider?: string
  apiKey?: unknown
  token?: unknown
  recordsProcessed?: number
  errorCode?: string
}

function context(request: Request | undefined, actor: SessionUser | null | undefined) {
  return request ? requestContext(request, actor) : undefined
}

export async function logIntegrationEvent(type: string, input: IntegrationAuditInput) {
  return logBackendAuditEvent({
    type,
    source: "integration",
    severity: input.severity ?? "info",
    title: input.title ?? "Integration Event",
    description: input.description ?? `${input.integrationKey} Integration Event.`,
    actor: auditActor(input.actor),
    requestContext: context(input.request, input.actor),
    integrationKey: input.integrationKey,
    moduleKey: input.integrationKey,
    entityType: "integration",
    entityId: input.integrationKey,
    metadata: safeJson({
      provider: input.provider ?? input.integrationKey,
      status: input.status ?? null,
      apiKeyPreview: maskSecretEnding(input.apiKey),
      tokenPreview: maskSecretEnding(input.token),
      recordsProcessed: input.recordsProcessed ?? null,
      errorCode: input.errorCode ?? null
    })
  })
}
