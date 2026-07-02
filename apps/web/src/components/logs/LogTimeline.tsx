"use client"

import {
  Braces,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Files,
  FolderKanban,
  Landmark,
  Lock,
  Mail,
  Plug,
  ScanText,
  Server,
  Settings,
  ShoppingBag,
  Store,
  Timer,
  User
} from "lucide-react"
import type { ComponentType } from "react"
import type { UseLiveLogsResult } from "@/hooks/useLiveLogs"
import type { LogEntry, LogLevel, LogModule } from "@/lib/logs/types"

export interface LogTimelineProps {
  logs: LogEntry[]
  selectedLog: LogEntry | null
  loading?: boolean
  pagination: UseLiveLogsResult["pagination"]
  selectLog: UseLiveLogsResult["selectLog"]
  nextPage: UseLiveLogsResult["nextPage"]
  previousPage: UseLiveLogsResult["previousPage"]
  setPage: UseLiveLogsResult["setPage"]
  setPageSize: UseLiveLogsResult["setPageSize"]
}

interface TimelineGroup {
  date: string
  label: string
  items: LogEntry[]
}

const moduleIcons: Record<LogModule, ComponentType<{ size?: number; className?: string }>> = {
  authentication: Lock,
  users: User,
  invoices: FileText,
  quotes: ClipboardList,
  customers: Building2,
  projects: FolderKanban,
  timeTracking: Timer,
  banking: Landmark,
  api: Braces,
  settings: Settings,
  system: Server,
  datev: FileSpreadsheet,
  ocr: ScanText,
  documents: Files,
  shopify: ShoppingBag,
  woocommerce: Store,
  email: Mail,
  backup: Server,
  integrations: Plug
}

const moduleLabels: Record<LogModule, string> = {
  authentication: "Authentifizierung",
  users: "Benutzer",
  invoices: "Rechnungen",
  quotes: "Angebote",
  customers: "Kunden",
  projects: "Projekte",
  timeTracking: "Zeiterfassung",
  banking: "Banking",
  api: "API",
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
  error: "Fehler"
}

const levelClasses: Record<LogLevel, { dot: string; badge: string; icon: string }> = {
  success: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100"
  },
  info: {
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: "bg-blue-50 text-blue-700 ring-blue-100"
  },
  warning: {
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    icon: "bg-amber-50 text-amber-700 ring-amber-100"
  },
  error: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-red-200",
    icon: "bg-red-50 text-red-700 ring-red-100"
  }
}

function dateKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date)
}

function dateLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(date)
}

function timeLabel(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "--:--"
  return new Intl.DateTimeFormat("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(date)
}

function shortRequestId(value: string) {
  if (!value) return "-"
  if (value.length <= 14) return value
  return `${value.slice(0, 8)}...${value.slice(-4)}`
}

function groupedLogs(logs: LogEntry[]): TimelineGroup[] {
  const sorted = [...logs].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  const groups = new Map<string, TimelineGroup>()

  sorted.forEach((log) => {
    const key = dateKey(log.createdAt)
    const existing = groups.get(key)

    if (existing) {
      existing.items.push(log)
      return
    }

    groups.set(key, {
      date: key,
      label: dateLabel(log.createdAt),
      items: [log]
    })
  })

  return Array.from(groups.values())
}

function skeletonRows() {
  return Array.from({ length: 6 }).map((_, index) => (
    <div className="grid animate-pulse gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-[72px_1fr_28px]" key={index}>
      <div className="h-5 w-16 rounded bg-slate-100" />
      <div className="space-y-3">
        <div className="h-5 w-2/5 rounded bg-slate-100" />
        <div className="h-4 w-4/5 rounded bg-slate-100" />
        <div className="h-4 w-3/5 rounded bg-slate-100" />
      </div>
      <div className="h-7 w-7 rounded bg-slate-100" />
    </div>
  ))
}

export function LogTimeline({
  logs,
  selectedLog,
  loading = false,
  pagination,
  selectLog,
  nextPage,
  previousPage,
  setPage,
  setPageSize
}: LogTimelineProps) {
  const groups = groupedLogs(logs)
  const canGoBack = pagination.page > 1
  const canGoForward = pagination.page < pagination.totalPages

  if (loading && logs.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label="Log Timeline wird geladen">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
          <div className="h-9 w-24 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="grid gap-3">{skeletonRows()}</div>
      </section>
    )
  }

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-label="Log Timeline">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-normal text-slate-950">Live-Logs</h2>
          <p className="text-sm font-medium text-slate-500">
            {pagination.totalItems.toLocaleString("de-DE")} Einträge
          </p>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
          Pro Seite
          <select
            value={pagination.pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
      </div>

      {groups.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Server size={22} />
          </div>
          <h3 className="text-base font-semibold text-slate-950">Keine Logs gefunden</h3>
          <p className="mt-1 max-w-sm text-sm font-medium text-slate-500">
            Für die aktuellen Filter wurden keine Live-Logs vom Backend zurückgegeben.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 p-4">
          {groups.map((group) => (
            <div className="grid gap-3" key={group.date}>
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/95 py-1 backdrop-blur">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-400">{group.label}</span>
                <span className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="relative grid gap-3 before:absolute before:left-[92px] before:top-0 before:hidden before:h-full before:w-px before:bg-slate-100 sm:before:block">
                {group.items.map((log) => {
                  const Icon = moduleIcons[log.module]
                  const level = levelClasses[log.level]
                  const active = selectedLog?.id === log.id

                  return (
                    <button
                      type="button"
                      key={log.id}
                      onClick={() => selectLog(log)}
                      className={`grid w-full min-w-0 gap-3 rounded-lg border p-4 text-left transition sm:grid-cols-[72px_minmax(0,1fr)_28px] ${
                        active
                          ? "border-blue-300 bg-blue-50/70 shadow-sm ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:block">
                        <time className="text-sm font-semibold text-slate-700">{timeLabel(log.createdAt)}</time>
                        <span className={`mt-0 inline-block h-2.5 w-2.5 rounded-full sm:mt-4 ${level.dot}`} aria-hidden="true" />
                      </div>

                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${level.icon}`}>
                            <Icon size={17} />
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {moduleLabels[log.module]}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${level.badge}`}>
                            {levelLabels[log.level]}
                          </span>
                          {log.status === "archived" ? (
                            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                              Archiviert
                            </span>
                          ) : null}
                        </div>

                        <div className="grid gap-1">
                          <strong className="truncate text-sm font-semibold text-slate-950">{log.title}</strong>
                          <p className="line-clamp-2 text-sm font-medium text-slate-500">{log.description}</p>
                        </div>

                        <div className="mt-3 grid min-w-0 gap-2 text-xs font-semibold text-slate-500 sm:grid-cols-3">
                          <span className="truncate">{log.actor.name || log.actor.email}</span>
                          <span className="truncate">{log.ipAddress}</span>
                          <span className="truncate">Req. {shortRequestId(log.metadata.requestId)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end text-slate-400">
                        <ChevronRight size={18} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-slate-500">
          Seite {pagination.page.toLocaleString("de-DE")} von {Math.max(pagination.totalPages, 1).toLocaleString("de-DE")}
        </span>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={previousPage}
            disabled={!canGoBack}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Zurück
          </button>
          <button
            type="button"
            onClick={() => setPage(pagination.page)}
            className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700"
          >
            {pagination.page}
          </button>
          <button
            type="button"
            onClick={nextPage}
            disabled={!canGoForward}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Weiter
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  )
}

export default LogTimeline
