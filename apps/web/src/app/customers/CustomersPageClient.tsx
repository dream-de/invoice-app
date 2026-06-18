"use client"

import Link from "next/link"
import { ChangeEvent, useMemo, useRef, useState } from "react"
import useSWR from "swr"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"
import { jsonFetcher, listCacheOptions } from "@/lib/swr/fetcher"

type CustomerItem = {
  id: string
  name: string
  contact?: string | null
  email?: string | null
  status?: string | null
}

export default function CustomersPage() {
  const importInputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [query, setQuery] = useState("")
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importMessage, setImportMessage] = useState("")
  const { t } = useLanguage()
  const { data: customerData, mutate: refreshCustomers } = useSWR<CustomerItem[]>(
    "/api/customers/list",
    jsonFetcher,
    {
      ...listCacheOptions,
      fallbackData: []
    }
  )

  const customerItems = useMemo(
    () => (customerData ?? []).map((customer) => ({
      ...customer,
      contact: customer.contact || "",
      email: customer.email || "",
      status: customer.status || "active"
    })),
    [customerData]
  )

  async function importCustomers(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportStatus("idle")
    setImportMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("save", "true")

      const response = await fetch("/api/customers/import", {
        method: "POST",
        body: formData
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.message || t("customers.overview.import.error"))
      }

      setImportStatus("success")
      setImportMessage(t("customers.overview.import.result").replace("{created}", String(result.created || 0)).replace("{updated}", String(result.updated || 0)))
      await refreshCustomers()
    } catch (error) {
      setImportStatus("error")
      setImportMessage(error instanceof Error ? error.message : t("customers.overview.import.error"))
    } finally {
      setImporting(false)
      event.target.value = ""
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customerItems

    return customerItems.filter((c) => {
      const text = `${c.name} ${c.contact} ${c.email} ${c.status}`.toLowerCase()
      return text.includes(q)
    })
  }, [customerItems, query])

  const statusLabel = (status: string) => {
    if (status === "active" || status === "Aktiv") return t("customers.status.active")
    if (status === "open" || status === "Offen") return t("customers.status.open")
    if (status === "inactive" || status === "Inaktiv") return t("customers.status.inactive")
    return status
  }

  return (
    <PageShell title={t("customers.overview.title")} description={t("customers.overview.description")}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-[360px] max-w-full">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Kunden, Rechnungen, Angebote suchen ..."
            className="w-full rounded-full border border-[#dbe3ee] bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input ref={importInputRef} type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={importCustomers} />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-800 shadow-sm ring-1 ring-slate-200 disabled:opacity-60"
          >
            {importing ? t("customers.overview.actions.importing") : t("customers.overview.actions.import")}
          </button>
          <a href="/api/customers/import-template" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-800 no-underline shadow-sm ring-1 ring-slate-200">
            {t("customers.overview.actions.template")}
          </a>
          <a href="/api/customers/export" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-800 no-underline shadow-sm ring-1 ring-slate-200">
            {t("customers.overview.actions.export")}
          </a>

          <div className="inline-flex rounded-full bg-[#eceff3] p-1">
            <button aria-label={t("customers.overview.actions.gridView")} onClick={() => setView("grid")} className={`rounded-full px-4 py-2 text-sm font-extrabold ${view === "grid" ? "bg-white shadow text-[#111827]" : "text-[#6b7280]"}`}>⊞</button>
            <button aria-label={t("customers.overview.actions.listView")} onClick={() => setView("list")} className={`rounded-full px-4 py-2 text-sm font-extrabold ${view === "list" ? "bg-white shadow text-[#111827]" : "text-[#6b7280]"}`}>☰</button>
          </div>

          <Link href="/customers/new" className="no-underline">
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-4xl font-black text-white shadow-sm transition hover:brightness-95" aria-label={t("customers.overview.actions.add")}>+</button>
          </Link>
        </div>
      </div>

      {importMessage && (
        <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-black ${importStatus === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {importStatus === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <span>{importMessage}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[#d8e0ea] bg-[#f7f9fc] p-8 text-center text-[#64748b]">
          {t("customers.overview.empty")}
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`} className="no-underline">
              <div className="group rounded-[30px] border border-[#e5eaf0] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[var(--brand-lime)] hover:bg-[var(--brand-lime)] hover:shadow-lg">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#edf2f7] text-lg font-extrabold text-[#334155] shadow-sm transition group-hover:bg-white group-hover:text-[#0f172a]">{customer.name.slice(0, 2).toUpperCase()}</div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f6fa] text-sm font-black text-[#64748b] transition group-hover:bg-black group-hover:text-white">↗</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#0f172a]">{customer.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#64748b] transition group-hover:text-[#334155]">{customer.contact}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold shadow-sm ${customer.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(customer.status)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`} className="block no-underline">
              <div className="group grid grid-cols-[1.3fr_1fr_0.4fr] items-center rounded-full border border-[#e5eaf0] bg-white px-6 py-4 shadow-sm transition-all hover:border-[var(--brand-lime)] hover:bg-[var(--brand-lime)] hover:shadow">
                <div>
                  <p className="font-extrabold text-[#111827]">{customer.name}</p>
                  <p className="text-sm text-[#64748b] transition group-hover:text-[#334155]">{customer.contact}</p>
                </div>
                <div className="text-sm text-[#64748b] transition group-hover:text-[#334155]">{customer.email}</div>
                <div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${customer.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(customer.status)}</span></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  )
}
