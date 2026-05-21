"use client"

import Link from "next/link"
import { ChangeEvent, useRef, useState } from "react"
import { AlertCircle, ArrowLeft, CheckCircle2, FileUp, Upload } from "lucide-react"
import { PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

type BankTransactionPreview = {
  date: string
  description: string
  counterparty: string
  iban: string
  amount: number
  currency: string
}

type BankImportResponse = {
  ok: boolean
  message: string
  fileName?: string
  imported?: number
  totalAmount?: number
  transactions?: BankTransactionPreview[]
  warnings?: string[]
}

function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency
  }).format(value)
}

export default function CsvImportPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<BankImportResponse | null>(null)
  const [error, setError] = useState("")
  const { t } = useLanguage()

  async function parseFile(file: File) {
    setIsLoading(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/finance/accounts/import", {
        method: "POST",
        body: formData
      })

      const data = await response.json() as BankImportResponse

      if (!response.ok || !data.ok) {
        throw new Error(data.message || t("finance.accounts.import.errors.readFailed"))
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("finance.accounts.import.errors.readFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    parseFile(file)
    event.target.value = ""
  }

  const transactions = result?.transactions ?? []

  return (
    <PageShell title={t("finance.accounts.import.title")} description={t("finance.accounts.import.description")}>
      <div className="space-y-6">
        <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          {t("finance.accounts.import.back")}
        </Link>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <section className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-gray-200">
              <FileUp className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-slate-950">{t("finance.accounts.import.upload.title")}</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{t("finance.accounts.import.upload.description")}</p>
            <input ref={inputRef} type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={handleFileChange} />
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href="/api/finance/accounts/import-template"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-800 no-underline ring-1 ring-gray-200 hover:bg-slate-50"
              >
                {t("finance.accounts.import.upload.template")}
              </a>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
                {isLoading ? t("finance.accounts.import.upload.reading") : t("finance.accounts.import.upload.chooseFile")}
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-extrabold text-slate-950">{t("finance.accounts.import.settings.title")}</h2>
            <div className="mt-5 space-y-4">
              <select className="h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-700 outline-none">
                <option>{t("finance.accounts.import.settings.primaryAccount")}</option>
                <option>{t("finance.accounts.import.settings.taxReserve")}</option>
                <option>{t("finance.accounts.import.settings.paypalBusiness")}</option>
              </select>
              <select className="h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-700 outline-none">
                <option>{t("finance.accounts.import.settings.detectDuplicates")}</option>
              </select>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-full bg-[var(--brand-lime)] px-5 py-3 text-sm font-bold text-black disabled:opacity-60"
                disabled={isLoading}
              >
                {transactions.length > 0 ? t("finance.accounts.import.settings.otherFile") : t("finance.accounts.import.settings.start")}
              </button>
            </div>
          </section>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {result && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("finance.accounts.import.result.fileRead")}
                </div>
                <h2 className="mt-3 text-2xl font-extrabold text-slate-950">{result.fileName}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{t("finance.accounts.import.result.transactionsDetected").replace("{count}", String(result.imported ?? 0))}</p>
              </div>
              <div className="rounded-2xl bg-[#f3f6fa] px-5 py-3 text-right">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t("finance.accounts.import.result.sum")}</p>
                <p className="text-xl font-black text-slate-950">{formatCurrency(result.totalAmount ?? 0)}</p>
              </div>
            </div>

            {result.warnings && result.warnings.length > 0 && (
              <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                {result.warnings.slice(0, 4).map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t("finance.accounts.import.table.date")}</th>
                    <th className="px-4 py-3">{t("finance.accounts.import.table.description")}</th>
                    <th className="px-4 py-3">{t("finance.accounts.import.table.counterparty")}</th>
                    <th className="px-4 py-3 text-right">{t("finance.accounts.import.table.amount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-bold text-slate-900">{transaction.date || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <p className="font-bold text-slate-950">{transaction.description || t("finance.accounts.import.table.noDescription")}</p>
                        <p className="text-xs text-slate-500">{transaction.counterparty}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{transaction.iban || "-"}</td>
                      <td className="px-4 py-3 text-right font-black text-slate-950">{formatCurrency(transaction.amount, transaction.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </PageShell>
  )
}
