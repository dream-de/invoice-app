"use client"

import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { Currency, PageShell } from "@invoice-platform/ui"
import { useLanguage } from "@/lib/i18n"

const transactions = [
  ["2025-02-17", "expense", "Finanzamt Koeln", "Umsatzsteuervorauszahlung Jan 2025", -990],
  ["2025-02-11", "expense", "Notion Labs", "Team-Abo Februar", -74.99],
  ["2025-02-05", "expense", "Meta Ads", "Kampagne Leadgen Februar", -145],
  ["2025-02-03", "income", "StartUp Koeln AG", "Teilzahlung Strategieprojekt", 1450],
  ["2025-01-22", "income", "Kunde Shop #1143", "PayPal Checkout", 680],
  ["2025-01-19", "expense", "Büro Center Koeln", "Büromaterial Q1", -460],
  ["2025-01-12", "expense", "Telekom Deutschland", "Internet & Telefon Januar", -189],
  ["2025-01-08", "income", "Aurora Labs GmbH", "Abschlagszahlung Portal-Relaunch", 2200]
] as const

export default function EurClassificationPage() {
  const { t } = useLanguage()
  const typeLabel = (type: "income" | "expense") => type === "income" ? t("finance.accounts.eur.income") : t("finance.accounts.eur.expense")

  return (
    <PageShell title={t("finance.accounts.eur.title")} description={t("finance.accounts.eur.description")}>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            {t("finance.accounts.eur.back")}
          </Link>

          <div className="flex gap-2">
            <Link href="/finance/accounts/assign" className="rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-slate-600 no-underline">{t("finance.accounts.assign.matchInvoices")}</Link>
            <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">{t("finance.accounts.assign.classifyEur")}</button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[100px_1fr_180px_150px_150px]">
          <select className="h-11 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-600 outline-none"><option>2025</option></select>
          <label className="flex h-11 items-center gap-2 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-500">
            <Search className="h-4 w-4" />
            <input placeholder={t("finance.accounts.eur.search")} className="min-w-0 flex-1 bg-transparent outline-none" />
          </label>
          <select className="h-11 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-600 outline-none"><option>{t("finance.accounts.eur.unclassified")}</option></select>
          <select className="h-11 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-600 outline-none"><option>{t("finance.accounts.eur.allTypes")}</option></select>
          <select className="h-11 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-600 outline-none"><option>{t("finance.accounts.eur.newestFirst")}</option></select>
        </div>

        <div className="flex flex-wrap gap-2">
          {[t("finance.accounts.eur.selectAll"), t("finance.accounts.eur.clearSelection"), t("finance.accounts.eur.bulkActions"), t("finance.accounts.eur.applySuggestion"), t("finance.accounts.eur.markPrivate")].map((item, index) => (
            <button key={item} className={index === 3 ? "rounded-full bg-black px-4 py-2 text-sm font-semibold text-white" : "rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-slate-600"}>
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {transactions.map(([date, type, party, purpose, amount]) => (
            <div key={date + "-" + party} className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-4 md:grid-cols-[145px_1fr_auto]">
              <div className="text-sm font-semibold text-slate-500">
                {date}<span className="mx-2 text-slate-300">|</span>
                <span className={type === "income" ? "text-emerald-600" : "text-red-500"}>{typeLabel(type)}</span>
              </div>
              <div>
                <p className="font-extrabold text-slate-950">{party}</p>
                <p className="mt-1 text-sm text-slate-500">{purpose}</p>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <p className={amount > 0 ? "min-w-[120px] text-right font-extrabold text-emerald-600" : "min-w-[120px] text-right font-extrabold text-slate-950"}>
                  {amount > 0 ? "+" : "-"}<Currency value={Math.abs(amount)} />
                </p>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">{t("finance.accounts.eur.open")}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{t("finance.accounts.eur.suggestion")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
