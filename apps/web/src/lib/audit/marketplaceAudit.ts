import type { SessionUser } from "@/lib/auth/service"
import { auditActor, requestContext, safeJson } from "./audit-event-helpers"
import { logBackendAuditEvent } from "./backendAuditEventWriter"

type MarketplaceAuditInput = {
  request?: Request
  actor?: SessionUser | null
  moduleKey: string
  plan?: string | null
  licenseStatus?: string | null
  beforeInstalledExtensions?: readonly string[]
  afterInstalledExtensions?: readonly string[]
  reason?: string
}

function context(request: Request | undefined, actor: SessionUser | null | undefined) {
  return request ? requestContext(request, actor) : undefined
}

export async function logMarketplaceModuleInstalled(input: MarketplaceAuditInput) {
  return logBackendAuditEvent({
    type: "marketplace_module_installed",
    source: "marketplace",
    severity: "success",
    title: "Marketplace-Modul installiert",
    description: `${input.moduleKey} wurde installiert.`,
    actor: auditActor(input.actor),
    requestContext: context(input.request, input.actor),
    moduleKey: input.moduleKey,
    marketplaceModuleKey: input.moduleKey,
    entityType: "marketplace_module",
    entityId: input.moduleKey,
    metadata: safeJson({ plan: input.plan ?? null, licenseStatus: input.licenseStatus ?? null }),
    before: safeJson({ installedExtensions: [...(input.beforeInstalledExtensions ?? [])] }),
    after: safeJson({ installedExtensions: [...(input.afterInstalledExtensions ?? [])] })
  })
}

export async function logMarketplaceModuleUninstalled(input: MarketplaceAuditInput) {
  return logBackendAuditEvent({
    type: "marketplace_module_uninstalled",
    source: "marketplace",
    severity: "warning",
    title: "Marketplace-Modul deinstalliert",
    description: `${input.moduleKey} wurde deinstalliert.`,
    actor: auditActor(input.actor),
    requestContext: context(input.request, input.actor),
    moduleKey: input.moduleKey,
    marketplaceModuleKey: input.moduleKey,
    entityType: "marketplace_module",
    entityId: input.moduleKey,
    metadata: safeJson({ plan: input.plan ?? null, licenseStatus: input.licenseStatus ?? null }),
    before: safeJson({ installedExtensions: [...(input.beforeInstalledExtensions ?? [])] }),
    after: safeJson({ installedExtensions: [...(input.afterInstalledExtensions ?? [])] })
  })
}

export async function logMarketplaceModuleFailed(input: MarketplaceAuditInput) {
  return logBackendAuditEvent({
    type: "marketplace_module_install_failed",
    source: "marketplace",
    severity: "error",
    title: "Marketplace-Installation fehlgeschlagen",
    description: `${input.moduleKey} konnte nicht installiert werden.`,
    actor: auditActor(input.actor),
    requestContext: context(input.request, input.actor),
    moduleKey: input.moduleKey,
    marketplaceModuleKey: input.moduleKey,
    entityType: "marketplace_module",
    entityId: input.moduleKey,
    metadata: safeJson({ reason: input.reason ?? "unknown", plan: input.plan ?? null, licenseStatus: input.licenseStatus ?? null })
  })
}
