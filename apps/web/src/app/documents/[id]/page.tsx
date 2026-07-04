"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Mail,
  Paperclip,
  Pencil,
  Printer,
  Send,
  Share2,
  Trash2
} from "lucide-react"
import { ContentCard, Currency } from "@dream-invoice/ui"
import { StandardModal } from "@/components/ui/StandardModal"

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
  customerId?: string | null
  customerEmail: string
  type: string
  status: string
  issueDate: string
  issueDateRaw?: string | null
  dueDate: string
  dueDateRaw?: string | null
  netTotal: number
  vatTotal: number
  grossTotal: number
  positions: DocumentPosition[]
  note?: string | null
}

type EmailLogEntry = {
  id: string
  createdAt: string
  type: "test" | "invoice" | "offer"
  status: "success" | "error"
  provider?: "smtp" | "resend" | "disabled" | "unknown"
  to: string
  subject: string
  documentId?: string
  documentNumber?: string
  messageId?: string | null
  error?: string
}

type EmailSettings = {
  provider?: "disabled" | "smtp" | "resend" | null
  fromEmail?: string | null
  smtpHost?: string | null
  resendApiKey?: string | null
}

type ApiInvoicePosition = {
  id: string
  title: string
  description?: string | null
  quantity: unknown
  netPrice: unknown
}

type ApiPayment = {
  id: string
  amount?: unknown
  method?: string | null
  reference?: string | null
  paidAt?: string | Date | null
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
    id?: string | null
    name?: string | null
    email?: string | null
    street?: string | null
    zip?: string | null
    city?: string | null
    country?: string | null
  } | null
  positions?: ApiInvoicePosition[]
  payments?: ApiPayment[]
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
  if (normalized === "accepted" || normalized === "angenommen") return "accepted"
  if (normalized === "rejected" || normalized === "abgelehnt") return "rejected"

  return status
}

function statusKey(status: string) {
  const normalized = status.toLowerCase()

  if (normalized.includes("bezahlt") || normalized.includes("paid")) return "paid"
  if (normalized.includes("überfällig") || normalized.includes("overdue")) return "overdue"
  if (normalized.includes("gesendet") || normalized.includes("sent")) return "sent"
  if (normalized.includes("offen") || normalized.includes("open")) return "open"
  if (normalized.includes("entwurf") || normalized.includes("draft")) return "draft"
  if (normalized.includes("angenommen") || normalized.includes("accepted")) return "accepted"
  if (normalized.includes("abgelehnt") || normalized.includes("rejected")) return "rejected"

  return "open"
}

function statusBadgeClass(status: string) {
  const key = statusKey(status)

  if (key === "paid" || key === "accepted") return "bg-emerald-50 text-emerald-700 ring-emerald-100"
  if (key === "rejected") return "bg-slate-100 text-slate-700 ring-slate-200"
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
    customerId: null,
    issueDate: formatDisplayDate(item.issueDate),
    issueDateRaw: dateInputValue(item.issueDate),
    dueDate: formatDisplayDate(item.dueDate),
    dueDateRaw: dateInputValue(item.dueDate),
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

function normalizeApiPayment(payment: ApiPayment): PaymentEntry {
  return {
    id: payment.id,
    date: dateInputValue(payment.paidAt),
    amount: numberValue(payment.amount),
    method: payment.method && ["Banküberweisung", "PayPal", "Karte", "Bar", "Sonstiges"].includes(payment.method)
      ? payment.method as PaymentMethod
      : "Banküberweisung",
    reason: payment.reference || "Zahlungseingang Kontoauszug"
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
    customerId: invoice.customer?.id || null,
    customerEmail: invoice.customer?.email || "",
    type: invoice.type === "invoice" ? t("documents.detail.type.invoice") : invoice.type || fallback.type,
    status: statusLabel(invoice.status || fallback.status),
    issueDate: formatDisplayDate(invoice.issueDate, locale),
    issueDateRaw: dateInputValue(invoice.issueDate),
    dueDate: formatDisplayDate(invoice.dueDate, locale),
    dueDateRaw: dateInputValue(invoice.dueDate),
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
  const fallbackSubjectPrefix = fallbackDocument.type === "offer" ? "Angebot" : "Rechnung"
  const [subject, setSubject] = useState(`${fallbackSubjectPrefix} ${fallbackDocument.number}`)
  const [message, setMessage] = useState(
    `${t("documents.detail.email.bodyPrefix")}\n\n${t("documents.detail.email.bodyMiddle")} ${fallbackDocument.number}.\n\n${t("documents.detail.email.bodyClosing")}`
  )
  const [, setEmailLog] = useState<EmailLogEntry[]>([])
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null)
  const [emailSettingsLoaded, setEmailSettingsLoaded] = useState(false)

  const [payments, setPayments] = useState<PaymentEntry[]>(() => initialPaymentsForDocument(fallbackDocument))
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [paymentDate, setPaymentDate] = useState(dateInputValue(new Date()))
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Banküberweisung")
  const [paymentReason, setPaymentReason] = useState("")

  async function reloadDocument(options: { resetFallback?: boolean } = {}) {
    if (options.resetFallback) {
      setDoc(fallbackDocument)
      setPayments(initialPaymentsForDocument(fallbackDocument))
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 8_000)

    try {
      const response = await fetch(`/api/invoice/get/${documentId}`, { signal: controller.signal })

      if (!response.ok) return

      const invoice = await response.json() as ApiInvoice
      const normalized = normalizeApiInvoice(invoice, fallbackDocument, t, locale)

      setDoc(normalized)
      setPayments(Array.isArray(invoice.payments) && invoice.payments.length
        ? invoice.payments.map(normalizeApiPayment)
        : initialPaymentsForDocument(normalized)
      )
      setSendTo(normalized.customerEmail)
      setSubject(`${String(normalized.type).toLowerCase() === "offer" ? "Angebot" : "Rechnung"} ${normalized.number}`)
      setMessage(`${t("documents.detail.email.bodyPrefix")}\n\n${t("documents.detail.email.bodyMiddle")} ${normalized.number}.\n\n${t("documents.detail.email.bodyClosing")}`)
    } catch (error) {
      console.warn("Document detail loading failed.", error)
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      if (cancelled) return
      await reloadDocument({ resetFallback: true })
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
  const isOffer = String(doc.type).toLowerCase() === "offer"
  const currentStatusKey = statusKey(doc.status)
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const openAmount = Math.max(amount - paidAmount, 0)
  const paymentProgress = amount > 0 ? Math.min(100, Math.max(0, (paidAmount / amount) * 100)) : 0
  const statusDetail =
    currentStatusKey === "draft"
      ? "Dokument vorbereitet"
      : currentStatusKey === "paid"
        ? `Bezahlt am ${payments[0] ? displayDate(payments[0].date, locale) : displayDate(doc.issueDate, locale)}`
        : currentStatusKey === "accepted"
          ? "Angebot angenommen"
          : currentStatusKey === "rejected"
            ? "Angebot abgelehnt"
            : currentStatusKey === "overdue"
              ? "Zahlung überfällig"
              : "Beim Kunden angekommen"
  const paymentMethods: PaymentMethod[] = ["Banküberweisung", "PayPal", "Karte", "Bar", "Sonstiges"]
  const emailTransportReady = emailSettingsLoaded && Boolean(
    emailSettings && (
      emailSettings.provider === "smtp" && emailSettings.smtpHost?.trim() && emailSettings.fromEmail?.trim()
        || emailSettings.provider === "resend" && emailSettings.resendApiKey?.trim() && emailSettings.fromEmail?.trim()
    )
  )

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

  useEffect(() => {
    let cancelled = false

    async function loadEmailSettings() {
      try {
        const response = await fetch("/api/settings/email", { cache: "no-store" })
        const result = await response.json().catch(() => null)

        if (cancelled) return

        if (response.ok && result?.ok && result.settings) {
          setEmailSettings(result.settings as EmailSettings)
        }
      } catch {
        // Keep transport disabled until settings are available.
      } finally {
        if (!cancelled) {
          setEmailSettingsLoaded(true)
        }
      }
    }

    void loadEmailSettings()

    return () => {
      cancelled = true
    }
  }, [])

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

  async function handleOfferStatus(nextStatus: "accepted" | "rejected") {
    if (!isOffer) return

    const response = await fetch(`/api/invoice/update/${documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number: doc.number,
        date: doc.issueDateRaw || doc.issueDate,
        dueDate: doc.dueDateRaw || doc.dueDate,
        customerId: doc.customerId || undefined,
        customerName: doc.customer,
        customerEmail: doc.customerEmail,
        status: nextStatus,
        note: doc.note,
        taxRate: 0.19,
        tip: 0,
        items: doc.positions.map((position) => ({
          name: position.title,
          quantity: position.quantity,
          price: position.netPrice,
          category: position.description || null,
          vatRate: 19
        }))
      })
    })

    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.success) {
      throw new Error(result?.error || "Angebot konnte nicht aktualisiert werden.")
    }

    await reloadDocument({ resetFallback: false })
    setDownloadNotice({
      type: "success",
      text: nextStatus === "accepted" ? "Angebot wurde angenommen." : "Angebot wurde abgelehnt."
    })
  }

  async function handleOfferConvert() {
    if (!isOffer) return

    const response = await fetch("/api/invoice/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: doc.customerId || undefined,
        customerName: doc.customer,
        customerEmail: doc.customerEmail,
        status: "draft",
        date: doc.issueDateRaw || doc.issueDate,
        dueDate: doc.dueDateRaw || doc.dueDate,
        note: doc.note || DEFAULT_DOCUMENT_NOTE,
        taxRate: 0.19,
        tip: 0,
        items: doc.positions.map((position) => ({
          name: position.title,
          quantity: position.quantity,
          price: position.netPrice,
          category: position.description || null,
          vatRate: 19
        }))
      })
    })

    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.invoice?.id) {
      throw new Error(result?.error || "Rechnung konnte nicht erstellt werden.")
    }

    window.location.assign(`/documents/${result.invoice.id}/edit`)
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

  // Reminder preparation is exposed via the settings link in the overdue card.

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

  async function savePayment() {
    const parsedAmount = parseMoneyInput(paymentAmount)

    if (parsedAmount <= 0 || !paymentReason.trim()) return

    const optimisticPayment: PaymentEntry = {
      id: editingPaymentId ?? `payment-${Date.now()}`,
      date: paymentDate,
      amount: parsedAmount,
      method: paymentMethod,
      reason: paymentReason.trim()
    }

    setPayments((items) => {
      if (!editingPaymentId) return [optimisticPayment, ...items]

      return items.map((item) => item.id === editingPaymentId ? optimisticPayment : item)
    })
    closePaymentModal()

    try {
      const response = await fetch(`/api/invoice/payments/${documentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: editingPaymentId ?? undefined,
          amount: parsedAmount,
          paidAt: paymentDate,
          method: paymentMethod,
          reason: paymentReason.trim()
        })
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Zahlung konnte nicht gespeichert werden.")
      }

      if (result.invoice?.payments) {
        setPayments(result.invoice.payments.map(normalizeApiPayment))
      }
      if (result.invoice) {
        setDoc(normalizeApiInvoice(result.invoice, doc, t, locale))
      }
    } catch (error) {
      setDownloadNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Zahlung konnte nicht gespeichert werden."
      })
      await reloadDocument()
    }
  }

  async function deletePayment(id: string) {
    const previousPayments = payments
    setPayments((items) => items.filter((item) => item.id !== id))

    try {
      const response = await fetch(`/api/invoice/payments/${documentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: id })
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Zahlung konnte nicht geloescht werden.")
      }

      if (result.invoice?.payments) {
        setPayments(result.invoice.payments.map(normalizeApiPayment))
      }
      if (result.invoice) {
        setDoc(normalizeApiInvoice(result.invoice, doc, t, locale))
      }
    } catch (error) {
      setPayments(previousPayments)
      setDownloadNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Zahlung konnte nicht geloescht werden."
      })
    }
  }

  const actionPillButton =
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-extrabold text-[#1f2937] transition hover:bg-[#e5ebf2]"
  const actionIconButton =
    "inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200 shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:bg-[#f7f9fc] hover:text-slate-950"
  const primaryActionButton =
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--brand-lime)] px-5 py-2 text-sm font-extrabold text-black shadow-[0_10px_24px_rgba(211,255,49,0.28)] transition hover:scale-[1.01]"

  return (
    <div className="invoice-shell-3d overflow-hidden rounded-[36px] border border-[#e3e9f1] bg-white">
      <div className="border-b border-[#edf2f7] px-5 py-6 sm:px-7 lg:px-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                href="/documents"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-x-0.5 hover:bg-black hover:text-white"
                aria-label={t("documents.detail.back")}
                title={t("documents.detail.back")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
                  {doc.number}
                </h1>
                  <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ring-1 ${statusBadgeClass(doc.status)}`}>
                    {translateStatus(doc.status ?? "draft", t)}
                  </span>
                </div>

                <p className="mt-2 text-base font-medium text-slate-500">
                  {doc.customer}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link href={`/documents/${doc.id}/edit`} className={`${actionPillButton} no-underline`}>
                <Pencil className="h-4 w-4" />
                {t("documents.detail.actions.edit")}
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloadingPdf}
                  className={`${actionIconButton} disabled:cursor-wait disabled:opacity-60`}
                  title={downloadingPdf ? t("documents.detail.actions.downloadBusy") : t("documents.detail.actions.download")}
                  aria-label={downloadingPdf ? t("documents.detail.actions.downloadBusy") : t("documents.detail.actions.download")}
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={actionIconButton}
                  title={t("documents.detail.actions.print")}
                  aria-label={t("documents.detail.actions.print")}
                >
                  <Printer className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className={actionIconButton}
                  title={t("documents.detail.actions.share")}
                  aria-label={t("documents.detail.actions.share")}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {isOffer ? (
                <>
                  <button type="button" onClick={() => void handleOfferStatus("accepted")} className={actionPillButton}>Angebot annehmen</button>
                  <button type="button" onClick={() => void handleOfferStatus("rejected")} className={actionPillButton}>Angebot ablehnen</button>
                  <button type="button" onClick={() => void handleOfferConvert()} className={primaryActionButton}>In Rechnung umwandeln</button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setShowSendModal(true)}
                disabled={!emailTransportReady}
                className={`${primaryActionButton} disabled:cursor-not-allowed disabled:opacity-70`}
                title={emailTransportReady ? "" : "SMTP zuerst in den E-Mail-Einstellungen konfigurieren."}
              >
                <Mail className="h-4 w-4" />
                {isOffer ? "Angebot per E-Mail senden" : t("documents.detail.modal.send.submit")}
              </button>
            </div>
            {!emailTransportReady ? (
              <p className="mt-3 text-xs font-semibold text-slate-500">E-Mail-Versand ist erst nach SMTP-Konfiguration aktiv.</p>
            ) : null}
        </div>
      </div>

      <div className="grid gap-7 bg-white px-5 py-7 sm:px-7 lg:px-9 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="rounded-[30px] border border-[#e5eaf0] bg-[#f8fafc] p-5 sm:p-7">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{t("documents.detail.labels.recipient")}</p>
              <p className="mt-3 text-xl font-extrabold text-slate-950">{doc.customer}</p>
              <p className="mt-1 text-base font-semibold text-slate-500">{doc.customerEmail}</p>
            </div>
            <div className="min-w-[140px]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{t("documents.detail.labels.date")}</p>
              <p className="mt-3 text-lg font-extrabold text-slate-950">{doc.issueDate}</p>
            </div>
            <div className="min-w-[140px]">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">{t("documents.detail.labels.due")}</p>
              <p className={`mt-3 text-lg font-extrabold ${currentStatusKey === "overdue" ? "text-red-500" : "text-slate-950"}`}>{doc.dueDate}</p>
            </div>
          </div>

          <div className="my-8 border-t border-dashed border-[#e2e8f0]" />

          <div className="overflow-hidden rounded-[24px] border border-[#e5eaf0] bg-white">
            <table className="w-full">
              <thead className="text-left text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">{t("documents.detail.table.description")}</th>
                  <th className="hidden px-5 py-4 text-right sm:table-cell">Menge</th>
                  <th className="hidden px-5 py-4 text-right md:table-cell">Einzel</th>
                  <th className="px-5 py-4 text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody>
                {doc.positions.map((position) => (
                  <tr key={position.id} className="border-t border-[#edf2f7]">
                    <td className="px-5 py-5">
                      <p className="text-base font-extrabold text-slate-950">{position.title}</p>
                      {position.description ? (
                        <p className="mt-1 text-sm font-semibold text-slate-500">{position.description}</p>
                      ) : null}
                      <p className="mt-2 text-xs font-bold text-slate-400 sm:hidden">
                        {position.quantity} x <Currency value={position.netPrice} />
                      </p>
                    </td>
                    <td className="hidden px-5 py-5 text-right text-base font-bold text-slate-500 sm:table-cell">{position.quantity}</td>
                    <td className="hidden px-5 py-5 text-right text-base font-bold text-slate-500 md:table-cell"><Currency value={position.netPrice} /></td>
                    <td className="px-5 py-5 text-right text-base font-extrabold text-slate-950"><Currency value={position.total} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-end">
            <div>
              <h3 className="text-sm font-extrabold text-slate-950">Hinweis</h3>
              <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                {doc.note || DEFAULT_DOCUMENT_NOTE}
              </p>
            </div>
            <div className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-[#e5eaf0]">
              <div className="flex justify-between text-sm font-semibold text-slate-500">
                <span>{t("documents.detail.totals.net")}</span>
                <span className="text-slate-900"><Currency value={net} /></span>
              </div>
              <div className="mt-3 flex justify-between text-sm font-semibold text-slate-500">
                <span>{t("documents.detail.totals.vat19")}</span>
                <span className="text-slate-900"><Currency value={tax} /></span>
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-2xl font-extrabold text-slate-950">
                <span>{t("documents.detail.totals.total")}</span>
                <Currency value={amount} />
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <ContentCard title={t("documents.detail.cards.status.title")}>
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
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">7 Tage</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">14 Tage</span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-red-700 ring-1 ring-red-200">30 Tage</span>
                      </div>
                      <Link
                        href="/settings/reminders"
                        className="mt-3 inline-flex rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                      >
                        Mahnungen vorbereiten
                      </Link>
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
        </aside>
      </div>

      {showSendModal && (
        <StandardModal
          title={isOffer ? "Angebot als PDF senden" : t("documents.detail.modal.send.title")}
          icon={<Mail className="h-4 w-4" />}
          onClose={() => setShowSendModal(false)}
          width={520}
          bodyClassName="space-y-3"
          footer={(
            <>
              <button type="button" onClick={() => setShowSendModal(false)}>
                {t("documents.detail.modal.send.cancel")}
              </button>
              <button type="button" onClick={handleSendEmail} disabled={sendingEmail}>
                <Send className="h-4 w-4" />
                {sendingEmail ? t("documents.detail.modal.send.sending") : t("documents.detail.modal.send.submit")}
              </button>
            </>
          )}
          closeLabel={t("documents.detail.modal.send.close")}
        >
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
        </StandardModal>
      )}

      {showPaymentModal && (
        <StandardModal
          title={editingPaymentId ? "Zahlung bearbeiten" : "Zahlung erfassen"}
          description="Wird im Audit-Log gespeichert (GoBD)."
          onClose={closePaymentModal}
          width={520}
          bodyClassName="space-y-4"
          footer={(
            <>
              <button type="button" onClick={closePaymentModal}>Abbrechen</button>
              <button type="button" onClick={savePayment} disabled={parseMoneyInput(paymentAmount) <= 0 || !paymentReason.trim()}>
                Speichern
              </button>
            </>
          )}
          closeLabel="Zahlungsfenster schliessen"
        >
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
        </StandardModal>
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
    </div>
  )
}
