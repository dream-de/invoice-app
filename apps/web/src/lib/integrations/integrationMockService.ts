import {
  createAuditEvent,
  createIntegrationConfiguredEvent,
  createIntegrationConnectedEvent,
  createIntegrationDisconnectedEvent,
  createIntegrationSyncStartedEvent,
  createIntegrationSyncSuccessEvent
} from "@/lib/audit/auditEventFactory"
import { logAuditEvent } from "@/lib/audit/auditLogger"
import { getIntegrationByKey } from "./integrationEngine"
import type { IntegrationLogEvent, IntegrationSyncResult } from "./types"

const mockLogs: IntegrationLogEvent[] = []

function now() {
  return new Date().toISOString()
}

function appendLog(integrationKey: string, event: IntegrationLogEvent["event"], message: string, level: IntegrationLogEvent["level"] = "info") {
  const log: IntegrationLogEvent = {
    id: `${integrationKey}-${event}-${Date.now()}`,
    integrationKey,
    event,
    level,
    message,
    createdAt: now()
  }
  mockLogs.unshift(log)
  return log
}

export async function installIntegration(key: string) {
  const integration = getIntegrationByKey(key)
  appendLog(key, "integration_installed", `${integration?.name ?? key} wurde als Mock installiert.`)
  logAuditEvent(createAuditEvent({
    type: "integration_installed",
    source: "integration",
    severity: "success",
    title: "Integration installiert",
    description: `${integration?.name ?? key} wurde als Mock installiert.`,
    actor: { actorId: "mock-system", actorName: "System", actorRole: "Mock" },
    integrationKey: key,
    moduleKey: integration?.marketplaceModuleKey ?? key
  }))
  return { ok: true, key, status: "installed" as const }
}

export async function configureIntegration(key: string, settings: Record<string, string>) {
  appendLog(key, "integration_configured", `${key} wurde mit ${Object.keys(settings).length} Mock-Einstellungen konfiguriert.`)
  logAuditEvent(createIntegrationConfiguredEvent(key, undefined, { settingCount: Object.keys(settings).length }))
  return { ok: true, key, status: "configured" as const, settings: Object.keys(settings) }
}

export async function connectIntegration(key: string) {
  appendLog(key, "integration_connected", `${key} wurde per Mock verbunden.`)
  logAuditEvent(createIntegrationConnectedEvent(key))
  return { ok: true, key, status: "connected" as const }
}

export async function disconnectIntegration(key: string) {
  appendLog(key, "integration_disconnected", `${key} wurde per Mock getrennt.`)
  logAuditEvent(createIntegrationDisconnectedEvent(key))
  return { ok: true, key, status: "installed" as const }
}

export async function syncIntegration(key: string): Promise<IntegrationSyncResult> {
  const startedAt = now()
  appendLog(key, "integration_sync_started", `${key} Mock-Synchronisation gestartet.`)
  logAuditEvent(createIntegrationSyncStartedEvent(key))
  const result: IntegrationSyncResult = {
    key,
    ok: true,
    status: "connected",
    startedAt,
    finishedAt: now(),
    recordsProcessed: 12,
    message: `${key} Mock-Synchronisation erfolgreich.`
  }
  appendLog(key, "integration_sync_success", result.message)
  logAuditEvent(createIntegrationSyncSuccessEvent(key, undefined, { recordsProcessed: result.recordsProcessed }))
  return result
}

export async function testConnection(key: string) {
  appendLog(key, "integration_test_success", `${key} Mock-Verbindungstest erfolgreich.`)
  logAuditEvent(createAuditEvent({
    type: "integration_test_success",
    source: "integration",
    severity: "success",
    title: "Integrationstest erfolgreich",
    description: `${key} Mock-Verbindungstest erfolgreich.`,
    actor: { actorId: "mock-system", actorName: "System", actorRole: "Mock" },
    integrationKey: key,
    moduleKey: key,
    metadata: { latencyMs: 42 }
  }))
  return { ok: true, key, status: "connected" as const, latencyMs: 42 }
}

export async function getIntegrationLogs(key: string) {
  const existing = mockLogs.filter((log) => log.integrationKey === key)
  if (existing.length) return existing

  return [
    appendLog(key, "integration_test_success", `${key} Mock-Log initialisiert.`),
    appendLog(key, "integration_configured", `${key} Konfiguration ist vorbereitet.`)
  ]
}
