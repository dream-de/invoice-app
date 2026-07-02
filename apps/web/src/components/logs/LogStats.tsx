import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  HardDrive,
  ShieldAlert
} from "lucide-react"
import type { ComponentType } from "react"
import type { ArchiveStatistics, LogRetention, LogStatistics } from "@/lib/logs/types"

export interface LogStatsProps {
  statistics: LogStatistics | null
  archiveStatistics: ArchiveStatistics | null
  loading?: boolean
}

type StatTone = "green" | "red" | "yellow" | "blue" | "violet" | "slate"

interface StatCard {
  title: string
  value: string
  description: string
  tone: StatTone
  icon: ComponentType<{ size?: number; className?: string }>
}

const toneClasses: Record<StatTone, { card: string; icon: string; value: string }> = {
  green: {
    card: "border-emerald-100 bg-emerald-50/45",
    icon: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-700"
  },
  red: {
    card: "border-red-100 bg-red-50/55",
    icon: "bg-red-100 text-red-700",
    value: "text-red-700"
  },
  yellow: {
    card: "border-amber-100 bg-amber-50/60",
    icon: "bg-amber-100 text-amber-700",
    value: "text-amber-700"
  },
  blue: {
    card: "border-blue-100 bg-blue-50/45",
    icon: "bg-blue-100 text-blue-700",
    value: "text-blue-700"
  },
  violet: {
    card: "border-violet-100 bg-violet-50/45",
    icon: "bg-violet-100 text-violet-700",
    value: "text-violet-700"
  },
  slate: {
    card: "border-slate-200 bg-white",
    icon: "bg-slate-100 text-slate-700",
    value: "text-slate-950"
  }
}

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

function retentionValue(retention: LogRetention | undefined) {
  if (retention === "unlimited") return "Unbegrenzt"
  if (typeof retention === "number") return `${retention} Tage`
  return "-"
}

function skeletonCards() {
  return Array.from({ length: 7 }).map((_, index) => (
    <article
      aria-hidden="true"
      className="min-h-24 animate-pulse rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
      key={index}
    >
      <div className="mb-4 h-10 w-10 rounded-lg bg-slate-100" />
      <div className="mb-3 h-3 w-20 rounded bg-slate-100" />
      <div className="h-6 w-28 rounded bg-slate-100" />
    </article>
  ))
}

export function LogStats({ statistics, archiveStatistics, loading = false }: LogStatsProps) {
  if (loading && !statistics && !archiveStatistics) {
    return (
      <section className="grid min-w-0 max-w-full gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7" aria-label="Log Statistiken werden geladen">
        {skeletonCards()}
      </section>
    )
  }

  const cards: StatCard[] = [
    {
      title: "Heute",
      value: numberValue(statistics?.today),
      description: "Ereignisse seit Tagesbeginn",
      tone: "green",
      icon: CalendarDays
    },
    {
      title: "Letzte Stunde",
      value: numberValue(statistics?.lastHour),
      description: "Live-Aktivität",
      tone: "green",
      icon: Clock3
    },
    {
      title: "Fehler",
      value: numberValue(statistics?.error),
      description: "Kritische Log-Level",
      tone: "red",
      icon: ShieldAlert
    },
    {
      title: "Warnungen",
      value: numberValue(statistics?.warning),
      description: "Zu prüfende Ereignisse",
      tone: "yellow",
      icon: AlertTriangle
    },
    {
      title: "Aktive Logs",
      value: byteValue(archiveStatistics?.activeSize ?? statistics?.storageSize),
      description: `${numberValue(archiveStatistics?.activeLogs ?? statistics?.total)} aktive Einträge`,
      tone: "blue",
      icon: HardDrive
    },
    {
      title: "Archivgröße",
      value: byteValue(archiveStatistics?.archiveSize ?? statistics?.archiveSize),
      description: `${numberValue(archiveStatistics?.archivedLogs)} archivierte Logs`,
      tone: "violet",
      icon: Archive
    },
    {
      title: "Aufbewahrung",
      value: retentionValue(archiveStatistics?.retention),
      description: archiveStatistics?.nextArchiveDate ? `Nächste Archivierung: ${archiveStatistics.nextArchiveDate}` : "Retention Policy",
      tone: "slate",
      icon: Database
    }
  ]

  return (
    <section className="grid min-w-0 max-w-full gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7" aria-label="Log Statistiken">
      {cards.map((card) => {
        const Icon = card.icon
        const classes = toneClasses[card.tone]

        return (
          <article className={`min-h-24 min-w-0 rounded-lg border p-3 shadow-sm ${classes.card}`} key={card.title}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${classes.icon}`}>
                <Icon size={17} />
              </div>
              {card.tone === "green" ? <CheckCircle2 className="text-emerald-600" size={18} /> : null}
            </div>
            <span className="block text-xs font-semibold text-slate-500">{card.title}</span>
            <strong className={`mt-1 block truncate text-xl font-semibold tracking-normal ${classes.value}`} title={card.value}>{card.value}</strong>
            <small className="mt-1 block truncate text-xs font-medium text-slate-500" title={card.description}>{card.description}</small>
          </article>
        )
      })}
    </section>
  )
}

export default LogStats
