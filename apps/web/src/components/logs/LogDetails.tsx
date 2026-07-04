"use client"

import { Copy, Download, FileJson, FileText, X } from "lucide-react"
import type { LogEntry, LogLevel, LogModule, LogStatus } from "@/lib/logs/types"
import { exportSingleLogToCsv } from "@/lib/logs/csvExport"
import { exportSingleLogToJson } from "@/lib/logs/jsonExport"
import { formatLogDateTime, truncateMiddle } from "@/lib/logs/logFormatter"
import { JsonViewer } from "./JsonViewer"

export interface LogDetailsProps {
  log: LogEntry | null
  clearSelection: () => void
}

const moduleLabels: Record<LogModule, string> = {
  authentication: "Authentifizierung",
  users: "Benutzer",
  invoices: "Rechnungen",
  quotes: "Angebote",
  offers: "Angebote",
  customers: "Kunden",
  projects: "Projekte",
  timeTracking: "Zeiterfassung",
  banking: "Banking",
  api: "API/Webhooks",
  settings: "Einstellungen",
  system: "System",
  datev: "DATEV",
  ocr: "OCR",
  documents: "Dokumente",
  shopify: "Shopify",
  woocommerce: "WooCommerce",
  email: "E-Mail",
  backup: "Backup",
  integrations: "Integrationen"
}

const levelLabels: Record<LogLevel, string> = {
  success: "Erfolg",
  info: "Info",
  warning: "Warnung",
  error: "Fehler",
  critical: "Kritisch"
}

const statusLabels: Record<LogStatus, string> = {
  active: "Aktiv",
  archived: "Archiviert"
}

const levelClasses: Record<LogLevel, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  info: "bg-blue-50 text-blue-700 ring-blue-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  error: "bg-red-50 text-red-700 ring-red-200",
  critical: "bg-rose-100 text-rose-800 ring-rose-200"
}

const SENSITIVE_KEY_PATTERN = /(password|secret|token|api[_-]?key|authorization|cookie|credential|iban|bic|bank)/i

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

function diffRows(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  if (!before || !after) return []
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort()
  return keys
    .filter((key) => JSON.stringify(before[key] ?? null) !== JSON.stringify(after[key] ?? null))
    .map((key) => ({
      key,
      before: SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : formatValue(before[key]),
      after: SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : formatValue(after[key])
    }))
}

function DetailRow({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="grid grid-cols-[118px_minmax(0,1fr)] gap-3 border-b border-slate-100 py-2 last:border-b-0">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="truncate" title={value}>{value || "-"}</span>
        {copyable ? (
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(value)}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={label + " kopieren"}
          >
            <Copy size={13} />
          </button>
        ) : null}
      </dd>
    </div>
  )
}

export function LogDetails({ log, clearSelection }: LogDetailsProps) {
  if (!log) {
    return (
      <aside className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm xl:sticky xl:top-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <FileText size={22} />
        </div>
        <h2 className="text-base font-semibold text-slate-950">Kein Ereignis ausgewählt</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Wähle einen Eintrag, um Ereignisdetails, Benutzer, Objekt und Diff zu sehen.
        </p>
      </aside>
    )
  }

  const rows = diffRows(log.before, log.after)
  const objectLabel = [log.entityType, log.entityLabel || log.entityId].filter(Boolean).join(" · ")

  return (
    <aside className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 p-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={"rounded-full px-2.5 py-1 text-xs font-semibold ring-1 " + levelClasses[log.level]}>
              {levelLabels[log.level]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {moduleLabels[log.module]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {log.outcome}
            </span>
          </div>
          <h2 className="truncate text-lg font-semibold tracking-normal text-slate-950">{log.action}</h2>
          <p className="mt-1 line-clamp-3 text-sm font-medium text-slate-500">{log.description || log.title}</p>
        </div>
        <button
          type="button"
          onClick={clearSelection}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          aria-label="Details schließen"
        >
          <X size={17} />
        </button>
      </header>

      <div className="grid min-w-0 gap-4 p-4">
        <dl className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <DetailRow label="Zeit" value={formatLogDateTime(log.createdAt)} />
          <DetailRow label="Aktion" value={log.action} />
          <DetailRow label="Modul" value={moduleLabels[log.module]} />
          <DetailRow label="Ergebnis" value={log.outcome} />
          <DetailRow label="Quelle" value={log.source} />
          <DetailRow label="Status" value={statusLabels[log.status]} />
          <DetailRow label="Benutzer" value={log.actor.name} />
          <DetailRow label="E-Mail" value={log.actor.email} />
          <DetailRow label="Rolle" value={log.actor.role} />
          <DetailRow label="IP" value={log.ipAddress} />
          <DetailRow label="User-Agent" value={log.metadata.userAgent || (log.browser.name + " " + log.browser.version).trim()} />
          <DetailRow label="Request-ID" value={truncateMiddle(log.metadata.requestId)} copyable />
          <DetailRow label="Objekt" value={objectLabel} />
          <DetailRow label="Entity-ID" value={truncateMiddle(log.entityId)} copyable />
          <DetailRow label="Archiv" value={log.archived ? "Archiviert" + (log.archivedAt ? " am " + formatLogDateTime(log.archivedAt) : "") : "Aktiv"} />
        </dl>

        <section className="rounded-lg border border-slate-100 bg-white p-3">
          <h3 className="mb-2 text-sm font-semibold text-slate-950">Vorher/Nachher-Diff</h3>
          {rows.length ? (
            <div className="max-h-64 overflow-auto rounded-lg border border-slate-100">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Feld</th>
                    <th className="px-3 py-2">Vorher</th>
                    <th className="px-3 py-2">Nachher</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-semibold text-slate-700">{row.key}</td>
                      <td className="max-w-48 truncate px-3 py-2 text-slate-600" title={row.before}>{row.before}</td>
                      <td className="max-w-48 truncate px-3 py-2 text-slate-900" title={row.after}>{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-500">Für dieses Ereignis liegen keine Feldänderungen vor.</p>
          )}
        </section>

        <JsonViewer value={log} title="Rohdaten JSON" maxHeight="14rem" />

        <div className="grid min-w-0 grid-cols-2 gap-2">
          <button type="button" onClick={() => exportSingleLogToJson(log)} className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <FileJson size={16} />
            JSON
          </button>
          <button type="button" onClick={() => exportSingleLogToCsv(log)} className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>
    </aside>
  )
}

export default LogDetails
