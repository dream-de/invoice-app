"use client"

import { CalendarDays, Pause, Play, RotateCcw, Search, Square } from "lucide-react"
import { useMemo, useState } from "react"
import type { UseLiveLogsResult } from "@/hooks/useLiveLogs"
import type { LogLevel, LogModule, LogOutcome } from "@/lib/logs/types"

export interface LogToolbarProps {
  filters: UseLiveLogsResult["filters"]
  liveSettings: UseLiveLogsResult["liveSettings"]
  loading?: boolean
  refreshing?: boolean
  setSearch: UseLiveLogsResult["setSearch"]
  setDateRange: UseLiveLogsResult["setDateRange"]
  setModule: UseLiveLogsResult["setModule"]
  setLevel: UseLiveLogsResult["setLevel"]
  setStatus: UseLiveLogsResult["setStatus"]
  setOutcome: UseLiveLogsResult["setOutcome"]
  setActor: UseLiveLogsResult["setActor"]
  setArchived: UseLiveLogsResult["setArchived"]
  resetFilters: UseLiveLogsResult["resetFilters"]
  refreshLogs: UseLiveLogsResult["refreshLogs"]
  enableLive: UseLiveLogsResult["enableLive"]
  disableLive: UseLiveLogsResult["disableLive"]
  pauseLive: UseLiveLogsResult["pauseLive"]
  resumeLive: UseLiveLogsResult["resumeLive"]
  updateRefreshInterval: UseLiveLogsResult["updateRefreshInterval"]
}

type RangePreset = "today" | "7d" | "30d" | "90d" | "365d" | "custom"

const moduleOptions: Array<{ value: "all" | LogModule; label: string }> = [
  { value: "all", label: "Alle Module" },
  { value: "authentication", label: "Authentifizierung" },
  { value: "users", label: "Benutzer" },
  { value: "invoices", label: "Rechnungen" },
  { value: "quotes", label: "Angebote" },
  { value: "offers", label: "Angebote neu" },
  { value: "customers", label: "Kunden" },
  { value: "projects", label: "Projekte" },
  { value: "timeTracking", label: "Zeiterfassung" },
  { value: "banking", label: "Banking" },
  { value: "api", label: "API" },
  { value: "settings", label: "Einstellungen" },
  { value: "system", label: "System" },
  { value: "datev", label: "DATEV" },
  { value: "ocr", label: "OCR" },
  { value: "documents", label: "Dokumente" },
  { value: "shopify", label: "Shopify" },
  { value: "woocommerce", label: "WooCommerce" },
  { value: "email", label: "E-Mail" },
  { value: "integrations", label: "Integrationen" }
]

const levelOptions: Array<{ value: "all" | LogLevel; label: string }> = [
  { value: "all", label: "Alle Severity" },
  { value: "success", label: "Erfolg" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warnung" },
  { value: "error", label: "Fehler" },
  { value: "critical", label: "Kritisch" }
]

const outcomeOptions: Array<{ value: "all" | LogOutcome; label: string }> = [
  { value: "all", label: "Alle Ergebnisse" },
  { value: "success", label: "Erfolgreich" },
  { value: "failed", label: "Fehlgeschlagen" },
  { value: "blocked", label: "Blockiert" }
]

const categoryChips: Array<{ label: string; modules: LogModule[] }> = [
  { label: "Alle", modules: [] },
  { label: "Sicherheit", modules: ["authentication"] },
  { label: "Benutzer", modules: ["users"] },
  { label: "Dokumente", modules: ["documents", "invoices", "offers", "quotes"] },
  { label: "Finanzen", modules: ["banking", "datev"] },
  { label: "API/Webhooks", modules: ["api", "integrations"] },
  { label: "System", modules: ["settings", "system"] }
]

function isoDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date)
}

function rangeFromPreset(preset: RangePreset) {
  const today = new Date()
  const end = isoDate(today)
  const start = new Date(today)

  if (preset === "today") return { dateFrom: end, dateTo: end }
  if (preset === "7d") start.setDate(today.getDate() - 6)
  if (preset === "30d") start.setDate(today.getDate() - 29)
  if (preset === "90d") start.setDate(today.getDate() - 89)
  if (preset === "365d") start.setDate(today.getDate() - 364)

  return { dateFrom: isoDate(start), dateTo: end }
}

function selectClasses(extra = "") {
  return `h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 ${extra}`
}

function buttonClasses(active = false) {
  return `inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold shadow-sm transition ${
    active
      ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
  }`
}

export function LogToolbar({
  filters,
  liveSettings,
  loading = false,
  refreshing = false,
  setSearch,
  setDateRange,
  setModule,
  setLevel,
  setOutcome,
  resetFilters,
  refreshLogs,
  enableLive,
  disableLive,
  pauseLive,
  resumeLive,
  updateRefreshInterval
}: LogToolbarProps) {
  const [rangePreset, setRangePreset] = useState<RangePreset>("today")
  const customRangeVisible = rangePreset === "custom"
  const liveLabel = useMemo(() => {
    if (!liveSettings.autoRefresh) return "Live aus"
    return liveSettings.paused ? "Fortsetzen" : "Pausieren"
  }, [liveSettings.autoRefresh, liveSettings.paused])

  function updateRange(nextPreset: RangePreset) {
    setRangePreset(nextPreset)

    if (nextPreset === "custom") return

    const range = rangeFromPreset(nextPreset)
    setDateRange(range.dateFrom, range.dateTo)
  }

  function toggleLive() {
    if (!liveSettings.autoRefresh) {
      enableLive()
      return
    }

    if (liveSettings.paused) {
      resumeLive()
      return
    }

    pauseLive()
  }

  return (
    <section className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm" aria-label="Audit Filter">
      <div className="mb-3 flex flex-wrap gap-2">
        {categoryChips.map((chip) => {
          const active = chip.modules.length === 0 ? !filters.module : chip.modules.includes(filters.module as LogModule)
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => setModule(chip.modules[0] ?? null)}
              className={buttonClasses(active)}
            >
              {chip.label}
            </button>
          )
        })}
      </div>
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1.1fr)_150px_minmax(150px,0.8fr)_minmax(130px,0.7fr)_minmax(150px,0.7fr)_auto]">
        <label className="relative block">
          <span className="sr-only">Globale Suche</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Suche nach Aktion, Benutzer, IP..."
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="sr-only">Zeitraum</span>
          <select className={selectClasses("w-full")} value={rangePreset} onChange={(event) => updateRange(event.target.value as RangePreset)}>
            <option value="today">Heute</option>
            <option value="7d">7 Tage</option>
            <option value="30d">30 Tage</option>
            <option value="90d">90 Tage</option>
            <option value="365d">365 Tage</option>
            <option value="custom">Benutzerdefiniert</option>
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Modul</span>
          <select className={selectClasses("w-full")} value={filters.module ?? "all"} onChange={(event) => setModule(event.target.value === "all" ? null : event.target.value as LogModule)}>
            {moduleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Level</span>
          <select className={selectClasses("w-full")} value={filters.level ?? "all"} onChange={(event) => setLevel(event.target.value === "all" ? null : event.target.value as LogLevel)}>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="sr-only">Ergebnis</span>
          <select className={selectClasses("w-full")} value={filters.outcome ?? "all"} onChange={(event) => setOutcome(event.target.value === "all" ? null : event.target.value as LogOutcome)}>
            {outcomeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <div className="flex min-w-0 flex-wrap gap-2 xl:justify-end">
          <button type="button" onClick={toggleLive} className={`${buttonClasses(liveSettings.autoRefresh && !liveSettings.paused)} flex-1 whitespace-nowrap sm:flex-none`}>
            {liveSettings.autoRefresh && !liveSettings.paused ? <Pause size={16} /> : <Play size={16} />}
            {liveLabel}
          </button>
          <button type="button" onClick={disableLive} className={`${buttonClasses(!liveSettings.autoRefresh)} flex-1 whitespace-nowrap sm:flex-none`}>
            <Square size={15} />
            Aus
          </button>
        </div>
      </div>

      {customRangeVisible ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <label className="grid gap-1 text-xs font-semibold text-slate-500">
            Von
            <input
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(event) => setDateRange(event.target.value || null, filters.dateTo)}
              className={selectClasses("w-full")}
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-slate-500">
            Bis
            <input
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(event) => setDateRange(filters.dateFrom, event.target.value || null)}
              className={selectClasses("w-full")}
            />
          </label>
        </div>
      ) : null}

      <div className="mt-3 flex min-w-0 flex-col gap-3 border-t border-slate-100 pt-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
            <CalendarDays size={16} />
            Intervall
            <select
              className={selectClasses("h-9")}
              value={liveSettings.refreshInterval}
              onChange={(event) => updateRefreshInterval(Number(event.target.value))}
              disabled={!liveSettings.autoRefresh}
            >
              <option value={5000}>5 Sek.</option>
              <option value={10000}>10 Sek.</option>
              <option value={30000}>30 Sek.</option>
              <option value={60000}>60 Sek.</option>
            </select>
          </label>
          <span className="text-xs font-medium text-slate-400">
            {loading || refreshing ? "Aktualisierung läuft" : "Filter wirken sofort"}
          </span>
        </div>

        <div className="flex min-w-0 flex-wrap gap-2">
          <button type="button" onClick={resetFilters} className={buttonClasses(false)}>
            <RotateCcw size={16} />
            Filter zurücksetzen
          </button>
        </div>
      </div>
    </section>
  )
}

export default LogToolbar
