"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Button, Currency, PageShell } from "@dream-invoice/ui"
import { documents } from "@/data/invoice-data"
import { translateStatus, useLanguage } from "@/lib/i18n"
import type { TranslationKey } from "@/i18n/dictionary"

type DocumentStatus = "draft" | "open" | "paid" | "overdue"
type StatusFilter = "all" | DocumentStatus

const statusClass: Record<DocumentStatus, string> = {
  paid: "border-emerald-300 text-emerald-700",
  open: "border-slate-300 text-slate-700",
  overdue: "border-red-300 text-red-700",
  draft: "border-slate-300 text-slate-600"
}

type DocumentListItem = {
  id: string
  number: string
  customer: string
  type: string
  status: DocumentStatus
  amount: number
  dueDate: string
  createdAt: string
}

type ApiInvoiceListItem = {
  id: string
  number?: string
  type?: string
  status?: string
  customer?: string
  grossTotal?: unknown
  dueDate?: string | Date | null
  createdAt?: string | Date | null
}

type BulkNotice = {
  type: "success" | "error" | "info"
  text: string
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function formatDisplayDate(value: string | Date | null | undefined, locale = "de-DE") {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat(locale).format(date)
}

function csvCell(value: unknown) {
  const text = String(value ?? "")
  return "\"" + text.replace(/"/g, "\"\"") + "\""
}

function downloadCsv(filename: string, rows: unknown[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n")
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function normalizeStatus(status: string | undefined): DocumentStatus {
  const normalized = (status ?? "").toLowerCase()

  if (normalized === "paid" || normalized === "bezahlt") return "paid"
  if (normalized === "overdue" || normalized === "überfällig" || normalized === "ueberfaellig") return "overdue"
  if (normalized === "open" || normalized === "sent" || normalized === "offen" || normalized === "gesendet") return "open"
  if (normalized === "draft" || normalized === "entwurf") return "draft"

  return "draft"
}

function normalizeType(type: string | undefined) {
  if (type === "invoice" || type === "Rechnung") return "invoice"
  if (type === "offer" || type === "Angebot") return "offer"
  return type || "invoice"
}

function translateDocumentType(type: string, t: (key: TranslationKey) => string) {
  if (type === "invoice" || type === "Rechnung") return t("documents.list.type.invoice")
  if (type === "offer" || type === "Angebot") return t("documents.list.type.offer")
  return type
}

function normalizeStaticDocument(item: typeof documents[number]): DocumentListItem {
  return {
    id: item.id,
    number: item.number,
    customer: item.customer,
    type: normalizeType(item.type),
    status: normalizeStatus(item.status),
    amount: numberValue(item.amount),
    dueDate: "-",
    createdAt: "-"
  }
}

function normalizeApiDocument(item: ApiInvoiceListItem, t: (key: TranslationKey) => string, locale: string): DocumentListItem {
  return {
    id: item.id,
    number: item.number || t("documents.list.fallback.noNumber"),
    customer: item.customer || t("documents.list.fallback.unknownCustomer"),
    type: normalizeType(item.type),
    status: normalizeStatus(item.status),
    amount: numberValue(item.grossTotal),
    dueDate: formatDisplayDate(item.dueDate, locale),
    createdAt: formatDisplayDate(item.createdAt, locale)
  }
}

export default function DocumentsPage() {
  const router = useRouter()
  const [status, setStatus] = useState<StatusFilter>("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [creatingInvoice, setCreatingInvoice] = useState(false)
  const [documentItems, setDocumentItems] = useState<DocumentListItem[]>(() => documents.map(normalizeStaticDocument))
  const [bulkNotice, setBulkNotice] = useState<BulkNotice | null>(null)
  const { language, t } = useLanguage()

  const filterItems: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: t("documents.list.filters.all") },
    { value: "draft", label: t("documents.list.filters.draft") },
    { value: "open", label: t("status.open") },
    { value: "paid", label: t("status.paid") },
    { value: "overdue", label: t("status.overdue") }
  ]

  useEffect(() => {
    let cancelled = false

    async function loadDocuments() {
      try {
        const response = await fetch("/api/invoice/list")

        if (!response.ok) return

        const result = await response.json() as ApiInvoiceListItem[]

        if (!cancelled && Array.isArray(result)) {
          setDocumentItems(result.map((item) => normalizeApiDocument(item, t, language === "en" ? "en-US" : "de-DE")))
        }
      } catch {
        // Demo-Dokumente bleiben als lokaler Fallback sichtbar.
      }
    }

    loadDocuments()

    return () => {
      cancelled = true
    }
  }, [language, t])

  const filteredDocuments = useMemo(() => {
    return documentItems.filter((doc) => status === "all" || doc.status === status)
  }, [documentItems, status])

  const allVisibleIds = filteredDocuments.map((d) => d.id)
  const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id))

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const selectAllVisible = () => {
    setSelectedIds((prev) => [...new Set([...prev, ...allVisibleIds])])
  }

  const clearSelection = () => {
    setSelectedIds([])
    setBulkNotice(null)
  }
  const clearVisible = () => setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)))
  const exportSelected = () => {
    if (selectedIds.length === 0) return

    const url = "/api/documents/export?ids=" + encodeURIComponent(selectedIds.join(","))
    const link = document.createElement("a")

    link.href = url
    link.download = "dokumente-export.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()

    setBulkNotice({
      type: "success",
      text: t("documents.list.notice.exportStarted")
    })
  }
  const printSelected = () => {
    if (selectedIds.length === 0) return

    const selectedDocuments = documentItems.filter((doc) => selectedIds.includes(doc.id))
    const documentsToOpen = selectedDocuments.slice(0, 3)

    documentsToOpen.forEach((doc) => {
      window.open(`/api/invoice/pdf/${doc.id}?inline=1`, "_blank", "noopener,noreferrer")
    })

    setBulkNotice({
      type: "info",
      text: selectedDocuments.length > documentsToOpen.length
        ? (t("documents.list.notice.printFirstThree"))
        : (t("documents.list.notice.printOpened"))
    })
  }
  const deleteSelected = async () => {
    if (selectedIds.length === 0) return

    const confirmed = window.confirm(
      `${selectedIds.length} ${t("documents.list.confirm.deleteSuffix")}`
    )

    if (!confirmed) return

    const idsToDelete = [...selectedIds]
    setBulkNotice({ type: "info", text: t("documents.list.notice.deleting") })

    const results = await Promise.allSettled(
      idsToDelete.map(async (id) => {
        const response = await fetch(`/api/invoice/delete/${id}`, { method: "DELETE" })
        if (!response.ok) throw new Error(id)
        return id
      })
    )

    const deletedIds = results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
      .map((result) => result.value)

    if (deletedIds.length > 0) {
      setDocumentItems((items) => items.filter((doc) => !deletedIds.includes(doc.id)))
      setSelectedIds((ids) => ids.filter((id) => !deletedIds.includes(id)))
    }

    setBulkNotice({
      type: deletedIds.length === idsToDelete.length ? "success" : "error",
      text: deletedIds.length === idsToDelete.length
        ? (t("documents.list.notice.deleted"))
        : (t("documents.list.notice.deletePartial"))
    })
  }

  async function createDraftInvoice() {
    if (creatingInvoice) return

    setCreatingInvoice(true)

    try {
      const todayDate = new Date()
      const today = todayDate.toISOString().slice(0, 10)
      const dueDateValue = new Date(todayDate)
      dueDateValue.setDate(dueDateValue.getDate() + 14)
      const dueDate = dueDateValue.toISOString().slice(0, 10)

      const response = await fetch("/api/invoice/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: today,
          dueDate,
          taxRate: 0.19,
          tip: 0,
          note: t("documents.list.draft.defaultNote"),
          items: [
            {
              name: t("documents.list.draft.newItem"),
              quantity: 1,
              price: 0,
              total: 0
            }
          ]
        })
      })

      const result = await response.json()

      if (!response.ok || !result?.invoice?.id) {
        throw new Error(result?.error || t("documents.list.error.draftCreate"))
      }

      router.push(`/documents/${result.invoice.id}/edit`)
    } catch (error) {
      alert(error instanceof Error ? error.message : t("documents.list.error.unknown"))
      setCreatingInvoice(false)
    }
  }

  return (
    <PageShell title={t("documents.list.title")} description="">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          {filterItems.map((item) => (
            <button key={item.value} type="button" onClick={() => setStatus(item.value)} className={`rounded-full px-4 py-2 text-xs font-semibold transition ${status === item.value ? "bg-black text-white shadow" : "bg-[#eceff3] text-[#6b7280] hover:bg-[#e3e8ef]"}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/documents/templates" className="no-underline"><Button variant="secondary">{t("documents.list.actions.templates")}</Button></Link>
          <Button variant="secondary">{t("documents.list.actions.subscriptions")}</Button>
          <button
            type="button"
            onClick={createDraftInvoice}
            disabled={creatingInvoice}
            className={`flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-lime)] text-4xl font-semibold text-black shadow-sm transition ${creatingInvoice ? "cursor-wait opacity-80" : "hover:brightness-95"}`}
            aria-label={t("documents.list.actions.newInvoice")}
          >
            {creatingInvoice ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-black/25 border-t-black" /> : "+"}
          </button>
        </div>
      </div>

      {bulkNotice && (
        <div className={`mt-4 rounded-[24px] px-5 py-3 text-sm font-black ${bulkNotice.type === "error" ? "bg-red-50 text-red-700" : bulkNotice.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
          {bulkNotice.text}
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="mt-4 flex justify-end">
          <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-black px-3 py-2 text-white shadow-lg">
            <button type="button" onClick={allVisibleSelected ? clearVisible : selectAllVisible} className="rounded-full bg-[#171a1f] px-4 py-2 text-sm font-bold text-white ring-1 ring-white/15">
              {allVisibleSelected ? t("documents.list.selection.clearVisible") : t("documents.list.selection.selectAll")}
            </button>
            <span className="mx-1 hidden h-8 w-px bg-white/20 lg:block" />
            <button type="button" onClick={exportSelected} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-black">⤓ {t("documents.list.selection.export")}</button>
            <button type="button" onClick={printSelected} className="rounded-full bg-[var(--brand-lime)] px-4 py-2 text-sm font-bold text-black">⎙ {t("documents.list.selection.print")}</button>
            <button type="button" onClick={deleteSelected} className="rounded-full bg-[#ef2b2b] px-4 py-2 text-sm font-bold text-white">{t("documents.list.selection.delete")}</button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filteredDocuments.map((doc) => {
          const selected = selectedIds.includes(doc.id)
          return (
            <div key={doc.id} className={`grid grid-cols-[56px_1.1fr_0.8fr_0.7fr_0.9fr_0.8fr] items-center rounded-[28px] border bg-white px-5 py-3 shadow-sm transition ${selected ? "border-black ring-1 ring-black" : "border-[#e6ebf1] hover:border-[#cfd8e5]"}`}>
              <div><button type="button" onClick={() => toggleOne(doc.id)} className={`h-8 w-8 rounded-md border text-sm font-semibold ${selected ? "border-black bg-black text-[var(--brand-lime)]" : "border-slate-300 bg-white text-transparent"}`}>✓</button></div>
              <Link href={`/documents/${doc.id}`} className="no-underline"><div><p className="text-[18px] font-semibold text-[#0f172a]">{doc.number}</p><p className="mt-1 text-sm text-[#64748b]">{doc.customer}</p></div></Link>
              <div className="text-sm font-semibold text-[#64748b]">{translateDocumentType(doc.type, t)}</div>
              <div><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[doc.status] ?? "border-slate-300 text-slate-700"}`}>{translateStatus(doc.status, t)}</span></div>
              <div className="text-right text-sm font-semibold text-[#64748b]">{t("documents.list.row.due")}<p className="text-sm font-bold text-[#0f172a]">{doc.dueDate !== "-" ? doc.dueDate : doc.createdAt}</p></div>
              <div className="text-right text-[22px] font-medium text-[#0f172a]"><Currency value={doc.amount} /></div>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
