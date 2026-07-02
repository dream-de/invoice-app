"use client"

import { Archive, CalendarClock, DownloadCloud, RotateCcw, ShieldCheck } from "lucide-react"
import type { UseLiveLogsResult } from "@/hooks/useLiveLogs"
import type { ArchiveStatistics, LogRetention } from "@/lib/logs/types"

export interface LogArchiveProps {
  archiveStatistics: ArchiveStatistics | null
  archiving?: boolean
  exporting?: boolean
  archiveLogs: UseLiveLogsResult["archiveLogs"]
  restoreArchive: UseLiveLogsResult["restoreArchive"]
  downloadArchive: UseLiveLogsResult["downloadArchive"]
  updateRetentionPolicy: UseLiveLogsResult["updateRetentionPolicy"]
}

const retentionOptions: Array<{ value: LogRetention; label: string }> = [
  { value: 30, label: "30 Tage" },
  { value: 90, label: "90 Tage" },
  { value: 180, label: "180 Tage" },
  { value: 365, label: "365 Tage" },
  { value: "unlimited", label: "Unbegrenzt" }
]

function numberValue(value: number | undefined) {
  return new Intl.NumberFormat("de-DE").format(value ?? 0)
}

function byteValue(value: number | undefined) {
  const bytes = value ?? 0
  if (bytes < 1024) return `${numberValue(bytes)} B`

  const units = ["KB", "MB", "GB", "TB"]
  let size = bytes / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: size >= 10 ? 0 : 1 }).format(size)} ${units[unitIndex]}`
}

function dateValue(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date)
}

function retentionValue(value: LogRetention | undefined) {
  if (value === "unlimited") return "Unbegrenzt"
  if (typeof value === "number") return `${value} Tage`
  return "-"
}

function metric(label: string, value: string, description: string) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <span className="block text-xs font-semibold text-slate-500">{label}</span>
      <strong className="mt-1 block text-xl font-semibold tracking-normal text-slate-950">{value}</strong>
      <small className="mt-1 block text-xs font-medium text-slate-500">{description}</small>
    </article>
  )
}

export function LogArchive({
  archiveStatistics,
  archiving = false,
  exporting = false,
  archiveLogs,
  restoreArchive,
  downloadArchive,
  updateRetentionPolicy
}: LogArchiveProps) {
  const busy = archiving || exporting
  const retention = archiveStatistics?.retention ?? 365

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Log-Archiv">
      <header className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex h-9 items-center gap-2 rounded-lg bg-violet-50 px-3 text-sm font-semibold text-violet-700 ring-1 ring-violet-100">
            <Archive size={14} />
            Log-Archiv
          </div>
          <h2 className="text-lg font-semibold tracking-normal text-slate-950">Archivverwaltung</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Aufbewahrung, Archivgröße und manuelle Log-Archivaktionen.
          </p>
        </div>

        <label className="grid gap-1 text-sm font-semibold text-slate-600 lg:min-w-56">
          Aufbewahrung
          <select
            value={retention}
            onChange={(event) => {
              const value = event.target.value === "unlimited" ? "unlimited" : Number(event.target.value) as LogRetention
              void updateRetentionPolicy(value)
            }}
            disabled={busy}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {retentionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="grid gap-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {metric("Aktive Logs", numberValue(archiveStatistics?.activeLogs), "Durchsuchbare Einträge")}
          {metric("Archivierte Logs", numberValue(archiveStatistics?.archivedLogs), "Im Log-Archiv")}
          {metric("Aktive Loggröße", byteValue(archiveStatistics?.activeSize), "Aktueller Log-Speicher")}
          {metric("Archivgröße", byteValue(archiveStatistics?.archiveSize), "Archivierter Log-Speicher")}
          {metric("Ältester Log", dateValue(archiveStatistics?.oldestLog), "Frühester aktiver Eintrag")}
          {metric("Nächste Archivierung", dateValue(archiveStatistics?.nextArchiveDate), retentionValue(archiveStatistics?.retention))}
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Administrative Log-Aktionen</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Diese Aktionen betreffen ausschließlich Logs und deren Archivstatus.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:w-auto xl:min-w-[520px]">
            <button
              type="button"
              onClick={() => void archiveLogs()}
              disabled={busy}
              className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CalendarClock size={14} />
              {archiving ? "Archiviert..." : "Jetzt archivieren"}
            </button>
            <button
              type="button"
              onClick={() => void downloadArchive()}
              disabled={busy}
              className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <DownloadCloud size={14} />
              {exporting ? "Lädt..." : "Archiv herunterladen"}
            </button>
            <button
              type="button"
              onClick={() => void restoreArchive()}
              disabled={busy}
              className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw size={14} />
              Archiv wiederherstellen
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LogArchive
