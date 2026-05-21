"use client"

import Link from "next/link"
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { PageShell } from "@invoice-platform/ui"
import { customers } from "@/data/invoice-data"
import { useLanguage } from "@/lib/i18n"

export default function CustomersPage() {
  const importInputRef = useRef<HTMLInputElement>(null)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [query, setQuery] = useState("")
  const [customerItems, setCustomerItems] = useState(customers)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle")
  const [importMessage, setImportMessage] = useState("")
  const { t } = useLanguage()

  async function loadCustomers() {
    const response = await fetch("/api/customers/list")
    if (!response.ok) return

    const data = await response.json() as typeof customers
    setCustomerItems(data.map((customer) => ({
      ...customer,
      contact: customer.contact || "",
      email: customer.email || "",
      status: customer.status || "active"
    })))
  }

  useEffect(() => {
    void loadCustomers()
  }, [])

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
      await loadCustomers()
    } catch (error) {
      setImportStatus("error")
      setImportMessage(error instanceof Error ? error.message : t("customers.overview.import.error"))
    } finally {
      setImporting(false)
      event.target.value = ""
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return customerItems.filter((c) =>
      [c.name, c.contact, c.email, c.status].join(" ").toLowerCase().includes(q)
    )
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
        <div className="w-[360px] max-w-full" />

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
          <a
            href="/api/customers/import-template"
            className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-800 no-underline shadow-sm ring-1 ring-slate-200"
          >
            {t("customers.overview.actions.template")}
          </a>
          <a
            href="/api/customers/export"
            className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-800 no-underline shadow-sm ring-1 ring-slate-200"
          >
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

      {view === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="no-underline">
              <div className="rounded-[24px] border border-[#e5eaf0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf2f7] text-lg font-extrabold text-[#334155]">{c.name.slice(0, 2).toUpperCase()}</div>
                  <span className="rounded-full bg-[#f3f6fa] px-2 py-1 text-xs text-[#64748b]">↗</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#0f172a]">{c.name}</h3>
                <p className="mt-1 text-sm text-[#64748b]">{c.contact}</p>
                <div className="mt-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(c.status)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="block no-underline">
              <div className="grid grid-cols-[1.3fr_1fr_0.7fr_0.3fr] items-center rounded-full border border-[#e5eaf0] bg-white px-6 py-4 shadow-sm transition hover:border-[#cfd8e5] hover:shadow">
                <div>
                  <p className="font-extrabold text-[#111827]">{c.name}</p>
                  <p className="text-sm text-[#64748b]">{c.contact}</p>
                </div>
                <div className="text-sm text-[#64748b]">{c.email}</div>
                <div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{statusLabel(c.status)}</span></div>
                <div className="text-right text-sm font-extrabold text-[#64748b]">↗</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-[#d8e0ea] bg-[#f7f9fc] p-8 text-center text-[#64748b]">
          {t("customers.overview.empty")}
        </div>
      )}
    </PageShell>
  )
}
