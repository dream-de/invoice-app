"use client"

import { useState } from "react"
import { Download, Filter, Search, ShieldCheck } from "lucide-react"
import styles from "./ReportsLogs.module.css"

type AuditEvent = {
  type: "login" | "logout" | "update" | "error"
  icon: string
  title: string
  user: string
  role: string
  module: string
  action: string
  ip: string
  browser: string
  device: string
  location: string
  time: string
  status: string
  changes?: Array<{ field: string; before: string; after: string }>
}

const AUDIT_EVENTS: AuditEvent[] = [
  {
    type: "login",
    icon: "🟢",
    title: "Benutzer angemeldet",
    user: "Diki",
    role: "Admin",
    module: "Auth",
    action: "Login",
    ip: "192.168.10.15",
    browser: "Chrome",
    device: "Windows 11",
    location: "Lokales Netzwerk",
    time: "09:44:21",
    status: "Erfolgreich"
  },
  {
    type: "logout",
    icon: "⚫",
    title: "Benutzer abgemeldet",
    user: "Admin",
    role: "Admin",
    module: "Auth",
    action: "Logout",
    ip: "192.168.1.20",
    browser: "Safari",
    device: "macOS",
    location: "Office",
    time: "09:41:02",
    status: "Erfolgreich"
  },
  {
    type: "update",
    icon: "✏️",
    title: "Bankdaten geändert",
    user: "Admin",
    role: "Owner",
    module: "Finanzen",
    action: "Update",
    ip: "192.168.1.15",
    browser: "Chrome",
    device: "Windows 11",
    location: "Lokales Netzwerk",
    time: "09:37:58",
    status: "Aktualisiert",
    changes: [
      { field: "IBAN", before: "DE••••1234", after: "DE••••9876" },
      { field: "Bankname", before: "Alte Bank", after: "Neue Bank" }
    ]
  },
  {
    type: "error",
    icon: "❌",
    title: "API Fehler",
    user: "System",
    role: "System",
    module: "API / Webhooks",
    action: "Error",
    ip: "192.168.1.1",
    browser: "Server",
    device: "Backend",
    location: "Server",
    time: "09:32:10",
    status: "Fehler"
  }
]

const filters = ["Alle", "Login", "Logout", "Update", "Error", "Auth", "Finanzen", "API / Webhooks", "System"]

function typeClass(type: AuditEvent["type"]) {
  if (type === "login") return styles.typeGreen
  if (type === "logout") return styles.typeBlue
  if (type === "update") return styles.typeYellow
  return styles.typeRed
}

function dotClass(type: AuditEvent["type"]) {
  if (type === "login") return styles.green
  if (type === "logout") return styles.blue
  if (type === "update") return styles.yellow
  return styles.red
}

export function LogsPageClient() {
  const [selected, setSelected] = useState(AUDIT_EVENTS[0])

  return (
    <div className={styles.rlPage}>
      <div className={styles.rlHeader}>
        <div>
          <h1>Logs</h1>
          <p>Live Ereignisse, Benutzeraktivitäten und Systemmeldungen</p>
        </div>

        <div className={styles.rlActions}>
          <span className={styles.liveBadge}>● Live</span>
          <button className={styles.rlBtn} type="button">{AUDIT_EVENTS.length} Ereignisse</button>
        </div>
      </div>

      <div className={styles.logsToolbar}>
        <button className={styles.rlBtn} type="button">Heute</button>
        <div className={styles.logsSearch}>
          <Search size={17} />
          <input placeholder="Suche in Logs..." />
        </div>
        <button className={styles.rlBtn} type="button">Alle Benutzer</button>
        <button className={`${styles.rlBtn} ${styles.primary}`} type="button">
          <Filter size={16} />
          Filter
        </button>
      </div>

      <div className={styles.logsFilterRow}>
        {filters.map((filter, index) => (
          <button key={filter} className={index === 0 ? styles.activeFilter : ""} type="button">
            {filter}
          </button>
        ))}
      </div>

      <div className={styles.logsLayout}>
        <div className={styles.logsTimeline}>
          {AUDIT_EVENTS.map((event) => (
            <button
              key={`${event.time}-${event.title}`}
              className={`${styles.logRow} ${selected === event ? styles.activeLog : ""}`}
              onClick={() => setSelected(event)}
              type="button"
            >
              <div className={styles.logTime}>
                <strong>{event.time}</strong>
                <span>Heute</span>
              </div>

              <div className={`${styles.logDot} ${dotClass(event.type)}`} />
              <div className={styles.logAvatar}>{event.icon}</div>

              <div className={styles.logContent}>
                <strong>{event.title}</strong>
                <span>{event.user} · {event.module} · {event.ip}</span>
              </div>

              <small className={`${styles.logType} ${typeClass(event.type)}`}>{event.status}</small>
            </button>
          ))}

          <button className={styles.loadMore} type="button">Weitere Ereignisse laden</button>
        </div>

        <aside className={styles.logDetailCard}>
          <div className={styles.detailHead}>
            <h3>Ereignis Details</h3>
            <ShieldCheck size={20} />
          </div>

          <div className={styles.detailAvatar}>{selected.icon}</div>
          <h4>{selected.title}</h4>
          <p>Heute, 26.06.2026 {selected.time}</p>

          <div className={styles.detailGrid}>
            <span>Benutzer</span><strong>{selected.user}</strong>
            <span>Rolle</span><strong>{selected.role}</strong>
            <span>Modul</span><strong>{selected.module}</strong>
            <span>Aktion</span><strong>{selected.action}</strong>
            <span>IP Adresse</span><strong>{selected.ip}</strong>
            <span>Browser</span><strong>{selected.browser}</strong>
            <span>Gerät</span><strong>{selected.device}</strong>
            <span>Standort</span><strong>{selected.location}</strong>
            <span>Status</span><strong>{selected.status}</strong>
          </div>

          {selected.changes?.length ? (
            <>
              <h4>Änderungen</h4>
              {selected.changes.map((change) => (
                <div className={styles.changeBox} key={change.field}>
                  <strong>{change.field}</strong>
                  <span>Vorher: {change.before}</span>
                  <span>Nachher: {change.after}</span>
                </div>
              ))}
            </>
          ) : null}

          <button className={`${styles.rlBtn} ${styles.primary} ${styles.full}`} type="button">
            <Download size={16} />
            Als CSV exportieren
          </button>
        </aside>
      </div>
    </div>
  )
}
