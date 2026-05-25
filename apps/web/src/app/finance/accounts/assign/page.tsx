"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, Search } from "lucide-react"
import { Currency, PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

const transactions = [
  ["StartUp Koeln AG", "Teilzahlung Strategieprojekt", 1450, "03.02.2025"],
  ["Kunde Shop #1143", "PayPal Checkout", 680, "22.01.2025"],
  ["Aurora Labs GmbH", "Abschlagszahlung Portal-Relaunch", 2200, "08.01.2025"],
  ["StartUp Koeln AG", "Gutschrift", 3450.5, "25.10.2023"],
  ["Online Shop Kunde", "Bestellung #992", 850, "23.10.2023"],
  ["Umbuchung Hauptkonto", "Rücklage Q3", 5000, "01.10.2023"]
] as const

export default function AssignTransactionsPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState("")
  const [selectedKey, setSelectedKey] = useState("")

  const filteredTransactions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return transactions

    return transactions.filter(([name, text, amount, date]) =>
      [name, text, String(amount), date].join(" ").toLowerCase().includes(needle)
    )
  }, [query])

  const selectedTransaction = filteredTransactions.find(([name, , , date]) => `${name}-${date}` === selectedKey) ?? null

  return (
    <PageShell title={t("finance.accounts.assign.title")} description={t("finance.accounts.assign.description")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            {t("finance.accounts.assign.back")}
          </Link>

          <div className="flex gap-2">
            <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">{t("finance.accounts.assign.matchInvoices")}</button>
            <Link href="/finance/accounts/eur" className="rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-slate-600 no-underline">{t("finance.accounts.assign.classifyEur")}</Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1fr]">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <label className="flex h-11 items-center gap-2 rounded-full bg-[#f3f6fa] px-4 text-sm font-semibold text-slate-500">
              <Search className="h-4 w-4" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("finance.accounts.assign.search")}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setQuery("")
                setSelectedKey("")
              }}
              className="mt-4 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-slate-600"
            >
              {t("finance.accounts.assign.showAll")}
            </button>

            <div className="mt-5 space-y-3">
              {filteredTransactions.map(([name, text, amount, date]) => {
                const key = `${name}-${date}`

                return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedKey(key)}
                  className={`w-full rounded-2xl border p-4 text-left transition hover:bg-white ${selectedKey === key ? "border-blue-300 bg-blue-50 ring-2 ring-blue-100" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-extrabold text-slate-950">{name}</p>
                      <p className="mt-1 text-sm text-slate-500">{text}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-emerald-600"><Currency value={amount} /></p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{date}</p>
                    </div>
                  </div>
                </button>
                )
              })}
            </div>
          </section>

          <section className="flex min-h-[560px] items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            {selectedTransaction ? (
              <div className="w-full max-w-lg text-left">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Transaktion</p>
                <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{selectedTransaction[0]}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">{selectedTransaction[1]}</p>
                <div className="mt-6 grid gap-3 rounded-3xl bg-[#f7f9fc] p-5">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-500">Datum</span>
                    <span className="font-extrabold text-slate-950">{selectedTransaction[3]}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-500">Betrag</span>
                    <span className="font-extrabold text-emerald-600"><Currency value={selectedTransaction[2]} /></span>
                  </div>
                </div>
                <div className="mt-6 grid gap-3">
                  {["DI-2026-1001 · Aurora Labs GmbH", "DI-2026-1002 · Urban Commerce AG"].map((match) => (
                    <button key={match} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-extrabold text-slate-800 hover:border-blue-300 hover:bg-blue-50">
                      {match}
                    </button>
                  ))}
                </div>
                <button className="mt-5 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white">{t("finance.accounts.assign.matchInvoices")}</button>
              </div>
            ) : (
              <div>
                <p className="text-xl font-extrabold text-slate-950">{t("finance.accounts.assign.empty.title")}</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{t("finance.accounts.assign.empty.description")}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  )
}
