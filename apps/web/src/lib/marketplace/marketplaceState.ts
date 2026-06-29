import {
  createIntegrationConfiguredEvent,
  createIntegrationConnectedEvent,
  createIntegrationDisconnectedEvent,
  createIntegrationSyncFailedEvent,
  createIntegrationSyncStartedEvent,
  createIntegrationSyncSuccessEvent,
  createMarketplaceInstalledEvent,
  createMarketplaceUninstalledEvent
} from "@/lib/audit/auditEventFactory"
import { logAuditEvent } from "@/lib/audit/auditLogger"
import type { IntegrationLogEvent, IntegrationStatus } from "@/lib/integrations/types"

export type MarketplaceState = {
  installedExtensions: string[]
  installedIntegrations: string[]
  configuredIntegrations: string[]
  connectedIntegrations: string[]
  integrationErrors: string[]
  lastSyncByKey: Record<string, string>
  auditLogs: IntegrationLogEvent[]
}

export type MarketplaceAuditEvent =
  | "marketplace_module_installed"
  | "marketplace_module_uninstalled"
  | "integration_configured"
  | "integration_connected"
  | "integration_disconnected"
  | "integration_sync_started"
  | "integration_sync_success"
  | "integration_sync_failed"

type MarketplaceStateLogEvent = IntegrationLogEvent["event"] | MarketplaceAuditEvent

const initialMarketplaceState: MarketplaceState = {
  installedExtensions: ["datev"],
  installedIntegrations: ["datev"],
  configuredIntegrations: ["datev"],
  connectedIntegrations: [],
  integrationErrors: [],
  lastSyncByKey: {
    datev: "2026-06-29 08:45"
  },
  auditLogs: []
}

let marketplaceState: MarketplaceState = {
  ...initialMarketplaceState,
  installedExtensions: [...initialMarketplaceState.installedExtensions],
  installedIntegrations: [...initialMarketplaceState.installedIntegrations],
  configuredIntegrations: [...initialMarketplaceState.configuredIntegrations],
  connectedIntegrations: [...initialMarketplaceState.connectedIntegrations],
  integrationErrors: [...initialMarketplaceState.integrationErrors],
  lastSyncByKey: { ...initialMarketplaceState.lastSyncByKey },
  auditLogs: []
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function without(values: string[], key: string) {
  return values.filter((value) => value !== key)
}

function now() {
  return new Date().toISOString()
}

function log(event: MarketplaceStateLogEvent, integrationKey: string, message: string, level: IntegrationLogEvent["level"] = "info") {
  const entry: IntegrationLogEvent = {
    id: `${integrationKey}-${event}-${Date.now()}`,
    integrationKey,
    event,
    level,
    message,
    createdAt: now()
  }
  marketplaceState = {
    ...marketplaceState,
    auditLogs: [entry, ...marketplaceState.auditLogs]
  }
  return entry
}

export function getMarketplaceStateSnapshot(): MarketplaceState {
  return {
    ...marketplaceState,
    installedExtensions: [...marketplaceState.installedExtensions],
    installedIntegrations: [...marketplaceState.installedIntegrations],
    configuredIntegrations: [...marketplaceState.configuredIntegrations],
    connectedIntegrations: [...marketplaceState.connectedIntegrations],
    integrationErrors: [...marketplaceState.integrationErrors],
    lastSyncByKey: { ...marketplaceState.lastSyncByKey },
    auditLogs: [...marketplaceState.auditLogs]
  }
}

export function installMarketplaceModule(key: string) {
  marketplaceState = {
    ...marketplaceState,
    installedExtensions: unique([...marketplaceState.installedExtensions, key]),
    installedIntegrations: unique([...marketplaceState.installedIntegrations, key]),
    integrationErrors: without(marketplaceState.integrationErrors, key)
  }
  log("marketplace_module_installed", key, `${key} wurde als Marketplace-Modul installiert.`)
  logAuditEvent(createMarketplaceInstalledEvent(key))
  return getMarketplaceStateSnapshot()
}

export function uninstallMarketplaceModule(key: string) {
  marketplaceState = {
    ...marketplaceState,
    installedExtensions: without(marketplaceState.installedExtensions, key),
    installedIntegrations: without(marketplaceState.installedIntegrations, key),
    configuredIntegrations: without(marketplaceState.configuredIntegrations, key),
    connectedIntegrations: without(marketplaceState.connectedIntegrations, key),
    integrationErrors: without(marketplaceState.integrationErrors, key)
  }
  log("marketplace_module_uninstalled", key, `${key} wurde als Marketplace-Modul entfernt.`, "warning")
  logAuditEvent(createMarketplaceUninstalledEvent(key))
  return getMarketplaceStateSnapshot()
}

export function configureIntegration(key: string) {
  marketplaceState = {
    ...marketplaceState,
    installedIntegrations: unique([...marketplaceState.installedIntegrations, key]),
    configuredIntegrations: unique([...marketplaceState.configuredIntegrations, key]),
    integrationErrors: without(marketplaceState.integrationErrors, key)
  }
  log("integration_configured", key, `${key} wurde lokal konfiguriert.`)
  logAuditEvent(createIntegrationConfiguredEvent(key))
  return getMarketplaceStateSnapshot()
}

export function connectIntegration(key: string) {
  marketplaceState = {
    ...marketplaceState,
    installedIntegrations: unique([...marketplaceState.installedIntegrations, key]),
    configuredIntegrations: unique([...marketplaceState.configuredIntegrations, key]),
    connectedIntegrations: unique([...marketplaceState.connectedIntegrations, key]),
    integrationErrors: without(marketplaceState.integrationErrors, key)
  }
  log("integration_connected", key, `${key} wurde per Mock verbunden.`)
  logAuditEvent(createIntegrationConnectedEvent(key))
  return getMarketplaceStateSnapshot()
}

export function disconnectIntegration(key: string) {
  marketplaceState = {
    ...marketplaceState,
    connectedIntegrations: without(marketplaceState.connectedIntegrations, key)
  }
  log("integration_disconnected", key, `${key} wurde per Mock getrennt.`)
  logAuditEvent(createIntegrationDisconnectedEvent(key))
  return getMarketplaceStateSnapshot()
}

export function syncIntegration(key: string) {
  const started = log("integration_sync_started", key, `${key} Mock-Sync gestartet.`)
  logAuditEvent(createIntegrationSyncStartedEvent(key))
  const syncedAt = now()
  marketplaceState = {
    ...marketplaceState,
    lastSyncByKey: {
      ...marketplaceState.lastSyncByKey,
      [key]: syncedAt
    },
    integrationErrors: without(marketplaceState.integrationErrors, key)
  }
  log("integration_sync_success", key, `${key} Mock-Sync erfolgreich.`)
  logAuditEvent(createIntegrationSyncSuccessEvent(key, undefined, { recordsProcessed: 12 }))
  return {
    state: getMarketplaceStateSnapshot(),
    result: {
      key,
      ok: true,
      status: "connected" as IntegrationStatus,
      startedAt: started.createdAt,
      finishedAt: syncedAt,
      recordsProcessed: 12,
      message: `${key} Mock-Synchronisation erfolgreich.`
    }
  }
}

export function setIntegrationError(key: string) {
  marketplaceState = {
    ...marketplaceState,
    integrationErrors: unique([...marketplaceState.integrationErrors, key])
  }
  log("integration_sync_failed", key, `${key} Mock-Fehler wurde gesetzt.`, "error")
  logAuditEvent(createIntegrationSyncFailedEvent(key, undefined, { reason: "mock_error" }))
  return getMarketplaceStateSnapshot()
}
