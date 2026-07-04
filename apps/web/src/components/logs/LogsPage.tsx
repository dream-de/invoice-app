"use client"

import { AlertTriangle, ChevronDown, Download, RefreshCw, X } from "lucide-react"
import { useLiveLogs } from "@/hooks/useLiveLogs"
import type { ExportFormat } from "@/lib/logs/types"
import { LogArchive } from "./LogArchive"
import { LogDetails } from "./LogDetails"
import { LogStats } from "./LogStats"
import { LogTimeline } from "./LogTimeline"
import { LogToolbar } from "./LogToolbar"
import styles from "./LogsPage.module.css"

function liveStatus(liveSettings: ReturnType<typeof useLiveLogs>["liveSettings"]) {
  if (!liveSettings.autoRefresh) {
    return {
      label: "Aus",
      dot: "bg-slate-400",
      badge: "border-slate-200 bg-slate-50 text-slate-600"
    }
  }

  if (liveSettings.paused) {
    return {
      label: "Pausiert",
      dot: "bg-amber-500",
      badge: "border-amber-200 bg-amber-50 text-amber-700"
    }
  }

  return {
    label: "Live",
    dot: "bg-emerald-500",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
}

function exportLabel(format: ExportFormat) {
  if (format === "excel") return "Excel"
  return format.toUpperCase()
}

export function LogsPage({ theme = "light" }: { theme?: "dark" | "light" }) {
  const logs = useLiveLogs()
  const status = liveStatus(logs.liveSettings)
  const initialLoading = logs.loading && logs.logs.length === 0

  const exportActions: Array<{ format: ExportFormat; action: () => Promise<void> }> = [
    { format: "csv", action: logs.exportCSV },
    { format: "excel", action: logs.exportExcel },
    { format: "pdf", action: logs.exportPDF },
    { format: "json", action: logs.exportJSON }
  ]

  return (
    <main className={`min-h-screen max-w-full overflow-x-hidden bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8 ${theme === "dark" ? styles.darkLogs : ""}`}>
      <div className="mx-auto flex w-full max-w-full flex-col gap-5 2xl:max-w-[1720px]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950">Audit Center</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Wer was wann geändert hat, inklusive IP, Ergebnis, Objekt und Request-ID.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold ${status.badge}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`} aria-hidden="true" />
              {status.label}
            </span>

            <button
              type="button"
              onClick={() => void logs.refreshLogs()}
              disabled={logs.refreshing}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={16} className={logs.refreshing ? "animate-spin" : ""} />
              {logs.refreshing ? "Aktualisiert..." : "Aktualisieren"}
            </button>

            <div className="group relative">
              <button
                type="button"
                disabled={logs.exporting}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Download size={16} />
                Export
                <ChevronDown size={15} />
              </button>

              <div className="invisible absolute right-0 z-20 mt-2 w-40 rounded-lg border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                {exportActions.map((item) => (
                  <button
                    key={item.format}
                    type="button"
                    onClick={() => void item.action()}
                    className="flex h-9 w-full items-center rounded-md px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {exportLabel(item.format)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {logs.error ? (
          <section className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <p className="min-w-0 flex-1 font-medium">{logs.error}</p>
            <button
              type="button"
              onClick={logs.clearError}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-red-700 hover:bg-red-100"
              aria-label="Fehlermeldung schließen"
            >
              <X size={16} />
            </button>
          </section>
        ) : null}

        {initialLoading ? (
          <section className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-lg border border-slate-200 bg-white" />
              ))}
            </div>
            <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-white" />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="h-[520px] animate-pulse rounded-lg border border-slate-200 bg-white" />
              <div className="h-[520px] animate-pulse rounded-lg border border-slate-200 bg-white" />
            </div>
          </section>
        ) : (
          <>
            <LogStats
              statistics={logs.statistics}
              archiveStatistics={logs.archiveStatistics}
              loading={logs.loading}
            />

            <LogToolbar
              filters={logs.filters}
              liveSettings={logs.liveSettings}
              loading={logs.loading}
              refreshing={logs.refreshing}
              setSearch={logs.setSearch}
              setDateRange={logs.setDateRange}
              setModule={logs.setModule}
              setLevel={logs.setLevel}
              setStatus={logs.setStatus}
              setOutcome={logs.setOutcome}
              setActor={logs.setActor}
              setArchived={logs.setArchived}
              resetFilters={logs.resetFilters}
              refreshLogs={logs.refreshLogs}
              enableLive={logs.enableLive}
              disableLive={logs.disableLive}
              pauseLive={logs.pauseLive}
              resumeLive={logs.resumeLive}
              updateRefreshInterval={logs.updateRefreshInterval}
            />

            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
              <LogTimeline
                logs={logs.logs}
                selectedLog={logs.selectedLog}
                loading={logs.loading}
                pagination={logs.pagination}
                selectLog={logs.selectLog}
                nextPage={logs.nextPage}
                previousPage={logs.previousPage}
                setPage={logs.setPage}
                setPageSize={logs.setPageSize}
              />

              <LogDetails
                log={logs.selectedLog}
                clearSelection={logs.clearSelection}
              />
            </section>

            <LogArchive
              archiveStatistics={logs.archiveStatistics}
              archiving={logs.archiving}
              exporting={logs.exporting}
              archiveLogs={logs.archiveLogs}
              restoreArchive={logs.restoreArchive}
              downloadArchive={logs.downloadArchive}
              updateRetentionPolicy={logs.updateRetentionPolicy}
            />
          </>
        )}
      </div>
    </main>
  )
}

export default LogsPage
