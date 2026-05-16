import Link from "next/link"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { PageShell } from "@invoice-platform/ui"

const imports = [
  ["Bankimport Februar", "2025-02-18", "24 Transaktionen", "Abgeschlossen"],
  ["PayPal Januar", "2025-01-31", "12 Transaktionen", "Abgeschlossen"],
  ["Hauptkonto Januar", "2025-01-15", "18 Transaktionen", "Rückgängig möglich"]
] as const

export default function ImportHistoryPage() {
  return (
    <PageShell title="Import-Historie" description="Vergangene Importe einsehen und rückgängig machen.">
      <div className="space-y-6">
        <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>

        <div className="space-y-3">
          {imports.map(([name, date, count, status]) => (
            <div key={name} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="font-extrabold text-slate-950">{name}</p>
                <p className="mt-1 text-sm text-slate-500">{date} · {count}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-gray-200">{status}</span>
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2f7] text-slate-600">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
