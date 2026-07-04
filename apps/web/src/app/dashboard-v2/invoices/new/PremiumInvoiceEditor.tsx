"use client"

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
import QRCode from "qrcode"
import {
  ArrowLeft,
  Download,
  GripVertical,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Save,
  Trash2
} from "lucide-react"
import styles from "./PremiumInvoiceEditor.module.css"
import { StandardModal } from "@/components/ui/StandardModal"

type TaxRate = {
  id: string
  label: string
  rate: number
  locked?: boolean
}

type InvoiceItem = {
  id: string
  articleId?: string
  description: string
  quantity: string
  unit: string
  price: string
  taxRateId: string
  customTaxRate?: string
}

type InvoiceTemplate = "classic" | "modern" | "minimal" | "elegant" | "business" | "premium"

type CustomerRecord = {
  id: string
  number: string
  name: string
  email?: string | null
  phone?: string | null
  street?: string | null
  zip?: string | null
  city?: string | null
  country?: string | null
  status?: string | null
}

type ArticleRecord = {
  id: string
  code?: string | null
  name: string
  description?: string | null
  unit?: string | null
  price?: number | string | null
  tax?: number | string | null
  active?: boolean | null
}

type InvoiceState = {
  customerId: string
  customer: string
  customerAddress: string
  customerEmail: string
  customerPhone: string
  number: string
  issueDate: string
  dueDate: string
  servicePeriod: string
  subject: string
  paymentTerms: string
  paymentMethod: string
  status: string
  note: string
}

type TaxSummary = {
  label: string
  rate: number
  net: number
  tax: number
}

type PersistedInvoice = {
  id: string
  number?: string
}

type CompanySettings = {
  company?: string | null
  bankName?: string | null
  iban?: string | null
  bic?: string | null
  defaultPaymentTermsDays?: number | null
  defaultPaymentNote?: string | null
}

type FinanceBankAccount = {
  id: string
  bankName?: string | null
  accountHolder?: string | null
  iban?: string | null
  bic?: string | null
  isDefault?: boolean | null
  qrEnabled?: boolean | null
  active?: boolean | null
}

type EmailSettings = {
  provider?: "disabled" | "smtp" | "resend" | null
  fromEmail?: string | null
  smtpHost?: string | null
  resendApiKey?: string | null
}

const invoiceTemplateOptions: Array<{ id: InvoiceTemplate; label: string }> = [
  { id: "classic", label: "Klassisch" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
  { id: "elegant", label: "Elegant" },
  { id: "business", label: "Business" },
  { id: "premium", label: "Premium" }
]

const initialTaxRates: TaxRate[] = [
  { id: "tax-19", label: "19% MwSt", rate: 19, locked: true },
  { id: "tax-7", label: "7% MwSt", rate: 7, locked: true },
  { id: "tax-0", label: "0% steuerfrei", rate: 0, locked: true }
]
const customTaxRateId = "custom"

const defaultIssueDate = "2026-06-13"
const defaultPaymentTermsDays = 14
const defaultDueDate = addDays(defaultIssueDate, defaultPaymentTermsDays)
const fallbackCreditorName = "DreamInvoice GmbH"
const fallbackCreditorIban = "DE97441523700000069757"
const fallbackCreditorBic = "WELADED1LUN"
const fallbackCreditorBankName = "Manuelle Bankdaten"
const fallbackPaymentNote = "Bitte ueberweisen Sie den Betrag innerhalb von 14 Tagen."
function euro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    Number.isFinite(value) ? value : 0
  )
}

function asNumber(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function decimalInput(value: string) {
  return value.replace(/[^\d.,]/g, "")
}

function unitInput(value: string) {
  return value.replace(/[^\p{L}\d ._-]/gu, "").slice(0, 12)
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function paymentTermsText(days: number) {
  return `Zahlbar innerhalb von ${days} Tagen ohne Abzug.`
}

function formatCustomerAddress(customer: CustomerRecord | null) {
  if (!customer) return ""

  const lines = [
    customer.street?.trim(),
    [customer.zip?.trim(), customer.city?.trim()].filter(Boolean).join(" "),
    customer.country?.trim() || "Deutschland"
  ].filter(Boolean)

  return lines.join("\n")
}

function customerOptionLabel(customer: CustomerRecord) {
  return customer.number ? `${customer.name} (${customer.number})` : customer.name
}

function articleOptionLabel(article: ArticleRecord) {
  const code = article.code?.trim()
  return code ? `${article.name} (${code})` : article.name
}

function itemNet(item: InvoiceItem) {
  return Math.max(asNumber(item.quantity), 0) * Math.max(asNumber(item.price), 0)
}

function resolveTaxRate(item: InvoiceItem): TaxRate {
  if (item.taxRateId === customTaxRateId) {
    const customRate = Math.max(asNumber(item.customTaxRate), 0)
    const customLabel = `${customRate.toString().replace(".", ",")}% MwSt`
    return { id: customTaxRateId, label: customLabel, rate: customRate }
  }

  return initialTaxRates.find((entry) => entry.id === item.taxRateId) ?? initialTaxRates[0]
}

function lineId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

function cleanQrLine(value: string, maxLength: number) {
  return value.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
}

function cleanQrIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase()
}

function formatEpcAmount(value: number) {
  return `EUR${Math.max(0.01, Math.min(value, 99999999.99)).toFixed(2)}`
}

function buildEpcQrPayload(invoiceNumber: string, amount: number, creditorName: string, creditorIban: string, creditorBic: string) {
  const iban = cleanQrIban(creditorIban)
  if (!iban) return ""

  return [
    "BCD",
    "002",
    "1",
    "SCT",
    cleanQrLine(creditorBic, 11),
    cleanQrLine(creditorName, 70),
    iban,
    formatEpcAmount(amount),
    "",
    "",
    cleanQrLine(`Rechnung ${invoiceNumber}`, 140),
    ""
  ].join("\n")
}

export function PremiumInvoiceEditor({ initialTheme = "light" }: { initialTheme?: "light" | "dark" }) {
  const noteFieldRef = useRef<HTMLTextAreaElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const [theme] = useState(initialTheme)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [bankAccounts, setBankAccounts] = useState<FinanceBankAccount[]>([])
  const [emailSettings, setEmailSettings] = useState<EmailSettings | null>(null)
  const [emailSettingsLoaded, setEmailSettingsLoaded] = useState(false)
  const [companyDefaultsApplied, setCompanyDefaultsApplied] = useState(false)
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [customersLoading, setCustomersLoading] = useState(true)
  const [customersError, setCustomersError] = useState("")
  const [customerLookup, setCustomerLookup] = useState("")
  const [articles, setArticles] = useState<ArticleRecord[]>([])
  const [articlesLoading, setArticlesLoading] = useState(true)
  const [articlesError, setArticlesError] = useState("")
  const [articleLookup, setArticleLookup] = useState<Record<string, string>>({})
  const [invoice, setInvoice] = useState<InvoiceState>({
    customerId: "",
    customer: "Acme GmbH",
    customerAddress: "Musterstrasse 123\n12345 Musterstadt\nDeutschland",
    customerEmail: "info@acmegmbh.de",
    customerPhone: "+49 30 12345678",
    number: "RE-2026-0104",
    issueDate: defaultIssueDate,
    dueDate: defaultDueDate,
    servicePeriod: "Mai 2026",
    subject: "Website Relaunch - Erstellung und Design",
    paymentTerms: paymentTermsText(defaultPaymentTermsDays),
    paymentMethod: "Vorkasse (Ueberweisung)",
    status: "draft",
    note: "Vielen Dank fuer Ihren Auftrag. Bei Fragen kontaktieren Sie uns gerne."
  })
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "item-1", description: "Konzeption & Beratung", quantity: "10", unit: "Std.", price: "95", taxRateId: "tax-19" },
    { id: "item-2", description: "UI/UX Design", quantity: "20", unit: "Std.", price: "85", taxRateId: "tax-19" },
    { id: "item-3", description: "Frontend Entwicklung", quantity: "30", unit: "Std.", price: "95", taxRateId: "tax-19" },
    { id: "item-4", description: "Projektmanagement", quantity: "5", unit: "Std.", price: "90", taxRateId: "tax-19" }
  ])
  const [invoiceTemplate, setInvoiceTemplate] = useState<InvoiceTemplate>("classic")
  const [status, setStatus] = useState("Bereit")
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailTo, setEmailTo] = useState(invoice.customerEmail)
  const [emailSubject, setEmailSubject] = useState(`Rechnung ${invoice.number}`)
  const [emailMessage, setEmailMessage] = useState(`Hallo,\n\nanbei erhalten Sie die Rechnung ${invoice.number} als PDF.\n\nViele Gruesse\nDreamInvoice`)

  const totals = useMemo(() => {
    const taxMap = new Map<string, TaxSummary>()
    let net = 0
    let tax = 0

    for (const item of items) {
      const rate = resolveTaxRate(item)
      const lineNet = itemNet(item)
      const lineTax = lineNet * ((rate?.rate ?? 0) / 100)
      net += lineNet
      tax += lineTax

      const key = rate?.id ?? "tax-0"
      const current = taxMap.get(key) ?? { label: rate?.label ?? "0%", rate: rate?.rate ?? 0, net: 0, tax: 0 }
      current.net += lineNet
      current.tax += lineTax
      taxMap.set(key, current)
    }

    return {
      net,
      tax,
      gross: net + tax,
      taxes: Array.from(taxMap.values()).sort((a, b) => b.rate - a.rate)
    }
  }, [items])

  const paymentTermsDays = Math.max(1, Number(companySettings?.defaultPaymentTermsDays ?? defaultPaymentTermsDays) || defaultPaymentTermsDays)
  const defaultBankAccount = bankAccounts.find((account) => account.active !== false && account.isDefault) ?? bankAccounts.find((account) => account.active !== false) ?? null
  const qrPaymentEnabled = defaultBankAccount?.qrEnabled !== false
  const creditorName = defaultBankAccount?.accountHolder?.trim() || companySettings?.company?.trim() || fallbackCreditorName
  const creditorIban = defaultBankAccount?.iban?.trim() || companySettings?.iban?.trim() || fallbackCreditorIban
  const creditorBic = defaultBankAccount?.bic?.trim() || companySettings?.bic?.trim() || fallbackCreditorBic
  const creditorBankName = defaultBankAccount?.bankName?.trim() || companySettings?.bankName?.trim() || fallbackCreditorBankName
  const companyPaymentNote = companySettings?.defaultPaymentNote?.trim() || fallbackPaymentNote
  const emailTransportReady = emailSettingsLoaded && Boolean(
    emailSettings && (
      emailSettings.provider === "smtp" && emailSettings.smtpHost?.trim() && emailSettings.fromEmail?.trim()
        || emailSettings.provider === "resend" && emailSettings.resendApiKey?.trim() && emailSettings.fromEmail?.trim()
    )
  )
  const qrPayload = useMemo(() => qrPaymentEnabled ? buildEpcQrPayload(invoice.number, totals.gross, creditorName, creditorIban, creditorBic) : "", [invoice.number, totals.gross, creditorName, creditorIban, creditorBic, qrPaymentEnabled])

  useEffect(() => {
    let cancelled = false

    if (!qrPayload) {
      setQrCodeUrl("")
      return () => {
        cancelled = true
      }
    }

    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 164,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    }).then((url) => {
      if (!cancelled) setQrCodeUrl(url)
    }).catch(() => {
      if (!cancelled) setQrCodeUrl("")
    })

    return () => {
      cancelled = true
    }
  }, [qrPayload])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])


  useEffect(() => {
    let cancelled = false

    async function loadCompanySettings() {
      try {
        const response = await fetch("/api/settings/company", {
          credentials: "same-origin"
        })
        const result = await response.json().catch(() => null)

        if (!cancelled && response.ok && result?.ok && result.settings) {
          setCompanySettings(result.settings as CompanySettings)
        }

        const financeResponse = await fetch("/api/finance/base", {
          cache: "no-store",
          credentials: "same-origin"
        })
        const financeResult = await financeResponse.json().catch(() => null)

        if (!cancelled && financeResponse.ok && financeResult?.ok && Array.isArray(financeResult.bankAccounts)) {
          setBankAccounts(financeResult.bankAccounts as FinanceBankAccount[])
        }
      } catch {
        // Keep local fallback values.
      }
    }

    void loadCompanySettings()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadEmailSettings() {
      try {
        const response = await fetch("/api/settings/email", {
          cache: "no-store",
          credentials: "same-origin"
        })
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

  useEffect(() => {
    if (!companySettings || companyDefaultsApplied) return

    const nextDays = Math.max(1, Number(companySettings.defaultPaymentTermsDays ?? defaultPaymentTermsDays) || defaultPaymentTermsDays)
    const nextTerms = paymentTermsText(nextDays)

    setInvoice((current) => {
      const stillDefault = current.dueDate === defaultDueDate && current.paymentTerms === paymentTermsText(defaultPaymentTermsDays)
      if (!stillDefault) return current

      return {
        ...current,
        dueDate: addDays(current.issueDate, nextDays),
        paymentTerms: nextTerms
      }
    })

    setCompanyDefaultsApplied(true)
  }, [companySettings, companyDefaultsApplied])

  useEffect(() => {
    let cancelled = false

    async function loadCustomers() {
      setCustomersLoading(true)
      setCustomersError("")

      try {
        const response = await fetch("/api/customers/list", { credentials: "same-origin" })
        const result = await response.json().catch(() => null)
        if (cancelled) return

        if (!response.ok) {
          throw new Error(result?.error || "Kunden konnten nicht geladen werden.")
        }

        const customerRows = Array.isArray(result)
          ? result
          : Array.isArray(result?.customers)
            ? result.customers
            : []

        setCustomers(customerRows)
      } catch (error) {
        if (!cancelled) {
          setCustomers([])
          setCustomersError(error instanceof Error ? error.message : "Kunden konnten nicht geladen werden.")
        }
      } finally {
        if (!cancelled) setCustomersLoading(false)
      }
    }

    void loadCustomers()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadArticles() {
      try {
        const response = await fetch("/api/articles/list", { credentials: "include", cache: "no-store" })
        const result = await response.json().catch(() => null)

        if (!response.ok || result?.ok === false) {
          throw new Error(result?.error || "Artikel konnten nicht geladen werden.")
        }

        const articleRows = Array.isArray(result)
          ? result
          : Array.isArray(result?.articles)
            ? result.articles
            : []

        if (!cancelled) {
          setArticles(articleRows)
        }
      } catch (error) {
        if (!cancelled) {
          setArticles([])
          setArticlesError(error instanceof Error ? error.message : "Artikel konnten nicht geladen werden.")
        }
      } finally {
        if (!cancelled) setArticlesLoading(false)
      }
    }

    void loadArticles()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!invoice.customerId) {
      setCustomerLookup("")
      return
    }

    const selectedCustomer = customers.find((entry) => entry.id === invoice.customerId)
    if (selectedCustomer) {
      setCustomerLookup(customerOptionLabel(selectedCustomer))
    }
  }, [customers, invoice.customerId])

  function updateInvoice(field: keyof InvoiceState, value: string) {
    const customerFields = field === "customer" || field === "customerAddress" || field === "customerEmail" || field === "customerPhone"

    setInvoice((current) => ({
      ...current,
      [field]: value,
      ...(customerFields ? { customerId: "" } : {})
    }))
    setStatus("Entwurf geaendert")
  }

  function applyCustomerSelection(customerId: string) {
    const selected = customers.find((customer) => customer.id === customerId) ?? null

    if (!selected) {
      setCustomerLookup("")
      setInvoice((current) => ({ ...current, customerId }))
      setStatus(customerId ? "Kunde aus Auswahl uebernommen" : "Kundenauswahl zurueckgesetzt")
      return
    }

    setInvoice((current) => ({
      ...current,
      customerId: selected.id,
      customer: selected.name,
      customerEmail: selected.email || "",
      customerPhone: selected.phone || "",
      customerAddress: formatCustomerAddress(selected) || current.customerAddress
    }))
    setCustomerLookup(customerOptionLabel(selected))
    setStatus("Kunde " + selected.name + " uebernommen")
  }

  function handleCustomerLookup(value: string) {
    setCustomerLookup(value)

    if (!value.trim()) {
      applyCustomerSelection("")
      return
    }

    const selected = customers.find((customer) => customerOptionLabel(customer) === value.trim())
    if (selected) {
      applyCustomerSelection(selected.id)
    }
  }

  function showMoreActions() {
    setStatus("Weitere Rechnungsaktionen sind vorbereitet. Speichern, PDF und E-Mail sind aktiv verbunden.")
  }

  function openCustomerCreation() {
    setStatus("Kundenanlage wird im Dashboard-v2 geoeffnet.")
    window.location.href = "/dashboard-v2/customers?q=Kunde%20anlegen"
  }

  function updateItem(id: string, patch: Partial<InvoiceItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
    setStatus("Live neu berechnet")
  }

  function setArticleLookupValue(itemId: string, value: string) {
    setArticleLookup((current) => ({ ...current, [itemId]: value }))
  }

  function applyArticleSelection(itemId: string, articleId: string) {
    const selected = articles.find((article) => article.id === articleId) ?? null

    if (!selected) {
      setArticleLookupValue(itemId, "")
      updateItem(itemId, { articleId: undefined })
      setStatus("Artikelauswahl zurueckgesetzt")
      return
    }

    const taxRate = Math.max(asNumber(selected.tax), 0)
    const standardTaxRate = initialTaxRates.find((entry) => entry.rate === taxRate)

    updateItem(itemId, {
      articleId: selected.id,
      description: selected.description?.trim() || selected.name,
      unit: unitInput(selected.unit || "Stk."),
      price: String(selected.price ?? "0"),
      taxRateId: standardTaxRate?.id ?? customTaxRateId,
      customTaxRate: standardTaxRate ? "" : String(taxRate).replace(".", ",")
    })
    setArticleLookupValue(itemId, articleOptionLabel(selected))
    setStatus("Artikel " + selected.name + " uebernommen")
  }

  function handleArticleLookup(itemId: string, value: string) {
    setArticleLookupValue(itemId, value)

    if (!value.trim()) {
      updateItem(itemId, { articleId: undefined })
      return
    }

    const selected = articles.find((article) => articleOptionLabel(article) === value.trim())
    if (selected) {
      applyArticleSelection(itemId, selected.id)
    }
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: lineId("item"),
        description: "Neue Position",
        quantity: "1",
        unit: "Stk.",
        price: "0",
        taxRateId: initialTaxRates[0]?.id ?? "tax-19"
      }
    ])
    setStatus("Position hinzugefuegt")
  }

  function removeItem(id: string) {
    setItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current)
    setStatus("Position entfernt")
  }

  function moveItem(targetId: string) {
    if (!draggedItemId || draggedItemId === targetId) return

    setItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === draggedItemId)
      const toIndex = current.findIndex((item) => item.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return current

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setStatus("Positionen sortiert")
  }

  function invoiceFileName(number: string) {
    return `${number.trim().replace(/[^A-Za-z0-9_.-]+/g, "-") || "rechnung"}.pdf`
  }

  function localDraftPayload() {
    return { invoice, items, savedInvoiceId }
  }

  function setItemTaxRate(itemId: string, value: string) {
    if (value === customTaxRateId) {
      setItems((current) => current.map((item) => item.id === itemId ? { ...item, taxRateId: customTaxRateId, customTaxRate: item.customTaxRate || "" } : item))
      setStatus("Benutzerdefinierte MwSt aktiviert")
      return
    }

    setItems((current) => current.map((item) => item.id === itemId ? { ...item, taxRateId: value, customTaxRate: "" } : item))
    const nextRate = initialTaxRates.find((entry) => entry.id === value)
    setStatus(`${nextRate?.label || "MwSt"} uebernommen`)
  }

  function updateCustomTaxRate(itemId: string, value: string) {
    setItems((current) => current.map((item) => item.id === itemId ? { ...item, taxRateId: customTaxRateId, customTaxRate: decimalInput(value) } : item))
    setStatus("Benutzerdefinierte MwSt aktualisiert")
  }

  function focusNoteField() {
    noteFieldRef.current?.focus()
    noteFieldRef.current?.setSelectionRange(noteFieldRef.current.value.length, noteFieldRef.current.value.length)
    setStatus("Notizfeld aktiv")
  }

  function clearNoteField() {
    updateInvoice("note", "")
    setStatus("Notiztext geleert")
  }

  function previewPdfPayload() {
    return {
      template: invoiceTemplate,
      customer: invoice.customer,
      customerAddress: invoice.customerAddress,
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      servicePeriod: invoice.servicePeriod,
      subject: invoice.subject,
      paymentTerms: invoice.paymentTerms,
      paymentMethod: invoice.paymentMethod,
      paymentInstructions: companyPaymentNote,
      companyName: creditorName,
      companyBankName: creditorBankName,
      companyIban: creditorIban,
      companyBic: creditorBic,
      note: invoice.note,
      status: invoice.status,
      customerId: invoice.customerId || undefined,
      items: items.map((item) => {
        const rate = resolveTaxRate(item)

        return {
          description: item.description,
          quantity: asNumber(item.quantity),
          unit: item.unit.trim() || "Std.",
          price: asNumber(item.price),
          vatRate: rate?.rate ?? 0
        }
      })
    }
  }

  function saveLocalDraft(nextSavedInvoiceId = savedInvoiceId, nextNumber = invoice.number) {
    window.localStorage.setItem(
      "dream-invoice-premium-draft",
      JSON.stringify({
        invoice: { ...invoice, number: nextNumber },
        items,
        savedInvoiceId: nextSavedInvoiceId
      })
    )
  }

  function invoicePayload() {
    return {
      number: invoice.number,
      date: invoice.issueDate,
      dueDate: invoice.dueDate,
      note: invoice.note,
      customerId: invoice.customerId || undefined,
      customerName: invoice.customer,
      customerEmail: invoice.customerEmail,
      customerAddress: invoice.customerAddress,
      status: invoice.status,
      taxRate: 0.19,
      tip: 0,
      items: items.map((item) => {
        const rate = resolveTaxRate(item)
        return {
          name: item.description,
          quantity: asNumber(item.quantity),
          price: asNumber(item.price),
          category: invoice.subject,
          vatRate: rate?.rate ?? 0
        }
      })
    }
  }

  async function persistInvoice() {
    const response = await fetch(savedInvoiceId ? `/api/invoice/update/${savedInvoiceId}` : "/api/invoice/create", {
      method: savedInvoiceId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(invoicePayload())
    })
    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.invoice?.id) {
      throw new Error(result?.error || "Rechnung konnte nicht gespeichert werden.")
    }

    const persisted = result.invoice as PersistedInvoice
    setSavedInvoiceId(persisted.id)
    if (persisted.number && persisted.number !== invoice.number) {
      setInvoice((current) => ({ ...current, number: persisted.number || current.number }))
    }
    saveLocalDraft(persisted.id, persisted.number || invoice.number)

    return persisted
  }

  async function fetchPreviewPdfBlob() {
    const response = await fetch("/api/invoice/preview-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify(previewPdfPayload())
    })

    if (!response.ok) {
      throw new Error("PDF konnte nicht erstellt werden.")
    }

    return response.blob()
  }

  function printPdfBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const frame = document.createElement("iframe")
    frame.style.position = "fixed"
    frame.style.right = "0"
    frame.style.bottom = "0"
    frame.style.width = "0"
    frame.style.height = "0"
    frame.style.border = "0"
    frame.src = url
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      window.setTimeout(() => {
        frame.remove()
        URL.revokeObjectURL(url)
      }, 30_000)
    }
    document.body.append(frame)
  }

  function printLocalInvoiceDocument(statusMessage: string) {
    const preview = document.querySelector(`.${styles.invoicePreview}`)
    if (!preview) {
      window.print()
      setStatus(statusMessage)
      return
    }

    const frame = document.createElement("iframe")
    frame.style.position = "fixed"
    frame.style.right = "0"
    frame.style.bottom = "0"
    frame.style.width = "0"
    frame.style.height = "0"
    frame.style.border = "0"
    document.body.append(frame)

    const frameDocument = frame.contentDocument
    if (!frameDocument) {
      frame.remove()
      window.print()
      setStatus(statusMessage)
      return
    }

    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join("\n")

    frameDocument.open()
    frameDocument.write(`<!doctype html>
      <html>
        <head>
          <base href="${window.location.origin}">
          <title>${invoiceFileName(invoice.number)}</title>
          ${stylesheets}
        </head>
        <body>
          <main class="${styles.page}">
            <section class="${styles.editorGrid}">
              <aside class="${styles.previewColumn}">
                ${preview.outerHTML}
              </aside>
            </section>
          </main>
        </body>
      </html>`)
    frameDocument.close()

    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      window.setTimeout(() => frame.remove(), 30_000)
    }
    setStatus(statusMessage)
  }

  async function saveDraft() {
    setIsWorking(true)
    setStatus("Rechnung wird gespeichert...")
    try {
      const persisted = await persistInvoice()
      setStatus(`Rechnung gespeichert: ${persisted.number || invoice.number}`)
    } catch (error) {
      window.localStorage.setItem("dream-invoice-premium-draft", JSON.stringify(localDraftPayload()))
      setStatus("Entwurf wurde lokal gespeichert.")
    } finally {
      setIsWorking(false)
    }
  }

  async function previewPdf() {
    setIsWorking(true)
    setStatus("PDF wird vorbereitet...")
    try {
      const blob = await fetchPreviewPdfBlob()
      printPdfBlob(blob)
      setStatus("PDF-Druckdialog bereit.")
    } catch {
      window.localStorage.setItem("dream-invoice-premium-draft", JSON.stringify(localDraftPayload()))
      printLocalInvoiceDocument("Lokaler PDF-Druckdialog ist bereit.")
    } finally {
      setIsWorking(false)
    }
  }

  async function downloadPdf() {
    setIsWorking(true)
    setStatus("PDF wird erstellt...")
    try {
      const blob = await fetchPreviewPdfBlob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = invoiceFileName(invoice.number)
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setStatus(`PDF heruntergeladen: ${invoiceFileName(invoice.number)}`)
    } catch {
      window.localStorage.setItem("dream-invoice-premium-draft", JSON.stringify(localDraftPayload()))
      printLocalInvoiceDocument("Im Druckdialog als PDF speichern.")
    } finally {
      setIsWorking(false)
    }
  }

  function sendEmail() {
    setEmailTo(invoice.customerEmail)
    setEmailSubject(`Rechnung ${invoice.number}`)
    setEmailMessage(`Hallo,\n\nanbei erhalten Sie die Rechnung ${invoice.number} als PDF.\n\nViele Gruesse\nDreamInvoice`)
    setEmailOpen(true)
    setStatus(emailTransportReady ? "Empfaenger-E-Mail eintragen und Versand starten." : "SMTP-Konfiguration fehlt noch. E-Mail-Maske ist vorbereitet.")
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsWorking(true)
    setStatus("Rechnung wird gespeichert und per E-Mail versendet...")

    try {
      const persisted = await persistInvoice()
      const response = await fetch(`/api/invoice/send/${persisted.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          message: emailMessage
        })
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "E-Mail konnte nicht gesendet werden.")
      }

      setEmailOpen(false)
      setStatus(`E-Mail gesendet an ${emailTo}`)
    } catch (error) {
      window.localStorage.setItem("dream-invoice-premium-draft", JSON.stringify(localDraftPayload()))
      const message = error instanceof Error ? error.message : "E-Mail konnte nicht gesendet werden."
      setStatus(message)
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="/brand/logo-sidebar.svg" alt="DreamInvoice" />
        </div>
        <nav>
          {[
            ["Dashboard", "/dashboard-v2"],
            ["Kunden", "/dashboard-v2/customers"],
            ["Projekte", "/dashboard-v2/projects"],
            ["Rechnungen", "/dashboard-v2/invoices"],
            ["Angebote", "/dashboard-v2/offers"],
            ["Zeiterfassung", "/dashboard-v2/time"],
            ["Ausgaben", "/dashboard-v2/expenses"],
            ["Artikel", "/dashboard-v2/articles"],
            ["Berichte", "/dashboard-v2/reports"]
          ].map(([label, href]) => <Link key={label} className={label === "Rechnungen" ? styles.activeNav : ""} href={href}>{label}</Link>)}
        </nav>
        <div className={styles.management}>
          <span>Management</span>
          <Link href="/dashboard-v2/users">Benutzer & Rollen</Link>
          <Link href="/dashboard-v2/license">Lizenzen</Link>
          <Link href="/dashboard-v2/settings">Einstellungen</Link>
          <Link href="/dashboard-v2/integrations">Integrationen</Link>
        </div>
        <div className={styles.planCard}>
          <strong>Premium Edition</strong>
          <span>Ihr aktueller Plan</span>
          <Link href="/dashboard-v2/license">Plan verwalten</Link>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.toolbar}>
          <div className={styles.titleRow}>
            <Link href="/dashboard-v2/invoices" aria-label="Zurueck"><ArrowLeft size={18} /></Link>
            <h1>Rechnung erstellen</h1>
            <span>Entwurf</span>
          </div>
          <div ref={profileMenuRef} className={styles.topMetaWrap}>
            <button
              type="button"
              className={styles.topMetaButton}
              aria-label="Profil öffnen"
              aria-haspopup="menu"
              aria-expanded={profileMenuOpen}
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              <span>A</span>
              <strong>Administrator</strong>
            </button>
            {profileMenuOpen ? (
              <div className={styles.topMetaMenu} aria-label="Profilmenü">
                <Link href="/dashboard-v2/account/security" className={styles.topMetaMenuLink} onClick={() => setProfileMenuOpen(false)}>
                  Konto &amp; Sicherheit
                </Link>
              </div>
            ) : null}
          </div>
        </header>
        <div className={styles.actionBar}>
          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={`${styles.primaryAction} ${styles.iconOnlyAction}`}
              disabled={isWorking}
              onClick={saveDraft}
              title="Speichern"
              aria-label="Speichern"
            >
              <Save size={16} />
            </button>
            <button
              type="button"
              className={styles.iconOnlyAction}
              disabled={isWorking}
              onClick={previewPdf}
              title="Drucken"
              aria-label="Drucken"
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              className={styles.iconOnlyAction}
              disabled={isWorking}
              onClick={downloadPdf}
              title="PDF herunterladen"
              aria-label="PDF herunterladen"
            >
              <Download size={16} />
            </button>
            <button
              type="button"
              className={styles.iconOnlyAction}
              disabled={isWorking}
              onClick={sendEmail}
              title="Per E-Mail senden"
              aria-label="Per E-Mail senden"
            >
              <Mail size={16} />
            </button>
            <button
              type="button"
              className={styles.iconOnlyAction}
              aria-label="Weitere Aktionen"
              title="Weitere Aktionen"
              onClick={showMoreActions}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
        {!emailTransportReady ? (
          <p style={{ marginTop: 10, color: "#64748b", fontSize: 12, fontWeight: 600 }}>
            E-Mail-Versand ist erst nach SMTP-Konfiguration aktiv.
          </p>
        ) : null}
        {emailOpen && typeof window !== "undefined"
          ? createPortal(
            <StandardModal
              title="Rechnung als PDF senden"
              eyebrow="E-Mail Versand"
              onClose={() => { if (!isWorking) setEmailOpen(false) }}
              ariaLabelledBy="invoice-email-title"
              width={560}
              padded={false}
            >
              <form className={styles.emailPanel} onSubmit={submitEmail}>
                <label>
                  Empfaenger
                  <input type="email" value={emailTo} onChange={(event) => setEmailTo(event.target.value)} placeholder="kunde@example.de" required />
                </label>
                <label>
                  Betreff
                  <input value={emailSubject} onChange={(event) => setEmailSubject(event.target.value)} required />
                </label>
                <label>
                  Nachricht
                  <textarea rows={5} value={emailMessage} onChange={(event) => setEmailMessage(event.target.value)} />
                </label>
                {!emailTransportReady ? (
                  <p style={{ margin: 0, color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                    SMTP ist noch nicht konfiguriert. Die Eingabemaske bleibt verfuegbar, der Versand selbst wird erst nach Konfiguration aktiv.
                  </p>
                ) : null}
                <div className={styles.emailActions}>
                  <button type="button" disabled={isWorking} onClick={() => setEmailOpen(false)}>Abbrechen</button>
                  <button type="submit" disabled={isWorking || !emailTransportReady} title={emailTransportReady ? "PDF senden" : "SMTP zuerst konfigurieren"}><Mail size={16} />PDF senden</button>
                </div>
              </form>
            </StandardModal>,
            document.body
          )
          : null}

        <section className={styles.editorGrid}>
          <div className={styles.formColumn}>
            <section className={styles.panel} id="kunde">
              <div className={styles.panelHead}>
                <h2>Kunde</h2>
                <button type="button" onClick={openCustomerCreation}><Plus size={15} />Neuen Kunden anlegen</button>
              </div>
              <label>Kunde suchen oder manuell erfassen
                <input
                  list="invoice-customer-options"
                  value={customerLookup}
                  onChange={(event) => handleCustomerLookup(event.target.value)}
                  placeholder="Kunde suchen ..."
                  disabled={customersLoading && customers.length === 0}
                />
              </label>
              <datalist id="invoice-customer-options">
                {customers.map((customer) => <option key={customer.id} value={customerOptionLabel(customer)} />)}
              </datalist>
              {customersLoading ? <p>Kunden werden geladen...</p> : customersError ? <p>{customersError} Manuelle Eingabe bleibt aktiv.</p> : customers.length === 0 ? <p>Keine Kunden vorhanden. Manuelle Eingabe bleibt aktiv.</p> : null}
              {!customersLoading && customers.length > 0 ? <p className={styles.lookupHint}>Auswahl uebernimmt Firmenname, Adresse, E-Mail und Telefon automatisch. Manuelle Eingabe bleibt jederzeit moeglich.</p> : null}
              <div className={styles.formGridTwo}>
                <label>Kundenname<input value={invoice.customer} onChange={(event) => updateInvoice("customer", event.target.value)} /></label>
                <label>E-Mail<input type="email" value={invoice.customerEmail} onChange={(event) => updateInvoice("customerEmail", event.target.value)} /></label>
              </div>
              <div className={styles.customerContactGrid}>
                <label>Telefon<input value={invoice.customerPhone} onChange={(event) => updateInvoice("customerPhone", event.target.value)} /></label>
                <label>Adresse<textarea rows={3} value={invoice.customerAddress} onChange={(event) => updateInvoice("customerAddress", event.target.value)} /></label>
              </div>
            </section>

            <section className={styles.panel} id="rechnungsdaten">
              <div className={styles.panelHead}>
                <h2>Rechnungsdaten</h2>
                <span>Nummer, Datum und Zahlungsziel</span>
              </div>
              <div className={styles.formGrid}>
                <label>Rechnungsnummer<input value={invoice.number} onChange={(event) => updateInvoice("number", event.target.value)} /></label>
                <label>Rechnungsdatum<input type="date" value={invoice.issueDate} onChange={(event) => updateInvoice("issueDate", event.target.value)} /></label>
                <label>Faelligkeitsdatum<input type="date" value={invoice.dueDate} onChange={(event) => updateInvoice("dueDate", event.target.value)} /></label>
              </div>
              <div className={styles.formGridTwo}>
                <label>Leistungszeitraum<input value={invoice.servicePeriod} onChange={(event) => updateInvoice("servicePeriod", event.target.value)} /></label>
                <label>Betreff<input value={invoice.subject} onChange={(event) => updateInvoice("subject", event.target.value)} /></label>
              </div>
            </section>

            <section className={styles.panel} id="positionen">
              <div className={styles.panelHead}>
                <h2>Positionen</h2>
                <div className={styles.panelHeadActions}>
                  <Link href="/dashboard-v2/articles"><Plus size={15} />Artikel</Link>
                  <button type="button" onClick={addItem}><Plus size={15} />Position hinzufügen</button>
                </div>
              </div>
              <div className={styles.itemCards}>
                {items.map((item) => {
                  const rate = resolveTaxRate(item)
                  const net = itemNet(item)
                  return (
                    <div className={styles.itemCard} key={item.id} draggable onDragStart={() => setDraggedItemId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(item.id)} onDragEnd={() => setDraggedItemId(null)}>
                      <div className={styles.itemCardTop}>
                        <span className={styles.dragHandle} title="Position ziehen"><GripVertical size={16} /></span>
                        <div className={styles.itemMainFields}>
                          <label className={styles.itemLookupField}>
                            <span>Artikel suchen</span>
                            <input
                              aria-label="Artikel suchen"
                              list={`invoice-article-options-${item.id}`}
                              value={articleLookup[item.id] ?? ""}
                              onChange={(event) => handleArticleLookup(item.id, event.target.value)}
                              placeholder="Artikel waehlen ..."
                              disabled={articlesLoading && articles.length === 0}
                            />
                            <datalist id={`invoice-article-options-${item.id}`}>
                              {articles.map((article) => <option key={article.id} value={articleOptionLabel(article)} />)}
                            </datalist>
                          </label>
                          <label className={styles.itemDescriptionField}>
                            <span>Beschreibung</span>
                            <input
                              aria-label="Beschreibung"
                              value={item.description}
                              onChange={(event) => updateItem(item.id, { description: event.target.value })}
                            />
                          </label>
                        </div>
                        <button type="button" className={`${styles.itemDeleteButton} ${styles.itemDeleteInline}`} aria-label="Position löschen" onClick={() => removeItem(item.id)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <div className={styles.itemCompactGrid}>
                        <label>
                          <span>Menge</span>
                          <input
                            aria-label="Menge"
                            value={item.quantity}
                            inputMode="decimal"
                            onChange={(event) => updateItem(item.id, { quantity: decimalInput(event.target.value) })}
                          />
                        </label>
                        <label>
                          <span>Einheit</span>
                          <input
                            aria-label="Einheit"
                            value={item.unit}
                            onChange={(event) => updateItem(item.id, { unit: unitInput(event.target.value) })}
                          />
                        </label>
                        <label>
                          <span>Preis netto</span>
                          <input
                            aria-label="Preis netto"
                            value={item.price}
                            inputMode="decimal"
                            onChange={(event) => updateItem(item.id, { price: decimalInput(event.target.value) })}
                          />
                        </label>
                        <label>
                          <span>MwSt.</span>
                          {item.taxRateId === customTaxRateId ? (
                            <div className={styles.inlineTaxEditor}>
                              <input
                                aria-label="Benutzerdefinierte MwSt"
                                value={item.customTaxRate || ""}
                                inputMode="decimal"
                                placeholder="8,1 %"
                                onChange={(event) => updateCustomTaxRate(item.id, event.target.value)}
                              />
                              <button type="button" className={styles.inlineTaxReset} onClick={() => setItemTaxRate(item.id, "tax-19")}>
                                19%
                              </button>
                            </div>
                          ) : (
                            <select aria-label="MwSt" value={item.taxRateId} onChange={(event) => setItemTaxRate(item.id, event.target.value)}>
                              {initialTaxRates.map((taxRate) => <option key={taxRate.id} value={taxRate.id}>{taxRate.rate}%</option>)}
                              <option value={customTaxRateId}>Benutzerdefiniert...</option>
                            </select>
                          )}
                        </label>
                        <div className={styles.itemTotalCompact}>
                          <span>Gesamt netto</span>
                          <strong>{euro(net)}</strong>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {articlesLoading ? <p>Artikel werden geladen...</p> : articlesError ? <p>{articlesError} Positionen bleiben manuell bearbeitbar.</p> : null}
            </section>

            <section className={styles.panel} id="zahlung">
              <div className={styles.panelHead}>
                <h2>Zahlungsbedingungen</h2>
                <span aria-live="polite" data-testid="invoice-editor-status">{status}</span>
              </div>
              <div className={styles.invoiceTemplatePanel}>
                <label htmlFor="invoice-template-select">Rechnungsdesign</label>
                <select
                  id="invoice-template-select"
                  className={styles.templateSelect}
                  value={invoiceTemplate}
                  onChange={(event) => setInvoiceTemplate(event.target.value as InvoiceTemplate)}
                >
                  {invoiceTemplateOptions.map((template) => (
                    <option key={template.id} value={template.id}>{template.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.paymentGrid}>
                <label>Zahlungsziel (Tage)<input value={`${paymentTermsDays} Tage`} readOnly /></label>
                <label>Zahlungsbedingungen<input value={invoice.paymentTerms} onChange={(event) => updateInvoice("paymentTerms", event.target.value)} /></label>
                <label>Zahlungsart<input value={invoice.paymentMethod} onChange={(event) => updateInvoice("paymentMethod", event.target.value)} /></label>
                <label>Rechnungsstatus<select value={invoice.status} onChange={(event) => updateInvoice("status", event.target.value)}><option value="draft">Entwurf</option><option value="open">Offen</option><option value="paid">Bezahlt</option><option value="overdue">Ueberfaellig</option></select></label>
              </div>
              <div className={styles.notePanel}>
                <div className={styles.notePanelHeader}>
                  <label htmlFor="invoice-note-field">Notizen / Anmerkungen</label>
                  <div className={styles.notePanelTools}>
                    <button
                      type="button"
                      className={styles.noteIconButton}
                      onClick={focusNoteField}
                      title="Notiz bearbeiten"
                      aria-label="Notiz bearbeiten"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className={styles.noteIconButton}
                      onClick={clearNoteField}
                      title="Notiz loeschen"
                      aria-label="Notiz loeschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <textarea
                  id="invoice-note-field"
                  ref={noteFieldRef}
                  className={styles.notesField}
                  rows={3}
                  value={invoice.note}
                  onChange={(event) => updateInvoice("note", event.target.value)}
                />
              </div>
            </section>
          </div>

          <aside className={styles.previewColumn} id="vorschau">
            <article className={`${styles.invoicePreview} ${styles[`invoiceTemplate_${invoiceTemplate}`]}`}>
              <header>
                <div className={styles.documentTitle}>
                  <h2>RECHNUNG</h2>
                </div>
              </header>
              <div className={styles.previewMeta}>
                <div>
                  <span>Rechnung an</span>
                  <strong>{invoice.customer || "Kunde"}</strong>
                  <p>{invoice.customerAddress}</p>
                </div>
                <div className={styles.companyBlock}>
                  <span>Rechnungssteller</span>
                  <strong>{creditorName}</strong>
                </div>
              </div>
              <div className={styles.invoiceInfoRow}>
                <div className={styles.subjectBlock}>
                  <span>Betreff</span>
                  <strong>{invoice.subject}</strong>
                </div>
                <div className={styles.invoiceFacts}>
                  <p><span>Rechnungsdatum:</span><strong>{invoice.issueDate}</strong></p>
                  <p><span>Faelligkeitsdatum:</span><strong>{invoice.dueDate}</strong></p>
                  <p><span>Leistungszeitraum:</span><strong>{invoice.servicePeriod}</strong></p>
                  <p><span>Rechnungsnummer:</span><strong>{invoice.number}</strong></p>
                </div>
              </div>
              <div className={styles.previewItems}>
                <div className={styles.previewItemsHead}><span>Beschreibung</span><span>Menge</span><span>Preis (netto)</span><span>MwSt.</span><span>Gesamt (netto)</span></div>
                {items.map((item) => {
                  const rate = resolveTaxRate(item)
                  return (
                    <div key={item.id}>
                      <span>{item.description}</span>
                      <span>{asNumber(item.quantity)} {item.unit.trim() || "Std."}</span>
                      <span>{euro(asNumber(item.price))}</span>
                      <span>{rate?.rate}%</span>
                      <b>{euro(itemNet(item))}</b>
                    </div>
                  )
                })}
              </div>
              <div className={styles.previewTotals}>
                <p><span>Netto</span><b>{euro(totals.net)}</b></p>
                {totals.taxes.map((entry) => <p key={entry.label}><span>{entry.label} auf {euro(entry.net)}</span><b>{euro(entry.tax)}</b></p>)}
                <strong><span>Gesamt</span><b>{euro(totals.gross)}</b></strong>
              </div>
              <section className={styles.paymentBlock}>
                <div>
                  <h3>Zahlungsart: {invoice.paymentMethod}</h3>
                  <p>Bitte ueberweisen Sie den offenen Betrag unter Angabe des Verwendungszwecks {invoice.number} auf unser unten angegebenes Konto.</p>
                  <p><strong>Bankverbindung:</strong><br />{creditorName}<br />IBAN: {creditorIban}<br />BIC: {creditorBic}</p>
                  <p><strong>Zahlungshinweis:</strong><br />{companyPaymentNote}</p>
                  <p>Sie koennen auch den QR-GiroCode auf der rechten Seite nutzen, um die Zahlung einfach und unkompliziert ueber Ihre Online-Banking-App durchzufuehren.</p>
                  <p><strong>Bitte beachten:</strong><br />Die Rechnung wird nach Zahlungseingang automatisch als bezahlt markiert.</p>
                </div>
                <div className={styles.qrBox}>
                  {qrCodeUrl ? <img src={qrCodeUrl} alt={`GiroCode fuer ${invoice.number}`} /> : <span>QR</span>}
                  <small>{qrCodeUrl ? "GiroCode scannen" : "Bankdaten pruefen"}</small>
                </div>
              </section>
              <footer>
                <div><strong>Zahlungsbedingungen</strong><span>{invoice.paymentTerms}</span></div>
              </footer>
              <p className={styles.thanks}>{invoice.note}</p>
              <div className={styles.documentFooter}>
                <span>TEL: 030 88 99300</span>
                <span>info@dreaminvoice.de</span>
                <span>www.dreaminvoice.de</span>
                <span>USt-IdNr.: DE123456789</span>
              </div>
            </article>
          </aside>
        </section>
        <div className={styles.stickySaveBar}>
          <button type="button" disabled={isWorking} onClick={saveDraft}><Save size={16} />Rechnung speichern</button>
        </div>
      </section>
    </main>
  )
}
