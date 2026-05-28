"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Mail,
  Paperclip,
  Pencil,
  Printer,
  Send,
  Share2,
  Trash2,
  X
} from "lucide-react"
import { ContentCard, Currency, PageShell } from "@dream-invoice/ui"

import { documents } from "@/data/invoice-data"
import { translateStatus, useLanguage } from "@/lib/i18n"

type DocumentDetailPageProps = {
  params: {
    id: string
  }
}

type PaymentMethod = "Banküberweisung" | "PayPal" | "Karte" | "Bar" | "Sonstiges"

type PaymentEntry = {
  id: string
  date: string
  amount: number
  method: PaymentMethod
  reason: string
}

type DocumentPosition = {
  id: string
  title: string
  description?: string | null
  quantity: number
  netPrice: number
  total: number
}

type DetailDocument = {
  id: string
  number: string
  customer: string
  customerEmail: string
  type: string
  status: string
  issueDate: string
  dueDate: string
  netTotal: number
  vatTotal: number
  grossTotal: number
  positions: DocumentPosition[]
  note?: string | null
}

type EmailLogEntry = {
  id: string
  createdAt: string
  type: "test" | "invoice"
  status: "success" | "error"
  provider?: "smtp" | "resend" | "disabled" | "unknown"
  to: string
  subject: string
  documentId?: string
  documentNumber?: string
  messageId?: string | null
  error?: string
}

type ApiInvoicePosition = {
  id: string
  title: string
  description?: string | null
  quantity: unknown
  netPrice: unknown
}

type ApiInvoice = {
  id: string
  number?: string
  type?: string
  status?: string
  issueDate?: string | Date | null
  dueDate?: string | Date | null
  netTotal?: unknown
  vatTotal?: unknown
  grossTotal?: unknown
  notes?: string | null
  customer?: {
    name?: string | null
    email?: string | null
  } | null
  positions?: ApiInvoicePosition[]
}

const DEFAULT_DOCUMENT_NOTE =
  "Vielen Dank für Ihren Auftrag. Bitte überweisen Sie den fälligen Betrag innerhalb von 14 Tagen auf das unten angegebene Konto."

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

function displayDate(value: string | Date | null | undefined, locale = "de-DE") {
  const formatted = formatDisplayDate(value, locale)

  if (formatted !== "-") return formatted
  if (typeof value === "string" && value.trim()) return value

  return "-"
}

function dateInputValue(value: string | Date | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10)

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10)

  return date.toISOString().slice(0, 10)
}

function parseMoneyInput(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".")
  const parsed = Number(normalized)

  return Number.isFinite(parsed) ? parsed : 0
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase()

  if (normalized === "paid" || normalized === "bezahlt") return "paid"
  if (normalized === "overdue" || normalized === "überfällig" || normalized === "ueberfaellig") return "overdue"
  if (normalized === "sent" || normalized === "gesendet") return "sent"
  if (normalized === "open" || normalized === "offen") return "open"
  if (normalized === "draft" || normalized === "entwurf") return "draft"

  return status
}

function statusKey(status: string) {
  const normalized = status.toLowerCase()

  if (normalized.includes("bezahlt") || normalized.includes("paid")) return "paid"
  if (normalized.includes("überfällig") || normalized.includes("overdue")) return "overdue"
  if (normalized.includes("gesendet") || normalized.includes("sent")) return "sent"
  if (normalized.includes("offen") || normalized.includes("open")) return "open"
  if (normalized.includes("entwurf") || normalized.includes("draft")) return "draft"

  return "open"
}

function statusBadgeClass(status: string) {
  const key = statusKey(status)

  if (key === "paid") return "bg-emerald-50 text-emerald-700 ring-emerald-100"
  if (key === "overdue") return "bg-red-50 text-red-700 ring-red-100"
  if (key === "draft") return "bg-slate-100 text-slate-700 ring-slate-200"

  return "bg-amber-50 text-amber-700 ring-amber-100"
}

function normalizeStaticDocument(item: typeof documents[number], t: ReturnType<typeof useLanguage>["t"]): DetailDocument {
  const positions = Array.isArray(item.items) && item.items.length
    ? item.items.map((position, index) => {
      const quantity = numberValue(position.quantity, 1)
      const netPrice = numberValue(position.netPrice, 0)

      return {
        id: `${item.id}-position-${index + 1}`,
        title: position.title || t("documents.detail.fallback.staticPositionTitle"),
        description: position.description,
        quantity,
        netPrice,
        total: quantity * netPrice
      }
    })
    : []

  const calculatedNet = positions.reduce((sum, position) => sum + position.total, 0)
  const grossTotal = numberValue(item.amount, calculatedNet * 1.19)
  const netTotal = calculatedNet || grossTotal / 1.19
  const vatTotal = grossTotal - netTotal

  return {
    id: item.id,
    number: item.number,
    customer: item.customer,
    customerEmail: item.customerEmail,
    type: item.type ?? "invoice",
    status: statusLabel(item.status ?? "open"),
    issueDate: formatDisplayDate(item.issueDate),
    dueDate: formatDisplayDate(item.dueDate),
    netTotal,
    vatTotal,
    grossTotal,
    positions: positions.length ? positions : [
      {
        id: "static-position",
        title: t("documents.detail.fallback.staticPositionTitle"),
        description: t("documents.detail.fallback.staticPositionDescription"),
        quantity: 1,
        netPrice: netTotal,
        total: netTotal
      }
    ],
    note: DEFAULT_DOCUMENT_NOTE
  }
}

function emptyFallbackDocument(id: string, t: ReturnType<typeof useLanguage>["t"]): DetailDocument {
  return {
    id,
    number: "Dokument",
    customer: t("documents.detail.fallback.unknownCustomer"),
    customerEmail: "",
    type: t("documents.detail.type.invoice"),
    status: "open",
    issueDate: "-",
    dueDate: "-",
    netTotal: 0,
    vatTotal: 0,
    grossTotal: 0,
    positions: [],
    note: DEFAULT_DOCUMENT_NOTE
  }
}

function normalizeApiInvoice(invoice: ApiInvoice, fallback: DetailDocument, t: ReturnType<typeof useLanguage>["t"], locale: string): DetailDocument {
  const positions = Array.isArray(invoice.positions)
    ? invoice.positions.map((item, index) => {
      const quantity = numberValue(item.quantity, 1)
      const netPrice = numberValue(item.netPrice, 0)

      return {
        id: item.id || `position-${index + 1}`,
        title: item.title || t("documents.detail.fallback.position"),
        description: item.description,
        quantity,
        netPrice,
        total: quantity * netPrice
      }
    })
    : []

  const calculatedNet = positions.reduce((sum, item) => sum + item.total, 0)
  const netTotal = numberValue(invoice.netTotal, calculatedNet)
  const vatTotal = numberValue(invoice.vatTotal, netTotal * 0.19)
  const grossTotal = numberValue(invoice.grossTotal, netTotal + vatTotal)

  return {
    id: invoice.id,
    number: invoice.number || fallback.number,
    customer: invoice.customer?.name || t("documents.detail.fallback.unknownCustomer"),
    customerEmail: invoice.customer?.email || "",
    type: invoice.type === "invoice" ? t("documents.detail.type.invoice") : invoice.type || fallback.type,
    status: statusLabel(invoice.status || fallback.status),
    issueDate: formatDisplayDate(invoice.issueDate, locale),
    dueDate: formatDisplayDate(invoice.dueDate, locale),
    netTotal,
    vatTotal,
    grossTotal,
    positions: positions.length ? positions : fallback.positions,
    note: invoice.notes || fallback.note || DEFAULT_DOCUMENT_NOTE
  }
}

function initialPaymentsForDocument(document: DetailDocument, existingPayments: PaymentEntry[] = []): PaymentEntry[] {
  const amount = document.grossTotal > 0 ? document.grossTotal : document.netTotal + document.vatTotal

  if (statusKey(document.status) !== "paid" || amount <= 0) return []

  const existingPayment = existingPayments[0]

  return [
    {
      id: existingPayment?.id ?? `${document.id}-payment-1`,
      date: existingPayment?.date ?? dateInputValue(new Date()),
      amount,
      method: existingPayment?.method ?? "Banküberweisung",
      reason: existingPayment?.reason ?? "Zahlungseingang Kontoauszug"
    }
  ]
}

export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const routeParams = useParams()
  const routeId = routeParams?.id
  const documentId = Array.isArray(routeId) ? routeId[0] : routeId ?? params.id
  const { language, t } = useLanguage()
  const locale = language === "en" ? "en-US" : "de-DE"

  const fallbackDocument = useMemo(
    () => {
      const staticDocument = documents.find((item) => item.id === documentId)

      return staticDocument ? normalizeStaticDocument(staticDocument, t) : emptyFallbackDocument(documentId, t)
    },
    [documentId, t]
  )

  const [doc, setDoc] = useState<DetailDocument>(fallbackDocument)
  const [showSendModal, setShowSendModal] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [downloadNotice, setDownloadNotice] = useState<{ type: "info" | "success" | "error"; text: string } | null>(null)
  const [sendTo, setSendTo] = useState(fallbackDocument.customerEmail)
  const [subject, setSubject] = useState(`${t("documents.detail.email.subjectPrefix")} ${fallbackDocument.number}`)
  const [message, setMessage] = useState(
    `${t("documents.detail.email.bodyPrefix")}\n\n${t("documents.detail.email.bodyMiddle")} ${fallbackDocument.number}.\n\n${t("documents.detail.email.bodyClosing")}`
  )
  const [, setEmailLog] = useState<EmailLogEntry[]>([])

  const [payments, setPayments] = useState<PaymentEntry[]>(() => initialPaymentsForDocument(fallbackDocument))
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [paymentDate, setPaymentDate] = useState(dateInputValue(new Date()))
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Banküberweisung")
  const [paymentReason, setPaymentReason] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      setDoc(fallbackDocument)
      setPayments(initialPaymentsForDocument(fallbackDocument))

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 8_000)

      try {
        const response = await fetch(`/api/invoice/get/${documentId}`, { signal: controller.signal })

        if (!response.ok) return

        const invoice = await response.json() as ApiInvoice
        const normalized = normalizeApiInvoice(invoice, fallbackDocument, t, locale)

        if (cancelled) return

        setDoc(normalized)
        setPayments((currentPayments) => initialPaymentsForDocument(normalized, currentPayments))
        setSendTo(normalized.customerEmail)
        setSubject(`${t("documents.detail.email.subjectPrefix")} ${normalized.number}`)
        setMessage(`${t("documents.detail.email.bodyPrefix")}\n\n${t("documents.detail.email.bodyMiddle")} ${normalized.number}.\n\n${t("documents.detail.email.bodyClosing")}`)
      } catch (error) {
        console.warn("Document detail loading failed.", error)
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    loadDocument()

    return () => {
      cancelled = true
    }
  }, [documentId, fallbackDocument, locale, t])

  useEffect(() => {
    if (!showSendModal && !showPaymentModal) return

    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = "hidden"
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  }, [showPaymentModal, showSendModal])

  const amount = doc.grossTotal
  const net = doc.netTotal
  const tax = doc.vatTotal
  const currentStatusKey = statusKey(doc.status)
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const openAmount = Math.max(amount - paidAmount, 0)
  const paymentProgress = amount > 0 ? Math.min(100, Math.max(0, (paidAmount / amount) * 100)) : 0
  const statusDetail =
    currentStatusKey === "draft"
      ? "Dokument vorbereitet"
      : currentStatusKey === "paid"
        ? `Bezahlt am ${payments[0] ? displayDate(payments[0].date, locale) : displayDate(doc.issueDate, locale)}`
        : currentStatusKey === "overdue"
          ? "Zahlung überfällig"
          : "Beim Kunden angekommen"
  const paymentMethods: PaymentMethod[] = ["Banküberweisung", "PayPal", "Karte", "Bar", "Sonstiges"]

  async function loadEmailLog() {
    try {
      const response = await fetch(`/api/email/log?documentId=${documentId}&limit=5`, { cache: "no-store" })
      const result = await response.json()

      if (result.ok && Array.isArray(result.entries)) {
        setEmailLog(result.entries)
      }
    } catch {
      setEmailLog([])
    }
  }

  useEffect(() => {
    loadEmailLog()
  }, [documentId])

  async function handleDownload() {
    if (downloadingPdf) return

    setDownloadingPdf(true)
    setDownloadNotice({ type: "info", text: t("documents.detail.notice.pdfCreating") })

    try {
      const response = await fetch(`/api/invoice/pdf/${documentId}`)

      if (!response.ok) {
        throw new Error(t("documents.detail.notice.pdfError"))
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${doc.number}.pdf`
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setDownloadNotice({ type: "success", text: t("documents.detail.notice.pdfSuccess") })
      window.setTimeout(() => {
        setDownloadNotice((current) => current?.type === "success" ? null : current)
      }, 2600)
    } catch (error) {
      setDownloadNotice({
        type: "error",
        text: error instanceof Error ? error.message : t("documents.detail.notice.pdfError")
      })
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleSendEmail() {
    if (sendingEmail) return

    setSendingEmail(true)
    setDownloadNotice({ type: "info", text: t("documents.detail.notice.emailSending") })

    try {
      const response = await fetch(`/api/invoice/send/${documentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: sendTo,
          subject,
          message
        })
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || t("documents.detail.notice.emailError"))
      }

      setDownloadNotice({ type: "success", text: t("documents.detail.notice.emailSuccess") })
      await loadEmailLog()
      setShowSendModal(false)
      window.setTimeout(() => {
        setDownloadNotice((current) => current?.type === "success" ? null : current)
      }, 2600)
    } catch (error) {
      setDownloadNotice({
        type: "error",
        text: error instanceof Error ? error.message : t("documents.detail.notice.emailError")
      })
      await loadEmailLog()
    } finally {
      setSendingEmail(false)
    }
  }

  async function handleShare() {
    const shareText = `${doc.number} · ${doc.customer}`
    if (navigator.share) {
      await navigator.share({ title: doc.number, text: shareText })
      return
    }

    await navigator.clipboard.writeText(shareText)
    alert(t("documents.detail.notice.shareCopied"))
  }

  function openPaymentModal(payment?: PaymentEntry) {
    if (payment) {
      setEditingPaymentId(payment.id)
      setPaymentDate(payment.date)
      setPaymentAmount(payment.amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
      setPaymentMethod(payment.method)
      setPaymentReason(payment.reason)
    } else {
      setEditingPaymentId(null)
      setPaymentDate(dateInputValue(new Date()))
      setPaymentAmount(openAmount > 0 ? openAmount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "")
      setPaymentMethod("Banküberweisung")
      setPaymentReason("")
    }

    setShowPaymentModal(true)
  }

  function closePaymentModal() {
    setShowPaymentModal(false)
    setEditingPaymentId(null)
  }

  function savePayment() {
    const parsedAmount = parseMoneyInput(paymentAmount)

    if (parsedAmount <= 0 || !paymentReason.trim()) return

    const nextPayment: PaymentEntry = {
      id: editingPaymentId ?? `payment-${Date.now()}`,
      date: paymentDate,
      amount: parsedAmount,
      method: paymentMethod,
      reason: paymentReason.trim()
    }

    setPayments((items) => {
      if (!editingPaymentId) return [nextPayment, ...items]

      return items.map((item) => item.id === editingPaymentId ? nextPayment : item)
    })
    closePaymentModal()
  }

  function deletePayment(id: string) {
    setPayments((items) => items.filter((item) => item.id !== id))
  }

  const actionButton =
    "inline-flex min-h-10 items-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-[#1f2937] transition hover:bg-[#e5ebf2]"

  return (
    <PageShell title={doc.number} description={`${doc.type ?? t("documents.detail.type.invoice")} · ${doc.customer}`}>
      <div className="space-y-6">
        <ContentCard>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/documents"
                className="text-xs font-semibold uppercase tracking-widest text-slate-400 no-underline hover:text-slate-900"
              >
                {t("documents.detail.back")}
              </Link>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                {doc.number}
              </h1>

              <p className="mt-2 text-base font-medium text-slate-500">
                {doc.customer}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/documents/${doc.id}/edit`} className={`${actionButton} no-underline`}>
                <Pencil className="h-4 w-4" />
                {t("documents.detail.actions.edit")}
              </Link>
              <button
                type="button"
                onClick={() => setShowSendModal(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--brand-lime)] px-4 py-2 text-sm font-bold text-black shadow-[0_10px_24px_rgba(211,255,49,0.28)] transition hover:scale-[1.01]"
              >
                <Mail className="h-4 w-4" />
                {t("documents.detail.modal.send.submit")}
              </button>
              <button type="button" onClick={() => window.print()} className={actionButton}>
                <Printer className="h-4 w-4" />
                {t("documents.detail.actions.print")}
              </button>
              <button type="button" onClick={handleShare} className={actionButton}>
                <Share2 className="h-4 w-4" />
                {t("documents.detail.actions.share")}
              </button>
              <button type="button" onClick={handleDownload} disabled={downloadingPdf} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--brand-lime)] px-4 py-2 text-sm font-bold text-black disabled:cursor-wait disabled:opacity-70">
                <Download className="h-4 w-4" />
                {downloadingPdf ? t("documents.detail.actions.downloadBusy") : t("documents.detail.actions.download")}
              </button>
            </div>
          </div>
        </ContentCard>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-6">
            <ContentCard title={t("documents.detail.cards.documentData.title")} description={t("documents.detail.cards.documentData.description")}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{t("documents.detail.labels.recipient")}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{doc.customer}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{t("documents.detail.labels.date")}</p>
                  <p className="mt-2 text-base font-bold text-slate-900">{doc.issueDate}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{t("documents.detail.labels.due")}</p>
                  <p className="mt-2 text-base font-bold text-slate-900">{doc.dueDate}</p>
                </div>
              </div>
            </ContentCard>

            <ContentCard title={t("documents.detail.cards.positions.title")} description={t("documents.detail.cards.positions.description")}>
              <div className="overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white">
                <table className="w-full">
                  <thead className="bg-[#f7f9fc] text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-5 py-4">{t("documents.detail.table.description")}</th>
                      <th className="px-5 py-4 text-right">{t("documents.detail.table.amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doc.positions.map((position) => (
                      <tr key={position.id} className="group border-t border-[#edf2f7] transition hover:bg-[#fbfcfe]">
                        <td className="px-5 py-5">
                          <p className="text-base font-bold text-slate-900">{position.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {position.quantity} x <Currency value={position.netPrice} />
                            {position.description ? ` · ${position.description}` : ""}
                          </p>
                        </td>
                        <td className="px-5 py-5 text-right text-base font-bold text-slate-900">
                          <Currency value={position.total} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-md">
                  <h3 className="text-sm font-extrabold text-slate-950">Hinweis</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    {doc.note || DEFAULT_DOCUMENT_NOTE}
                  </p>
                </div>
                <div className="w-full max-w-sm rounded-2xl bg-[#f7f9fc] p-5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{t("documents.detail.totals.net")}</span>
                    <span className="font-semibold text-slate-900"><Currency value={net} /></span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-slate-500">
                    <span>{t("documents.detail.totals.vat19")}</span>
                    <span className="font-semibold text-slate-900"><Currency value={tax} /></span>
                  </div>
                  <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-extrabold text-slate-950">
                    <span>{t("documents.detail.totals.total")}</span>
                    <Currency value={amount} />
                  </div>
                </div>
              </div>
            </ContentCard>
          </div>

          <div className="space-y-6">
            <ContentCard title={t("documents.detail.cards.status.title")} description={t("documents.detail.cards.status.description")}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-lime)] text-black">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <div>
                    <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ring-1 ${statusBadgeClass(doc.status)}`}>
                      {translateStatus(doc.status ?? "draft", t)}
                    </span>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{statusDetail}</p>
                  </div>
                </div>

                {currentStatusKey === "overdue" ? (
                  <div className="rounded-[26px] border border-red-200 bg-red-50 px-4 py-4 text-red-700">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-black">Zahlung überfällig</p>
                        <button
                          type="button"
                          onClick={() => window.open(`/api/reminder/pdf/${doc.id}`, "_blank", "noopener,noreferrer")}
                          className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                        >
                          Mahnung erstellen
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </ContentCard>

            <ContentCard>
              <div className="flex items-center justify-between gap-3">
                <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-950">
                  <CircleDollarSign className="h-5 w-5 text-slate-400" />
                  Zahlungen
                </h2>
                <button
                  type="button"
                  onClick={() => openPaymentModal()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-extrabold text-slate-900 transition hover:bg-[#e5ebf2]"
                >
                  <span className="text-lg leading-none">+</span>
                  Zahlung
                </button>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                  <span>Bezahlt</span>
                  <span className="font-black text-slate-950"><Currency value={paidAmount} /></span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-black" style={{ width: `${paymentProgress}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                  <span>Noch offen</span>
                  <span className="font-black text-slate-950"><Currency value={openAmount} /></span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {payments.length ? payments.map((payment) => (
                  <div key={payment.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[24px] bg-[#f7f9fc] px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950">{displayDate(payment.date, locale)}</p>
                      <p className="truncate text-xs font-extrabold uppercase tracking-wider text-slate-500">{payment.method}</p>
                    </div>
                    <div className="flex min-w-[132px] shrink-0 items-center justify-end gap-2">
                      <span className="text-sm font-black text-slate-950"><Currency value={payment.amount} /></span>
                      <button
                        type="button"
                        onClick={() => openPaymentModal(payment)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-300 transition hover:bg-white hover:text-slate-950 hover:shadow-md"
                        aria-label="Zahlung bearbeiten"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePayment(payment.id)}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-300 transition hover:bg-red-50 hover:text-red-600 hover:ring-red-100 hover:shadow-md"
                        aria-label="Zahlung loeschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <p className="rounded-2xl bg-[#f7f9fc] px-4 py-3 text-sm font-bold text-slate-500">
                    Noch keine Zahlung erfasst.
                  </p>
                )}
              </div>
            </ContentCard>

            <ContentCard>
              <h2 className="text-lg font-extrabold text-slate-950">Interne Notiz</h2>
              <textarea
                placeholder="Notiz zu diesem Vorgang..."
                className="mt-4 min-h-24 w-full resize-none rounded-[26px] border border-[var(--brand-lime)] bg-[#fffef5] px-5 py-4 text-sm font-semibold text-slate-800 outline-none transition focus:ring-2 focus:ring-[var(--brand-lime)]"
              />
            </ContentCard>

            <ContentCard>
              <h2 className="text-lg font-extrabold text-slate-950">Verlauf</h2>
              <div className="mt-5 space-y-4 border-l border-slate-200 pl-5">
                <div className="relative">
                  <span className="absolute -left-[1.55rem] top-1 h-2 w-2 rounded-full bg-slate-200" />
                  <p className="text-xs font-bold text-slate-400">{displayDate(doc.issueDate, locale)}</p>
                  <p className="text-sm font-extrabold text-slate-900">Rechnung erstellt</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-[1.55rem] top-1 h-2 w-2 rounded-full bg-slate-200" />
                  <p className="text-xs font-bold text-slate-400">16.10.2023</p>
                  <p className="text-sm font-extrabold text-slate-900">Per E-Mail versendet</p>
                </div>
                {payments[0] ? (
                  <div className="relative">
                    <span className="absolute -left-[1.55rem] top-1 h-2 w-2 rounded-full bg-slate-200" />
                    <p className="text-xs font-bold text-slate-400">{displayDate(payments[0].date, locale)}</p>
                    <p className="text-sm font-extrabold text-slate-900">Zahlung vollstaendig erhalten</p>
                  </div>
                ) : null}
              </div>
            </ContentCard>
          </div>
        </div>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <h3 className="inline-flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <Mail className="h-4 w-4" />
                {t("documents.detail.modal.send.title")}
              </h3>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f6fa] text-slate-600 transition hover:bg-slate-200"
                aria-label={t("documents.detail.modal.send.close")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-16rem)] space-y-3 overflow-y-auto px-5 py-5">
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-500">{t("documents.detail.modal.send.toPlaceholder")}</span>
                <input value={sendTo} onChange={(event) => setSendTo(event.target.value)} className="w-full rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-500">{t("documents.detail.modal.send.subjectPlaceholder")}</span>
                <input value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900" />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-500">{t("documents.detail.modal.send.messagePlaceholder")}</span>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-28 w-full resize-none rounded-[22px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-slate-900" />
              </label>
              <div className="inline-flex w-full items-center gap-2 rounded-full bg-[#f7f9fc] px-4 py-2.5 text-xs font-bold text-slate-500">
                <Paperclip className="h-4 w-4" />
                <span className="truncate">Angehängt: {doc.number}.pdf</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 bg-[#f8fafc] px-5 py-4">
              <button type="button" onClick={() => setShowSendModal(false)} className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-slate-600 ring-1 ring-slate-200">
                {t("documents.detail.modal.send.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime)] px-6 py-2.5 text-sm font-extrabold text-black shadow-[0_10px_24px_rgba(211,255,49,0.26)] disabled:cursor-wait disabled:opacity-70"
              >
                <Send className="h-4 w-4" />
                {sendingEmail ? t("documents.detail.modal.send.sending") : t("documents.detail.modal.send.submit")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/45 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-hidden rounded-[30px] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.32)]">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {editingPaymentId ? "Zahlung bearbeiten" : "Zahlung erfassen"}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Wird im Audit-Log gespeichert (GoBD).
                </p>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f3f6fa] text-slate-600 transition hover:bg-slate-200"
                aria-label="Zahlungsfenster schliessen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-16rem)] space-y-4 overflow-y-auto px-5 py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-slate-500">Datum</span>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(event) => setPaymentDate(event.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-extrabold text-slate-500">Betrag (EUR)</span>
                  <input
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="z.B. 250,00"
                    inputMode="decimal"
                    className="w-full rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-500">Methode</span>
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  className="w-full rounded-full border border-slate-200 bg-[#f8fafc] px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-extrabold text-slate-500">Grund (Pflicht)</span>
                <textarea
                  value={paymentReason}
                  onChange={(event) => setPaymentReason(event.target.value)}
                  placeholder="z.B. Zahlungseingang Kontoauszug, Teilzahlung, ..."
                  className="min-h-24 w-full resize-none rounded-[22px] border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm font-semibold leading-6 text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 bg-[#f8fafc] px-5 py-4">
              <button type="button" onClick={closePaymentModal} className="rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-slate-600 ring-1 ring-slate-200">
                Abbrechen
              </button>
              <button
                type="button"
                onClick={savePayment}
                disabled={parseMoneyInput(paymentAmount) <= 0 || !paymentReason.trim()}
                className="rounded-full bg-black px-6 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {downloadNotice && (
        <div
          className={`fixed bottom-6 right-6 z-[120] max-w-sm rounded-2xl px-5 py-4 text-sm font-black shadow-[0_18px_45px_rgba(15,23,42,0.18)] ${
            downloadNotice.type === "error"
              ? "bg-red-50 text-red-700 ring-1 ring-red-100"
              : downloadNotice.type === "success"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                : "bg-slate-950 text-white"
          }`}
          role="status"
          aria-live="polite"
        >
          {downloadNotice.text}
        </div>
      )}
    </PageShell>
  )
}
