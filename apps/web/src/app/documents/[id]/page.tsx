"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  ExternalLink,
  Mail,
  Pencil,
  Plus,
  Printer,
  Send,
  Share2,
  Trash2
} from "lucide-react"
import { ContentCard, Currency, PageShell } from "@invoice-platform/ui"

import { documents } from "@/data/invoice-data"
import { translateStatus, useLanguage } from "@/lib/i18n"

type DocumentDetailPageProps = {
  params: {
    id: string
  }
}

type BankAccount = {
  id: string
  bank: string
  iban: string
  bic: string
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

type EmailSettingsState = {
  provider: "disabled" | "smtp" | "resend"
  fromEmail: string
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
  customer?: {
    name?: string | null
    email?: string | null
  } | null
  positions?: ApiInvoicePosition[]
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

function formatLogDate(value: string, locale = "de-DE") {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)
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
  const grossTotal = numberValue(item.amount, 0)
  const netTotal = grossTotal / 1.19
  const vatTotal = grossTotal - netTotal

  return {
    id: item.id,
    number: item.number,
    customer: item.customer,
    customerEmail: "kunde@example.com",
    type: item.type ?? "invoice",
    status: statusLabel(item.status ?? "open"),
    issueDate: "15.10.2023",
    dueDate: "29.10.2023",
    netTotal,
    vatTotal,
    grossTotal,
    positions: [
      {
        id: "static-position",
        title: t("documents.detail.fallback.staticPositionTitle"),
        description: t("documents.detail.fallback.staticPositionDescription"),
        quantity: 1,
        netPrice: netTotal,
        total: netTotal
      }
    ]
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
    positions: positions.length ? positions : fallback.positions
  }
}

export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const routeParams = useParams()
  const routeId = routeParams?.id
  const documentId = Array.isArray(routeId) ? routeId[0] : routeId ?? params.id
  const { language, t } = useLanguage()
  const locale = language === "en" ? "en-US" : "de-DE"

  const fallbackDocument = useMemo(
    () => normalizeStaticDocument(documents.find((item) => item.id === documentId) ?? documents[0], t),
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
  const [emailLog, setEmailLog] = useState<EmailLogEntry[]>([])
  const [emailSettings, setEmailSettings] = useState<EmailSettingsState | null>(null)

  const [editingBankId, setEditingBankId] = useState<string | null>("main")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "main",
      bank: "Hausbank",
      iban: "DE89 3704 0044 0532 0130 00",
      bic: "COBADEFFXXX"
    }
  ])

  const [newBank, setNewBank] = useState("")
  const [newIban, setNewIban] = useState("")
  const [newBic, setNewBic] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      setDoc(fallbackDocument)

      try {
        const response = await fetch(`/api/invoice/get/${documentId}`)

        if (!response.ok) return

        const invoice = await response.json() as ApiInvoice
        const normalized = normalizeApiInvoice(invoice, fallbackDocument, t, locale)

        if (cancelled) return

        setDoc(normalized)
        setSendTo(normalized.customerEmail)
        setSubject(`${t("documents.detail.email.subjectPrefix")} ${normalized.number}`)
        setMessage(`${t("documents.detail.email.bodyPrefix")}\n\n${t("documents.detail.email.bodyMiddle")} ${normalized.number}.\n\n${t("documents.detail.email.bodyClosing")}`)
      } catch {
        // Demo-Dokumente bleiben als lokaler Fallback sichtbar.
      }
    }

    loadDocument()

    return () => {
      cancelled = true
    }
  }, [documentId, fallbackDocument, locale, t])

  const amount = doc.grossTotal
  const net = doc.netTotal
  const tax = doc.vatTotal
  const latestEmailLog = emailLog[0]
  const emailIsConfigured = Boolean(emailSettings && emailSettings.provider !== "disabled" && emailSettings.fromEmail)
  const currentStatusKey = statusKey(doc.status)
  const statusSteps = [
    {
      key: "draft",
      label: t("documents.detail.status.draft.label"),
      description: t("documents.detail.status.draft.description"),
      icon: Pencil,
      done: true
    },
    {
      key: "sent",
      label: t("documents.detail.status.sent.label"),
      description: t("documents.detail.status.sent.description"),
      icon: Send,
      done: ["sent", "open", "overdue", "paid"].includes(currentStatusKey)
    },
    {
      key: "paid",
      label: t("documents.detail.status.paid.label"),
      description: t("documents.detail.status.paid.description"),
      icon: CircleDollarSign,
      done: currentStatusKey === "paid"
    }
  ]
  const nextStatusAction =
    currentStatusKey === "draft"
      ? t("documents.detail.nextAction.draft")
      : currentStatusKey === "paid"
        ? t("documents.detail.nextAction.paid")
        : currentStatusKey === "overdue"
          ? t("documents.detail.nextAction.overdue")
          : t("documents.detail.nextAction.open")

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
        const result = await response.json()

        if (!cancelled && result.ok && result.settings) {
          setEmailSettings({
            provider: result.settings.provider || "disabled",
            fromEmail: result.settings.fromEmail || ""
          })
        }
      } catch {
        if (!cancelled) {
          setEmailSettings({ provider: "disabled", fromEmail: "" })
        }
      }
    }

    loadEmailSettings()

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

  async function handleShare() {
    const shareText = `${doc.number} · ${doc.customer}`
    if (navigator.share) {
      await navigator.share({ title: doc.number, text: shareText })
      return
    }

    await navigator.clipboard.writeText(shareText)
    alert(t("documents.detail.notice.shareCopied"))
  }

  function updateBankAccount(id: string, field: keyof BankAccount, value: string) {
    setBankAccounts((items) =>
      items.map((item) => item.id === id ? { ...item, [field]: value } : item)
    )
  }

  function deleteBankAccount(id: string) {
    setBankAccounts((items) => items.filter((item) => item.id !== id))
    if (editingBankId === id) {
      setEditingBankId(null)
    }
  }

  function addBankAccount() {
    if (!newBank.trim() && !newIban.trim() && !newBic.trim()) return

    const id = `bank-${Date.now()}`
    setBankAccounts((items) => [
      ...items,
      {
        id,
        bank: newBank.trim() || t("documents.detail.bank.newBankFallback"),
        iban: newIban.trim() || t("documents.detail.bank.ibanFallback"),
        bic: newBic.trim() || t("documents.detail.bank.bicFallback")
      }
    ])

    setEditingBankId(id)
    setNewBank("")
    setNewIban("")
    setNewBic("")
  }

  const actionButton =
    "inline-flex min-h-10 items-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-[#1f2937] transition hover:bg-[#e5ebf2]"

  const iconButton =
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f6fa] text-slate-600 ring-1 ring-slate-200 transition hover:bg-white hover:text-slate-950"

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
              {emailIsConfigured ? (
                <button type="button" onClick={() => setShowSendModal(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                  <Mail className="h-4 w-4" />
                  {t("documents.detail.actions.email")}
                </button>
              ) : (
                <Link href="/settings/email" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white no-underline">
                  <ExternalLink className="h-4 w-4" />
                  {t("documents.detail.actions.setupEmail")}
                </Link>
              )}
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
                      <tr key={position.id} className="border-t border-[#edf2f7]">
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

              <div className="mt-5 flex justify-end">
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
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex rounded-full px-4 py-2 text-sm font-black ring-1 ${statusBadgeClass(doc.status)}`}>
                  {translateStatus(doc.status ?? "draft", t)}
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {t("documents.detail.workflow")}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {statusSteps.map((step, index) => {
                  const Icon = step.done ? CheckCircle2 : step.icon

                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 ${step.done ? "bg-[var(--brand-lime)] text-black ring-[var(--brand-lime)]" : "bg-white text-slate-400 ring-slate-200"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {index < statusSteps.length - 1 ? (
                          <span className={`mt-2 h-8 w-px ${step.done ? "bg-[var(--brand-lime)]" : "bg-slate-200"}`} />
                        ) : null}
                      </div>

                      <div className="min-w-0 pb-3">
                        <p className="text-sm font-extrabold text-slate-950">{step.label}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="mt-2 rounded-2xl bg-[#f7f9fc] px-4 py-3 text-sm font-bold text-slate-600">
                {nextStatusAction}
              </p>
            </ContentCard>

            <ContentCard title={t("documents.detail.cards.nextActions.title")} description={t("documents.detail.cards.nextActions.description")}>
              <div className="grid gap-3">
                <Link href={`/documents/${doc.id}/edit`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-extrabold text-slate-800 no-underline hover:bg-[#e5ebf2]">
                  <Pencil className="h-4 w-4" />
                {t("documents.detail.actions.edit")}
              </Link>

                {emailIsConfigured ? (
                  <button type="button" onClick={() => setShowSendModal(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-extrabold text-white">
                    <Mail className="h-4 w-4" />
                    {currentStatusKey === "draft" ? t("documents.detail.actions.sendByEmail") : t("documents.detail.actions.resendEmail")}
                  </button>
                ) : (
                  <Link href="/settings/email" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-extrabold text-white no-underline">
                    <ExternalLink className="h-4 w-4" />
                    E-Mail einrichten
                  </Link>
                )}

                <button type="button" onClick={handleDownload} disabled={downloadingPdf} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand-lime)] px-4 py-2 text-sm font-extrabold text-black disabled:cursor-wait disabled:opacity-70">
                  <Download className="h-4 w-4" />
                  {downloadingPdf ? t("documents.detail.actions.downloadBusyLong") : t("documents.detail.actions.downloadPdf")}
                </button>

                {currentStatusKey === "overdue" ? (
                  <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-extrabold text-red-700 ring-1 ring-red-100">
                    <Clock3 className="h-4 w-4" />
                    {t("documents.detail.actions.prepareReminder")}
                  </button>
                ) : null}
              </div>
            </ContentCard>

            <ContentCard title={t("documents.detail.cards.emailDelivery.title")} description={t("documents.detail.cards.emailDelivery.description")}>
              {latestEmailLog ? (
                <div className="space-y-3">
                  {emailLog.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-[#e5eaf0] bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-slate-900">
                            {entry.status === "success" ? t("documents.detail.emailLog.sent") : t("documents.detail.emailLog.failed")}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {formatLogDate(entry.createdAt)} · {entry.to}
                          </p>
                          <p className="mt-2 truncate text-xs font-bold text-slate-700">
                            {entry.subject}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${entry.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {entry.status === "success" ? "OK" : t("documents.detail.emailLog.error")}
                        </span>
                      </div>
                      {entry.error ? (
                        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-700">
                          {entry.error}
                        </p>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-slate-400">
                          Provider: {entry.provider || "unknown"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl bg-[#f7f9fc] px-4 py-3 text-sm font-semibold text-slate-500">
                  {t("documents.detail.emailLog.empty")}
                </p>
              )}
            </ContentCard>

            <ContentCard title={t("documents.detail.cards.bank.title")} description={t("documents.detail.cards.bank.description")}>
              <div className="space-y-3">
                {bankAccounts.map((account) => {
                  const isEditing = editingBankId === account.id

                  return (
                    <div key={account.id} className="rounded-2xl border border-[#e5eaf0] bg-white p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2f7] text-slate-600">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{account.bank}</p>
                            <p className="text-xs font-medium text-slate-400">{t("documents.detail.bank.connection")}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBankId(isEditing ? null : account.id)}
                            className={`${iconButton} ${isEditing ? "bg-black text-white hover:bg-black hover:text-white" : ""}`}
                            aria-label={t("documents.detail.bank.edit")}
                            title={t("documents.detail.actions.edit")}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteBankAccount(account.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
                            aria-label={t("documents.detail.bank.delete")}
                            title={t("documents.list.selection.delete")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <input
                          value={account.bank}
                          readOnly={!isEditing}
                          onChange={(event) => updateBankAccount(account.id, "bank", event.target.value)}
                          className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition ${
                            isEditing
                              ? "bg-[#f3f6fa] focus:ring-2 focus:ring-slate-900"
                              : "bg-[#f8fafc] text-slate-500"
                          }`}
                          aria-label="Bankname"
                        />
                        <input
                          value={account.iban}
                          readOnly={!isEditing}
                          onChange={(event) => updateBankAccount(account.id, "iban", event.target.value)}
                          className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition ${
                            isEditing
                              ? "bg-[#f3f6fa] focus:ring-2 focus:ring-slate-900"
                              : "bg-[#f8fafc] text-slate-500"
                          }`}
                          aria-label="IBAN"
                        />
                        <input
                          value={account.bic}
                          readOnly={!isEditing}
                          onChange={(event) => updateBankAccount(account.id, "bic", event.target.value)}
                          className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition ${
                            isEditing
                              ? "bg-[#f3f6fa] focus:ring-2 focus:ring-slate-900"
                              : "bg-[#f8fafc] text-slate-500"
                          }`}
                          aria-label="BIC"
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="rounded-2xl border border-dashed border-[#d8e0ea] bg-[#f7f9fc] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t("documents.detail.bank.newTitle")}</p>
                      <p className="text-xs font-medium text-slate-400">{t("documents.detail.bank.newDescription")}</p>
                    </div>

                    <button
                      type="button"
                      onClick={addBankAccount}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:scale-105 hover:bg-slate-800"
                      aria-label={t("documents.detail.bank.add")}
                      title={t("documents.detail.bank.add")}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input value={newBank} onChange={(event) => setNewBank(event.target.value)} placeholder="Bank" className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900" />
                    <input value={newIban} onChange={(event) => setNewIban(event.target.value)} placeholder="IBAN" className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900" />
                    <input value={newBic} onChange={(event) => setNewBic(event.target.value)} placeholder="BIC" className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900" />
                  </div>
                </div>
              </div>
            </ContentCard>
          </div>
        </div>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">{t("documents.detail.modal.send.title")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("documents.detail.modal.send.description")}</p>
              </div>
              <button onClick={() => setShowSendModal(false)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                {t("documents.detail.modal.send.close")}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <input value={sendTo} onChange={(event) => setSendTo(event.target.value)} className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder={t("documents.detail.modal.send.toPlaceholder")} />
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder={t("documents.detail.modal.send.subjectPlaceholder")} />
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-40 w-full rounded-2xl border border-slate-200 px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder={t("documents.detail.modal.send.messagePlaceholder")} />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowSendModal(false)} className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600">
                {t("documents.detail.modal.send.cancel")}
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="rounded-full bg-[var(--brand-lime)] px-6 py-2.5 text-sm font-bold text-black disabled:cursor-wait disabled:opacity-70"
              >
                {sendingEmail ? t("documents.detail.modal.send.sending") : t("documents.detail.modal.send.submit")}
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
