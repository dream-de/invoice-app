"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Filter, Search, ShieldCheck } from "lucide-react"
import { fetchAuditLogsWithFallback } from "@/lib/audit/auditApiClient"
import { getAuditEvents, subscribeAuditEvents, unsubscribeAuditEvents } from "@/lib/audit/auditLogger"
import type { AuditEvent, AuditSeverity, AuditSource } from "@/lib/audit/auditTypes"
import styles from "./ReportsLogs.module.css"

type AuditFilter =
  | "Alle"
  | "Login"
  | "Logout"
  | "Update"
  | "Error"
  | "Auth"
  | "Finanzen"
  | "API / Webhooks"
  | "System"

const filters: AuditFilter[] = ["Alle", "Login", "Logout", "Update", "Error", "Auth", "Finanzen", "API / Webhooks", "System"]

const sourceLabels: Record<AuditSource, string> = {
  marketplace: "Marketplace",
  integration: "Integrationen",
  open_banking: "Open Banking",
  module_engine: "Module Engine",
  auth: "Auth",
  billing: "Billing",
  finance: "Finanzen",
  api: "API / Webhooks",
  system: "System"
}

const severityLabels: Record<AuditSeverity, string> = {
  info: "Info",
  success: "Erfolgreich",
  warning: "Warnung",
  error: "Fehler",
  critical: "Kritisch"
}

function typeClass(severity: AuditSeverity) {
  if (severity === "success") return styles.typeGreen
  if (severity === "info") return styles.typeBlue
  if (severity === "warning") return styles.typeYellow
  return styles.typeRed
}

function dotClass(severity: AuditSeverity) {
  if (severity === "success") return styles.green
  if (severity === "info") return styles.blue
  if (severity === "warning") return styles.yellow
  return styles.red
}

function iconFor(event: AuditEvent) {
  if (event.source === "marketplace") return "MP"
  if (event.source === "integration") return "IN"
  if (event.source === "open_banking") return "OB"
  if (event.source === "module_engine") return "ME"
  if (event.source === "auth") return "AU"
  if (event.source === "billing") return "BI"
  if (event.source === "finance") return "FI"
  if (event.source === "api") return "API"
  return "SY"
}

function matchesFilter(event: AuditEvent, filter: AuditFilter) {
  if (filter === "Alle") return true
  const type = event.type.toLowerCase()
  const title = event.title.toLowerCase()
  const description = event.description.toLowerCase()
  const source = event.source
  const moduleKey = event.moduleKey?.toLowerCase() ?? ""
  const integrationKey = event.integrationKey?.toLowerCase() ?? ""

  if (filter === "Login") return type.includes("login") || title.includes("angemeldet") || description.includes("angemeldet")
  if (filter === "Logout") return type.includes("logout") || title.includes("abgemeldet") || description.includes("abgemeldet")
  if (filter === "Update") return type.includes("update") || type.includes("changed") || title.includes("geändert") || title.includes("aktualisiert")
  if (filter === "Error") return event.severity === "error" || event.severity === "critical" || type.includes("failed") || title.includes("fehler")
  if (filter === "Auth") return source === "auth" || type.startsWith("auth") || moduleKey === "auth"
  if (filter === "Finanzen") return source === "finance" || source === "open_banking" || moduleKey.includes("finance") || moduleKey.includes("bank") || integrationKey === "open_banking"
  if (filter === "API / Webhooks") return source === "api" || moduleKey.includes("api") || moduleKey.includes("webhook") || integrationKey.includes("webhook")
  if (filter === "System") return source === "system" || source === "module_engine" || source === "billing"

  return false
}

function matchesSearch(event: AuditEvent, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const metadataValues = [
    ...Object.entries(event.metadata ?? {}).flat(),
    ...Object.entries(event.before ?? {}).flat(),
    ...Object.entries(event.after ?? {}).flat()
  ].map((value) => String(value))

  const fields = [
    event.id,
    event.type,
    event.source,
    event.severity,
    event.title,
    event.description,
    sourceLabels[event.source],
    severityLabels[event.severity],
    event.actor.actorName,
    event.actor.actorRole,
    event.actor.actorId,
    event.moduleKey,
    event.integrationKey,
    event.licensePlan,
    event.featureFlag,
    event.ipAddress,
    event.requestId,
    ...metadataValues
  ]

  return fields.some((field) => String(field ?? "").toLowerCase().includes(normalizedQuery))
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat("de-DE", { timeStyle: "medium" }).format(new Date(timestamp))
}

function formatDateTime(timestamp: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(timestamp))
}

function metadataRows(values: AuditEvent["metadata"]) {
  if (!values) return []
  return Object.entries(values)
}

export function LogsPageClient() {
  const [events, setEvents] = useState<readonly AuditEvent[]>(() => getAuditEvents())
  const [activeFilter, setActiveFilter] = useState<AuditFilter>("Alle")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(events[0]?.id ?? null)

  useEffect(() => {
    const listener = (nextEvents: readonly AuditEvent[]) => {
      setEvents(nextEvents)
      setSelectedId((currentId) => currentId ?? nextEvents[0]?.id ?? null)
    }

    subscribeAuditEvents(listener)
    fetchAuditLogsWithFallback({ limit: 100 })
      .then((result) => {
        setEvents(result.logs)
        setSelectedId((currentId) => currentId ?? result.logs[0]?.id ?? null)
      })
      .catch(() => {
        setEvents(getAuditEvents())
      })
    return () => unsubscribeAuditEvents(listener)
  }, [])

  const visibleEvents = useMemo(
    () => events.filter((event) => matchesFilter(event, activeFilter) && matchesSearch(event, query)),
    [activeFilter, events, query]
  )

  const selected = visibleEvents.find((event) => event.id === selectedId) ?? visibleEvents[0] ?? events[0] ?? null

  return (
    <div className={styles.rlPage}>
      <div className={styles.rlHeader}>
        <div>
          <h1>Logs</h1>
          <p>Live Ereignisse, Benutzeraktivitäten und Systemmeldungen</p>
        </div>

        <div className={styles.rlActions}>
          <span className={styles.liveBadge}>● Live</span>
          <button className={styles.rlBtn} type="button">{events.length} Ereignisse</button>
        </div>
      </div>

      <div className={styles.logsToolbar}>
        <button className={styles.rlBtn} type="button">Heute</button>
        <div className={styles.logsSearch}>
          <Search size={17} />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Suche in Logs..."
            value={query}
          />
        </div>
        <button className={styles.rlBtn} type="button">Alle Benutzer</button>
        <button className={`${styles.rlBtn} ${styles.primary}`} type="button">
          <Filter size={16} />
          Filter
        </button>
      </div>

      <div className={styles.logsFilterRow}>
        {filters.map((filter) => (
          <button
            key={filter}
            className={filter === activeFilter ? styles.activeFilter : ""}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      <div className={styles.logsLayout}>
        <div className={styles.logsTimeline}>
          {visibleEvents.map((event) => (
            <button
              key={event.id}
              className={`${styles.logRow} ${selected?.id === event.id ? styles.activeLog : ""}`}
              onClick={() => setSelectedId(event.id)}
              type="button"
            >
              <div className={styles.logTime}>
                <strong>{formatTime(event.timestamp)}</strong>
                <span>Heute</span>
              </div>

              <div className={`${styles.logDot} ${dotClass(event.severity)}`} />
              <div className={styles.logAvatar}>{iconFor(event)}</div>

              <div className={styles.logContent}>
                <strong>{event.title}</strong>
                <span>{event.actor.actorName} · {sourceLabels[event.source]} · {event.moduleKey ?? event.integrationKey ?? "System"}</span>
              </div>

              <small className={`${styles.logType} ${typeClass(event.severity)}`}>{severityLabels[event.severity]}</small>
            </button>
          ))}

          {visibleEvents.length === 0 ? (
            <button className={styles.loadMore} type="button">Keine Ereignisse gefunden</button>
          ) : (
            <button className={styles.loadMore} type="button">Weitere Ereignisse laden</button>
          )}
        </div>

        <aside className={styles.logDetailCard}>
          {selected ? (
            <>
              <div className={styles.detailHead}>
                <h3>Ereignis Details</h3>
                <ShieldCheck size={20} />
              </div>

              <div className={styles.detailAvatar}>{iconFor(selected)}</div>
              <h4>{selected.title}</h4>
              <p>{formatDateTime(selected.timestamp)}</p>

              <div className={styles.detailGrid}>
                <span>Actor</span><strong>{selected.actor.actorName}</strong>
                <span>Rolle</span><strong>{selected.actor.actorRole}</strong>
                <span>Quelle</span><strong>{sourceLabels[selected.source]}</strong>
                <span>Typ</span><strong>{selected.type}</strong>
                <span>Modul</span><strong>{selected.moduleKey ?? "-"}</strong>
                <span>Integration</span><strong>{selected.integrationKey ?? "-"}</strong>
                <span>IP Adresse</span><strong>{selected.ipAddress ?? "-"}</strong>
                <span>Request ID</span><strong>{selected.requestId ?? "-"}</strong>
                <span>Status</span><strong>{severityLabels[selected.severity]}</strong>
              </div>

              <h4>Beschreibung</h4>
              <div className={styles.changeBox}>
                <span>{selected.description}</span>
              </div>

              {metadataRows(selected.metadata).length ? (
                <>
                  <h4>Metadata</h4>
                  {metadataRows(selected.metadata).map(([key, value]) => (
                    <div className={styles.changeBox} key={key}>
                      <strong>{key}</strong>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </>
              ) : null}

              {metadataRows(selected.before).length || metadataRows(selected.after).length ? (
                <>
                  <h4>Before / After</h4>
                  {metadataRows(selected.before).map(([key, value]) => (
                    <div className={styles.changeBox} key={`before-${key}`}>
                      <strong>{key}</strong>
                      <span>Vorher: {String(value)}</span>
                      <span>Nachher: {String(selected.after?.[key] ?? "-")}</span>
                    </div>
                  ))}
                  {metadataRows(selected.after)
                    .filter(([key]) => !selected.before?.[key])
                    .map(([key, value]) => (
                      <div className={styles.changeBox} key={`after-${key}`}>
                        <strong>{key}</strong>
                        <span>Vorher: -</span>
                        <span>Nachher: {String(value)}</span>
                      </div>
                    ))}
                </>
              ) : null}

              <button className={`${styles.rlBtn} ${styles.primary} ${styles.full}`} type="button">
                <Download size={16} />
                Als CSV exportieren
              </button>
            </>
          ) : (
            <>
              <div className={styles.detailHead}>
                <h3>Ereignis Details</h3>
                <ShieldCheck size={20} />
              </div>
              <p>Keine Audit-Ereignisse vorhanden.</p>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
