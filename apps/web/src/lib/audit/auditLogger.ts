import type { AuditEvent, AuditEventInput, AuditEventListener, AuditSource } from "./auditTypes"
import type { AuditEventType } from "./auditTypes"

// TODO: Backend-backed immutable audit log storage implementieren.
const auditEvents: AuditEvent[] = []

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
