import type { AuditEvent, AuditEventInput, AuditEventListener, AuditSource } from "./auditTypes"
import type { AuditEventType } from "./auditTypes"

// TODO: Backend-backed immutable audit log storage implementieren.
const auditEvents: AuditEvent[] = [
  {
    id: "seed-auth-login",
    timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    type: "license_synced",
    source: "billing",
    severity: "success",
    title: "Lizenz synchronisiert",
    description: "Mock-Lizenzdaten wurden fuer das Audit Center initialisiert.",
    actor: { actorId: "mock-system", actorName: "System", actorRole: "Mock" },
    licensePlan: "business",
    ipAddress: "127.0.0.1",
    requestId: "seed-license-sync"
  },
  {
    id: "seed-open-banking-sync",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    type: "open_banking_sync_success",
    source: "open_banking",
    severity: "success",
    title: "Open-Banking-Sync erfolgreich",
    description: "Demo-Transaktionen wurden fuer die Live-Ansicht synchronisiert.",
    actor: { actorId: "mock-system", actorName: "System", actorRole: "Mock" },
    moduleKey: "open_banking",
    integrationKey: "open_banking",
    metadata: { recordsProcessed: 12 }
  },
  {
    id: "seed-marketplace-datev",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    type: "marketplace_module_installed",
    source: "marketplace",
    severity: "success",
    title: "Marketplace-Modul installiert",
    description: "datev wurde als installierte Demo-Erweiterung registriert.",
    actor: { actorId: "mock-system", actorName: "System", actorRole: "Mock" },
    moduleKey: "datev",
    integrationKey: "datev"
  }
]

const listeners = new Set<AuditEventListener>()

function createId(type: string) {
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function sortEvents(events: readonly AuditEvent[]) {
  return [...events].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))
}

function normalizeEvent(event: AuditEvent | AuditEventInput): AuditEvent {
  return {
    ...event,
    id: event.id ?? createId(event.type),
    timestamp: event.timestamp ?? new Date().toISOString()
  }
}

function notifySubscribers() {
  const snapshot = getAuditEvents()
  listeners.forEach((listener) => listener(snapshot))
}

export function logAuditEvent(event: AuditEvent | AuditEventInput) {
  const normalized = normalizeEvent(event)
  auditEvents.unshift(normalized)
  notifySubscribers()
  return normalized
}

export function getAuditEvents() {
  return sortEvents(auditEvents)
}

export function getAuditEventsBySource(source: AuditSource) {
  return getAuditEvents().filter((event) => event.source === source)
}

export function getAuditEventsByType(type: AuditEventType) {
  return getAuditEvents().filter((event) => event.type === type)
}

export function getAuditEventsByModule(moduleKey: string) {
  return getAuditEvents().filter((event) => event.moduleKey === moduleKey)
}

export function clearAuditEvents() {
  auditEvents.splice(0, auditEvents.length)
  notifySubscribers()
}

export function subscribeAuditEvents(listener: AuditEventListener) {
  listeners.add(listener)
  listener(getAuditEvents())
  return () => unsubscribeAuditEvents(listener)
}

export function unsubscribeAuditEvents(listener: AuditEventListener) {
  listeners.delete(listener)
}
