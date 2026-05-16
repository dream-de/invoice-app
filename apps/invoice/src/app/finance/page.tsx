import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  FileSpreadsheet,
  Landmark
} from "lucide-react"
import { PageShell } from "@invoice-platform/ui"

const modules = [
  {
    title: "Konten & Transaktionen",
    description: "CSV-Import, Zuordnung zu Rechnungen, Kontenverwaltung.",
    href: "/finance/accounts",
    icon: Landmark
  },
  {
    title: "Statistiken",
    description: "Umsätze, Kategorien, Zeiträume, Trends.",
    href: "/finance/statistics",
    icon: BarChart3
  },
  {
    title: "EUR",
    description: "Anlage EUR Kategorien, Klassifizierung und Export.",
    href: "/finance/eur",
    icon: FileSpreadsheet
  }
]

export default function FinancePage() {
  return (
    <PageShell
      title="Finanzen"
      description="Konten, Transaktionen und Auswertungen."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {modules.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative min-h-[186px] rounded-3xl border border-gray-200 bg-gray-50 p-6 text-left text-slate-950 no-underline transition-colors hover:bg-gray-100"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-[var(--brand-lime)] shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-300 ring-1 ring-gray-200 transition group-hover:text-slate-700">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              <h2 className="mt-8 text-xl font-extrabold tracking-tight text-slate-950">
                {item.title}
              </h2>

              <p className="mt-3 max-w-[310px] text-sm font-medium leading-6 text-slate-500">
                {item.description}
              </p>
            </Link>
          )
        })}
      </div>
    </PageShell>
  )
}
