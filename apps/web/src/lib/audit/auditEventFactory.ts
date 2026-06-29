import type { AuditActor, AuditEvent, AuditEventInput, AuditMetadata } from "./auditTypes"

const systemActor: AuditActor = {
  actorId: "mock-system",
  actorName: "System",
  actorRole: "Mock"
}

function createId(type: string) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createAuditEvent(input: AuditEventInput): AuditEvent {
  return {
    ...input,
    id: input.id ?? createId(input.type),
    timestamp: input.timestamp ?? new Date().toISOString()
  }
}

function withKey(key: string): AuditMetadata {
  return { key }
}

export function createMarketplaceInstalledEvent(moduleKey: string, actor: AuditActor = systemActor) {
  return createAuditEvent({
    type: "marketplace_module_installed",
    source: "marketplace",
    severity: "success",
    title: "Marketplace-Modul installiert",
    description: `${moduleKey} wurde als Marketplace-Modul installiert.`,
    actor,
    moduleKey,
    metadata: withKey(moduleKey)
  })
}

export function createMarketplaceUninstalledEvent(moduleKey: string, actor: AuditActor = systemActor) {
  return createAuditEvent({
    type: "marketplace_module_uninstalled",
    source: "marketplace",
    severity: "warning",
    title: "Marketplace-Modul deinstalliert",
    description: `${moduleKey} wurde als Marketplace-Modul entfernt.`,
    actor,
    moduleKey,
    metadata: withKey(moduleKey)
  })
}

export function createIntegrationConfiguredEvent(integrationKey: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "integration_configured",
    source: "integration",
    severity: "success",
    title: "Integration konfiguriert",
    description: `${integrationKey} wurde konfiguriert.`,
    actor,
    integrationKey,
    moduleKey: integrationKey,
    metadata
  })
}

export function createIntegrationConnectedEvent(integrationKey: string, actor: AuditActor = systemActor) {
  return createAuditEvent({
    type: "integration_connected",
    source: "integration",
    severity: "success",
    title: "Integration verbunden",
    description: `${integrationKey} wurde verbunden.`,
    actor,
    integrationKey,
    moduleKey: integrationKey
  })
}

export function createIntegrationDisconnectedEvent(integrationKey: string, actor: AuditActor = systemActor) {
  return createAuditEvent({
    type: "integration_disconnected",
    source: "integration",
    severity: "warning",
    title: "Integration getrennt",
    description: `${integrationKey} wurde getrennt.`,
    actor,
    integrationKey,
    moduleKey: integrationKey
  })
}

export function createIntegrationSyncStartedEvent(integrationKey: string, actor: AuditActor = systemActor) {
  return createAuditEvent({
    type: "integration_sync_started",
    source: "integration",
    severity: "info",
    title: "Integrations-Sync gestartet",
    description: `${integrationKey} Mock-Synchronisation wurde gestartet.`,
    actor,
    integrationKey,
    moduleKey: integrationKey
  })
}

export function createIntegrationSyncSuccessEvent(integrationKey: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "integration_sync_success",
    source: "integration",
    severity: "success",
    title: "Integrations-Sync erfolgreich",
    description: `${integrationKey} Mock-Synchronisation war erfolgreich.`,
    actor,
    integrationKey,
    moduleKey: integrationKey,
    metadata
  })
}

export function createIntegrationSyncFailedEvent(integrationKey: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "integration_sync_failed",
    source: "integration",
    severity: "error",
    title: "Integrations-Sync fehlgeschlagen",
    description: `${integrationKey} Mock-Synchronisation ist fehlgeschlagen.`,
    actor,
    integrationKey,
    moduleKey: integrationKey,
    metadata
  })
}

export function createOpenBankingBankConnectedEvent(bankName: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "open_banking_bank_connected",
    source: "open_banking",
    severity: "success",
    title: "Bank verbunden",
    description: `${bankName} wurde per Open Banking verbunden.`,
    actor,
    moduleKey: "open_banking",
    integrationKey: "open_banking",
    metadata
  })
}

export function createOpenBankingBankDisconnectedEvent(bankAccountId: string, actor: AuditActor = systemActor) {
  return createAuditEvent({
    type: "open_banking_bank_disconnected",
    source: "open_banking",
    severity: "warning",
    title: "Bank getrennt",
    description: `Bankkonto ${bankAccountId} wurde getrennt.`,
    actor,
    moduleKey: "open_banking",
    integrationKey: "open_banking",
    metadata: { bankAccountId }
  })
}

export function createOpenBankingSyncStartedEvent(scope: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "open_banking_sync_started",
    source: "open_banking",
    severity: "info",
    title: "Open-Banking-Sync gestartet",
    description: `Open-Banking-Sync wurde fuer ${scope} gestartet.`,
    actor,
    moduleKey: "open_banking",
    integrationKey: "open_banking",
    metadata
  })
}

export function createOpenBankingSyncSuccessEvent(scope: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "open_banking_sync_success",
    source: "open_banking",
    severity: "success",
    title: "Open-Banking-Sync erfolgreich",
    description: `Open-Banking-Sync fuer ${scope} war erfolgreich.`,
    actor,
    moduleKey: "open_banking",
    integrationKey: "open_banking",
    metadata
  })
}

export function createOpenBankingSyncFailedEvent(scope: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "open_banking_sync_failed",
    source: "open_banking",
    severity: "error",
    title: "Open-Banking-Sync fehlgeschlagen",
    description: `Open-Banking-Sync fuer ${scope} ist fehlgeschlagen.`,
    actor,
    moduleKey: "open_banking",
    integrationKey: "open_banking",
    metadata
  })
}

export function createOpenBankingPaymentMatchedEvent(transactionId: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "open_banking_payment_matched",
    source: "open_banking",
    severity: "success",
    title: "Zahlung zugeordnet",
    description: `Transaktion ${transactionId} wurde einer Rechnung zugeordnet.`,
    actor,
    moduleKey: "open_banking",
    integrationKey: "open_banking",
    metadata
  })
}

export function createOpenBankingConsentRefreshedEvent(bankAccountId: string, actor: AuditActor = systemActor) {
  return createAuditEvent({
    type: "open_banking_consent_refreshed",
    source: "open_banking",
    severity: "success",
    title: "Bank-Consent erneuert",
    description: `Consent fuer Bankkonto ${bankAccountId} wurde erneuert.`,
    actor,
    moduleKey: "open_banking",
    integrationKey: "open_banking",
    metadata: { bankAccountId }
  })
}

export function createModuleGateDeniedEvent(moduleKey: string, reason: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "module_access_denied",
    source: "module_engine",
    severity: "warning",
    title: "Modulzugriff verweigert",
    description: `Zugriff auf ${moduleKey} wurde durch das Module Gate verweigert.`,
    actor,
    moduleKey,
    metadata: { reason, ...metadata }
  })
}

export function createLicenseSyncedEvent(plan: string, actor: AuditActor = systemActor, metadata?: AuditMetadata) {
  return createAuditEvent({
    type: "license_synced",
    source: "billing",
    severity: "success",
    title: "Lizenz synchronisiert",
    description: `Lizenzstatus fuer ${plan} wurde synchronisiert.`,
    actor,
    licensePlan: plan,
    metadata
  })
}

export function createFeatureFlagChangedEvent(featureFlag: string, enabled: boolean, actor: AuditActor = systemActor) {
  return createAuditEvent({
    type: "feature_flag_changed",
    source: "system",
    severity: "info",
    title: "Feature Flag geaendert",
    description: `${featureFlag} wurde ${enabled ? "aktiviert" : "deaktiviert"}.`,
    actor,
    featureFlag,
    after: { enabled }
  })
}
