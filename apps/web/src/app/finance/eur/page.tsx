"use client"

import { ArrowLeft, Download, FileText, RotateCcw, Search, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Currency } from "@invoice-platform/ui"
import { useLanguage } from "@/lib/i18n"

const transactions = [
  { date: "2025-02-17", source: "Bank", name: "Finanzamt Koeln", text: "Umsatzsteuervorauszahlung Jan 2025", amount: -990, type: "Ausgabe" },
  { date: "2025-02-11", source: "Bank", name: "Notion Labs", text: "Team-Abo Februar", amount: -74.99, type: "Ausgabe" },
  { date: "2025-02-05", source: "Bank", name: "Meta Ads", text: "Kampagne Leadgen Februar", amount: -145, type: "Ausgabe" },
  { date: "2025-02-03", source: "Bank", name: "StartUp Koeln AG", text: "Teilzahlung Strategieprojekt", amount: 1450, type: "Einnahme" },
  { date: "2025-01-22", source: "Bank", name: "Kunde Shop #1143", text: "PayPal Checkout", amount: 680, type: "Einnahme" },
  { date: "2025-01-19", source: "Bank", name: "Büro Center Koeln", text: "Büromaterial Q1", amount: -460, type: "Ausgabe" },
  { date: "2025-01-12", source: "Bank", name: "Telekom Deutschland", text: "Internet & Telefon Januar", amount: -189, type: "Ausgabe" },
  { date: "2025-01-08", source: "Bank", name: "Aurora Labs GmbH", text: "Abschlagszahlung Portal-Relaunch", amount: 2200, type: "Einnahme" }
]

const categories = [
  ["111", "Betriebseinnahmen als umsatzsteuerlicher Kleinunternehmer", 0],
  ["112", "Umsatzsteuerpflichtige Betriebseinnahmen", 0],
  ["103", "Umsatzsteuerfreie / nicht umsatzsteuerbare Betriebseinnahmen", 0],
  ["159", "Summe Betriebseinnahmen", 0],
  ["100", "Waren, Rohstoffe und Hilfsstoffe", 0],
  ["110", "Bezogene Fremdleistungen", 0],
  ["120", "Ausgaben für eigenes Personal", 0],
  ["150", "Miete/Pacht für Geschäftsräume", 0],
  ["280", "Aufwendungen für Telekommunikation", 0],
  ["194", "Kosten für Rechts- und Steuerberatung", 0],
  ["228", "Laufende EDV-Kosten", 0],
  ["224", "Werbekosten", 0],
  ["199", "Summe Betriebsausgaben", 0]
] as const

export default function EurPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const { t } = useLanguage()

  return (
    <div className="mx-auto max-w-[1480px]">
      <section className="rounded-[34px] border border-[#e3e9f1] bg-[#f8f9fb] p-7 shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
        <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/finance" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-[var(--brand-lime)] shadow-sm">
              <FileText className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#151b2b]">{t("finance.eur.title")}</h1>
              <p className="mt-1 text-sm font-medium text-[#64748b]">
                {t("finance.eur.description")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-[#dfe5ed] bg-white px-5 py-2.5 text-sm font-semibold text-[#1f2937]">2025</button>
            <button className="inline-flex items-center gap-2 rounded-full border border-[#dfe5ed] bg-white px-5 py-2.5 text-sm font-semibold text-[#1f2937]">
              <SlidersHorizontal className="h-4 w-4" />
              {t("finance.eur.rules")}
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white">
              <Download className="h-4 w-4" />
              {t("finance.eur.exportCsv")}
            </button>
            <button className="inline-flex items-center gap-2 rounded-full bg-[#eef2f7] px-5 py-2.5 text-sm font-semibold text-[#1f2937]">
              <Download className="h-4 w-4" />
              {t("finance.eur.exportPdf")}
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[#e1e7ef] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#151b2b]">{t("finance.eur.queue")}</h2>
              <span className="text-sm font-medium text-[#7b8799]">{t("finance.eur.entries").replace("{count}", "8")}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-[#e6ebf1] bg-[#f7f9fc] p-2 text-center text-sm font-semibold text-[#64748b]">
              <button className="rounded-full bg-white px-4 py-2 text-[#151b2b] shadow-sm">{t("finance.eur.tabs.open").replace("{count}", "8")}</button>
              <button className="rounded-full px-4 py-2">{t("finance.eur.tabs.classified")}</button>
              <button className="rounded-full px-4 py-2">{t("finance.eur.tabs.excluded")}</button>
              <button className="rounded-full px-4 py-2">{t("finance.eur.tabs.all").replace("{count}", "8")}</button>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-full border border-[#e1e7ef] bg-white px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400" placeholder={t("finance.eur.search")} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="rounded-full border border-[#e1e7ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f2937]">{t("finance.eur.allTypes")}</button>
              <button className="rounded-full border border-[#e1e7ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f2937]">{t("finance.eur.newestFirst")}</button>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#e6ebf1] bg-[#f7f9fc] p-3">
              <div className="mb-3 flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 font-semibold text-[#334155]">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  {t("finance.eur.selectedCount")}
                </label>
                <button className="font-medium text-[#64748b]">{t("finance.eur.clearSelection")}</button>
              </div>

              <div className="grid gap-2">
                <button className="rounded-full bg-white px-4 py-2.5 text-left text-sm font-medium text-[#94a3b8]">{t("finance.eur.applySuggestion")}</button>
                <button className="rounded-full bg-white px-4 py-2.5 text-left text-sm font-medium text-[#94a3b8]">{t("finance.eur.markPrivate")}</button>
                <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-left text-sm font-medium text-[#94a3b8]">
                  <RotateCcw className="h-4 w-4" />
                  {t("finance.eur.resetClassification")}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {transactions.map((item) => (
                <button
                  key={`${item.date}-${item.name}`}
                  onClick={() => setSelected(item.name)}
                  className={`w-full rounded-[22px] border p-4 text-left transition ${
                    selected === item.name
                      ? "border-black bg-white shadow-md"
                      : "border-[#e5eaf0] bg-white hover:border-[#cfd8e5] hover:shadow-sm"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-[#7b8799]">
                    <span>{item.date} <span className="mx-2">|</span> {item.source}</span>
                    <span className={item.amount > 0 ? "text-emerald-600" : "text-red-500"}>
                      {item.amount > 0 ? "+" : "-"}<Currency value={Math.abs(item.amount)} />
                    </span>
                  </div>

                  <p className="text-base font-extrabold text-[#111827]">{item.name}</p>
                  <p className="mt-1 text-sm font-medium text-[#64748b]">{item.text}</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{t("finance.eur.open")}</span>
                    <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-bold text-[#475569]">{item.type}</span>
                    <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-bold text-[#475569]">{t("finance.eur.keyword")}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#e1e7ef] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#151b2b]">{t("finance.eur.classification")}</h2>

              <div className="mt-5 rounded-[24px] border border-dashed border-[#d8e0ea] bg-[#f7f9fc] p-8 text-center">
                <p className="text-base font-extrabold text-[#151b2b]">
                  {selected ? selected : t("finance.eur.noEntry")}
                </p>
                <p className="mt-2 text-sm font-medium text-[#64748b]">
                  {selected ? t("finance.eur.pickCategory") : t("finance.eur.pickEntry")}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e1e7ef] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#151b2b]">{t("finance.eur.report")}</h2>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  [t("finance.eur.revenue"), 0],
                  [t("finance.eur.expenses"), 0],
                  [t("finance.eur.surplus"), 0],
                  [t("finance.eur.unclassified"), 8]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[20px] bg-[#f7f9fc] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">{label}</p>
                    <p className="mt-2 text-lg font-extrabold text-[#111827]">
                      {label === t("finance.eur.unclassified") ? value : <Currency value={Number(value)} />}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-[22px] border border-[#e5eaf0]">
                <table className="w-full text-sm">
                  <thead className="bg-[#f7f9fc] text-left text-xs font-bold uppercase tracking-widest text-[#64748b]">
                    <tr>
                      <th className="px-4 py-3">{t("finance.eur.code")}</th>
                      <th className="px-4 py-3">{t("finance.eur.label")}</th>
                      <th className="px-4 py-3 text-right">{t("finance.eur.amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2f7] bg-white">
                    {categories.map(([code, label, amount]) => (
                      <tr key={code} className="hover:bg-[#f8fafc]">
                        <td className="px-4 py-3 font-bold text-[#475569]">{code}</td>
                        <td className="px-4 py-3 font-medium text-[#334155]">{label}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#111827]">
                          <Currency value={amount} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
