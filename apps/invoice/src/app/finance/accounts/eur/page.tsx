import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { Currency, PageShell } from "@invoice-platform/ui"

const transactions = [
  ["2025-02-17", "Ausgabe", "Finanzamt Berlin", "Umsatzsteuervorauszahlung Jan 2025", -990],
  ["2025-02-11", "Ausgabe", "Notion Labs", "Team-Abo Februar", -74.99],
  ["2025-02-05", "Ausgabe", "Meta Ads", "Kampagne Leadgen Februar", -145],
  ["2025-02-03", "Einnahme", "StartUp Berlin AG", "Teilzahlung Strategieprojekt", 1450],
  ["2025-01-22", "Einnahme", "Kunde Shop #1143", "PayPal Checkout", 680],
  ["2025-01-19", "Ausgabe", "Büro Center Berlin", "Büromaterial Q1", -460],
  ["2025-01-12", "Ausgabe", "Telekom Deutschland", "Internet & Telefon Januar", -189],
  ["2025-01-08", "Einnahme", "Musterfirma GmbH", "Abschlagszahlung Website-Relaunch", 2200]
] as const

export default function EurClassificationPage() {
  return (
    <PageShell title="Transaktionen bearbeiten" description="8 offene EUR-Klassifizierungen">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>

          <div className="flex gap-2">
            <Link href="/finance/accounts/assign" className="rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-slate-600 no-underline">Rechnungen zuordnen</Link>
            <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">EUR klassifizieren</button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[100px_1fr_180px_150px_150px]">
          <select className="h-11 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-600 outline-none"><option>2025</option></select>
          <label className="flex h-11 items-center gap-2 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-500">
            <Search className="h-4 w-4" />
            <input placeholder="Suche Gegenpartei/Zweck" className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <select className="h-11 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-600 outline-none"><option>Unklassifiziert</option></select>
          <select className="h-11 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-600 outline-none"><option>Alle Typen</option></select>
          <select className="h-11 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-600 outline-none"><option>Neueste zuerst</option></select>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Alle wählen", "Auswahl löschen", "Bulk-Aktionen (0 ausgewählt)", "Vorschlag anwenden", "Als privat/Transfer markieren"].map((item, index) => (
            <button key={item} className={`rounded-full px-4 py-2 text-sm font-semibold ${index === 3 ? "bg-black text-white" : "bg-[#eef2f7] text-slate-600"}`}>
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {transactions.map(([date, type, party, purpose, amount]) => (
            <div key={`${date}-${party}`} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-[145px_1fr_auto]">
              <div className="text-sm font-semibold text-slate-500">
                {date}<span className="mx-2 text-slate-300">|</span>
                <span className={type === "Einnahme" ? "text-emerald-600" : "text-red-500"}>{type}</span>
              </div>
              <div>
                <p className="font-extrabold text-slate-950">{party}</p>
                <p className="mt-1 text-sm text-slate-500">{purpose}</p>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <p className={`min-w-[120px] text-right font-extrabold ${amount > 0 ? "text-emerald-600" : "text-slate-950"}`}>
                  {amount > 0 ? "+" : "-"}<Currency value={Math.abs(amount)} />
                </p>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">Offen</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Vorschlag</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
