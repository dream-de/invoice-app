"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

type ImportStatusKey = "finance.accounts.history.completed" | "finance.accounts.history.rollbackPossible"

type ImportRun = {
  name: string
  date: string
  count: string
  statusKey: ImportStatusKey
}

const initialImports: ImportRun[] = [
  { name: "Bankimport Februar", date: "2025-02-18", count: "24", statusKey: "finance.accounts.history.completed" },
  { name: "PayPal Januar", date: "2025-01-31", count: "12", statusKey: "finance.accounts.history.completed" },
  { name: "Hauptkonto Januar", date: "2025-01-15", count: "18", statusKey: "finance.accounts.history.rollbackPossible" }
]

export default function ImportHistoryPage() {
  const { t } = useLanguage()
  const [imports, setImports] = useState(initialImports)

  function rollbackImport(name: string) {
    setImports((items) =>
      items.map((item) =>
        item.name === name
          ? { ...item, statusKey: "finance.accounts.history.completed" }
          : item
      )
    )
  }

  return (
    <PageShell title={t("finance.accounts.history.title")} description={t("finance.accounts.history.description")}>
      <div className="space-y-6">
        <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          {t("finance.accounts.history.back")}
        </Link>

        <div className="space-y-3">
          {imports.map((item) => {
            const canRollback = item.statusKey === "finance.accounts.history.rollbackPossible"

            return (
            <div key={item.name} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="font-extrabold text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">{item.date} · {item.count} {t("finance.accounts.history.transactions")}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-gray-200">{t(item.statusKey)}</span>
                <button
                  type="button"
                  disabled={!canRollback}
                  onClick={() => rollbackImport(item.name)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2f7] text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
