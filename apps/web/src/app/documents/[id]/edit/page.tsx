"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { createPortal } from "react-dom"
import { useEffect, useMemo, useState } from "react"
import { Check, FileUp, Mail, Sparkles, Trash2, UserRound, X } from "lucide-react"
import { Currency, Input, Select, Textarea } from "@dream-invoice/ui"
import { documents } from "@/data/invoice-data"
import { useLanguage } from "@/lib/i18n"

type DocumentEditPageProps = {
  params: {
    id: string
  }
}

type Position = {
  id: string
  customerId?: string | null
  projectId?: string | null
  articleId?: string | null
  hours?: string
  hourlyRate?: string
  amount?: string
  label: string
  qty: string
  price: string
  category: string
}

type RecipientImport = {
  company: string
  contact: string
  email: string
  street: string
  zip: string
  city: string
  country: string
  vatId: string
}

type PositionImport = {
  label: string
  qty: string
  price: string
  category: string
}

type ApiInvoicePosition = {
  id: string
  title: string
  quantity: unknown
  netPrice: unknown
  vatRate?: unknown
  description?: string | null
  customerId?: string | null
  projectId?: string | null
  articleId?: string | null
  hours?: unknown
  hourlyRate?: unknown
  amount?: unknown
}

type ApiInvoice = {
  number?: string
  issueDate?: string | Date | null
  dueDate?: string | Date | null
  notes?: string | null
  customer?: {
    name?: string | null
    email?: string | null
    street?: string | null
    zip?: string | null
    city?: string | null
  } | null
  positions?: ApiInvoicePosition[]
}

const previewCustomerRecords = [
  {
    name: "Musterfirma GmbH",
    email: "buchhaltung@musterfirma.de",
    address: "Musterstraße 123\n12345 Musterstadt"
  },
  {
    name: "StartUp Berlin AG",
    email: "finance@startup-berlin.example",
    address: "Invalidenstraße 44\n10115 Berlin"
  },
  {
    name: "Handwerk Müller",
    email: "rechnung@handwerk-mueller.example",
    address: "Hauptstraße 18\n80331 München"
  }
]

function formatDateForInput(value: string | Date | null | undefined) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toISOString().slice(0, 10)
}

const categoryOptions = [
  "(Keine)",
  "Consulting",
  "Design",
  "Dienstleistung",
  "Entwicklung",
  "Hosting",
  "Webdesign",
  "Sonstiges"
]

const articleCatalog = [
  { value: "senior-development", label: "Senior Integration", price: 95, category: "Entwicklung" },
  { value: "webdesign-s", label: "UI Paket S", price: 850, category: "Webdesign" },
  { value: "server-maintenance", label: "Cloud Wartung", price: 120, category: "Hosting" },
  { value: "consulting", label: "Beratung", price: 100, category: "Consulting" },
  { value: "travel", label: "Anfahrt", price: 45, category: "Dienstleistung" }
]

function decimalInputValue(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : parseLocalizedDecimal(value, fallback)
  return Number.isFinite(number) ? String(number).replace(".", ",") : String(fallback)
}

function parseLocalizedDecimal(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback

  const trimmed = String(value ?? "").trim().replace(/\s/g, "")
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed

  if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
    return fallback
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : fallback
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split("-")

  if (!year || !month || !day) return value

  return `${day}.${month}.${year}`
}

function formatPreviewCustomerName(value: string) {
  const normalized = value.trim()

  return normalized === "Muster Firma GmbH" ? "Musterfirma GmbH" : value
}

function getPreviewCustomerName(value: string, emptyLabel: string) {
  const normalized = value.trim()

  if (!normalized || normalized === emptyLabel || normalized === "(Kein Kunde)" || normalized === "(No customer)") {
    return "Musterfirma GmbH"
  }

  return formatPreviewCustomerName(value)
}

function formatTaxRateLabel(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
}

export default function DocumentEditPage({ params }: DocumentEditPageProps) {
  const routeParams = useParams()
  const routeId = routeParams?.id
  const documentId = Array.isArray(routeId) ? routeId[0] : routeId ?? params.id
  const document = documents.find((item) => item.id === documentId) ?? documents[0]
  const { t } = useLanguage()

  const noCustomerOption = t("documents.edit.options.noCustomer")
  const noProjectOption = t("documents.edit.options.noProject")
  const defaultIntro = t("documents.edit.defaultIntro")

  function categoryLabel(category: string) {
    const labels: Record<string, string> = {
      "(Keine)": t("documents.edit.category.none"),
      Dienstleistung: t("documents.edit.category.service"),
      Entwicklung: t("documents.edit.category.development"),
      Sonstiges: t("documents.edit.category.misc")
    }

    return labels[category] ?? category
  }

  const [number, setNumber] = useState(document.number)
  const [customer, setCustomer] = useState(formatPreviewCustomerName(document.customer))
  const [project, setProject] = useState(noProjectOption)
  const [date, setDate] = useState("2026-05-14")
  const [serviceDate, setServiceDate] = useState("2026-05-14")
  const [dueDate, setDueDate] = useState("2026-05-28")
  const [email, setEmail] = useState("billing@aurora-labs.example")
  const [address, setAddress] = useState("Musterstraße 123\n12345 Musterstadt")
  const [intro, setIntro] = useState(defaultIntro)
  const [taxRateInput, setTaxRateInput] = useState("19")

  const [positions, setPositions] = useState<Position[]>([
    {
      id: "pos-webdesign-entwurf",
      label: "Webdesign Entwurf",
      qty: "1",
      price: "850",
      category: "(Keine)"
    },
    {
      id: "pos-frontend-entwicklung",
      label: "Frontend Entwicklung",
      qty: "5",
      price: "80",
      category: "(Keine)"
    }
  ])

  const [selectedArticle, setSelectedArticle] = useState("")
  const [recipientImportOpen, setRecipientImportOpen] = useState(false)
  const [recipientImportStep, setRecipientImportStep] = useState<"upload" | "preview">("upload")
  const [recipientFileName, setRecipientFileName] = useState("")
  const [positionImportOpen, setPositionImportOpen] = useState(false)
  const [positionImportStep, setPositionImportStep] = useState<"upload" | "preview">("upload")
  const [positionFileName, setPositionFileName] = useState("")
  const [recognizedPositions, setRecognizedPositions] = useState<PositionImport[]>([])
  const [recognizedRecipient, setRecognizedRecipient] = useState<RecipientImport>({
    company: "",
    contact: "",
    email: "",
    street: "",
    zip: "",
    city: "",
    country: t("documents.edit.recipient.defaultCountry"),
    vatId: ""
  })

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveMessage, setSaveMessage] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadInvoice() {
      try {
        const response = await fetch(`/api/invoice/get/${documentId}`)

        if (!response.ok) return

        const invoice = await response.json() as ApiInvoice

        if (cancelled) return

        setNumber(invoice.number || document.number)
        setCustomer(formatPreviewCustomerName(invoice.customer?.name || noCustomerOption))
        setEmail(invoice.customer?.email || "")

        const addressLines = [
          invoice.customer?.street,
          [invoice.customer?.zip, invoice.customer?.city].filter(Boolean).join(" ")
        ].filter(Boolean)

        setAddress(addressLines.length > 0 ? addressLines.join("\n") : "Musterstraße 123\n12345 Musterstadt")

        const invoiceDate = formatDateForInput(invoice.issueDate)
        setDate(invoiceDate || "2026-05-14")
        setServiceDate(invoiceDate)
        setDueDate(formatDateForInput(invoice.dueDate) || "")
        setIntro(invoice.notes || defaultIntro)

        const firstVatRate = invoice.positions?.find((item) => item.vatRate !== null && item.vatRate !== undefined)?.vatRate
        const parsedVatRate = parseLocalizedDecimal(firstVatRate, 19)
        setTaxRateInput(decimalInputValue(parsedVatRate, 19))

        if (Array.isArray(invoice.positions) && invoice.positions.length > 0) {
          setPositions(
            invoice.positions.map((item, index) => ({
              id: item.id || `pos-${index + 1}`,
              label: item.title || t("documents.edit.fallback.position"),
              qty: decimalInputValue(item.quantity, 1),
              price: decimalInputValue(item.netPrice, 0),
              category: item.description || "(Keine)",
              customerId: item.customerId ?? null,
              projectId: item.projectId ?? null,
              articleId: item.articleId ?? null,
              hours: item.hours == null ? "" : decimalInputValue(item.hours, 0),
              hourlyRate: item.hourlyRate == null ? "" : decimalInputValue(item.hourlyRate, 0),
              amount: item.amount == null ? "" : decimalInputValue(item.amount, 0)
            }))
          )
        }
      } catch {
        // Demo-Dokumente bleiben als Fallback erhalten.
      }
    }

    loadInvoice()

    return () => {
      cancelled = true
    }
  }, [defaultIntro, document.customer, document.number, documentId, noCustomerOption, t])

  const net = useMemo(
    () => positions.reduce((sum, item) => sum + parseLocalizedDecimal(item.qty) * parseLocalizedDecimal(item.price), 0),
    [positions]
  )
  const taxRatePercent = Math.max(0, Math.min(100, parseLocalizedDecimal(taxRateInput, 19)))
  const taxRateLabel = formatTaxRateLabel(taxRatePercent)
  const tax = net * (taxRatePercent / 100)
  const gross = net + tax

  function updatePosition(id: string, field: keyof Position, value: string) {
    setPositions((items) =>
      items.map((item) => {
        if (item.id !== id) return item

        return { ...item, [field]: value }
      })
    )
  }

  function addPosition() {
    setPositions((items) => [
      ...items,
      {
        id: `pos-${Date.now()}`,
        label: t("documents.edit.fallback.newPosition"),
        qty: "1",
        price: "",
        category: "(Keine)"
      }
    ])
  }

  function deletePosition(id: string) {
    setPositions((items) => items.filter((item) => item.id !== id))
  }

  function selectPreviewCustomer(value: string) {
    setCustomer(value)

    const record = previewCustomerRecords.find((item) => item.name === value)

    if (!record) return

    setEmail(record.email)
    setAddress(record.address)
  }

  function addCatalogArticle(articleValue = selectedArticle) {
    const article = articleCatalog.find((item) => item.value === articleValue)

    setPositions((items) => [
      ...items,
      {
        id: `pos-${Date.now()}`,
        label: article?.label ?? t("documents.edit.fallback.newPosition"),
        qty: "1",
        price: article ? decimalInputValue(article.price) : "",
        category: article?.category ?? "(Keine)"
      }
    ])

    setSelectedArticle("")
  }

  async function recognizeRecipientFile(file: File) {
    setRecipientFileName(file.name)

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/import/recipient", {
      method: "POST",
      body: formData
    })

    const result = await response.json()

    if (!response.ok || !result.ok || !result.recipient) {
      alert(result.warnings?.[0] || result.error || t("documents.edit.errors.recipientNotRecognized"))
      return
    }

    setRecognizedRecipient({
      company: result.recipient.company || "",
      contact: result.recipient.contact || "",
      email: result.recipient.email || "",
      street: result.recipient.street || "",
      zip: result.recipient.zip || "",
      city: result.recipient.city || "",
      country: result.recipient.country || t("documents.edit.recipient.defaultCountry"),
      vatId: result.recipient.vatId || ""
    })

    setRecipientImportStep("preview")
  }

  function updateRecognizedRecipient(field: keyof RecipientImport, value: string) {
    setRecognizedRecipient((current) => ({ ...current, [field]: value }))
  }

  function applyRecognizedRecipient() {
    setCustomer(recognizedRecipient.company || customer)
    setEmail(recognizedRecipient.email || email)
    setAddress(
      [
        recognizedRecipient.street,
        [recognizedRecipient.zip, recognizedRecipient.city].filter(Boolean).join(" "),
        recognizedRecipient.country
      ].filter(Boolean).join("\n")
    )

    setRecipientImportOpen(false)
    setRecipientImportStep("upload")
    setRecipientFileName("")
  }

  async function recognizePositionFile(file: File) {
    setPositionFileName(file.name)

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/import/positions", {
      method: "POST",
      body: formData
    })

    const result = await response.json()

    if (!response.ok || !result.ok || !Array.isArray(result.positions) || result.positions.length === 0) {
      alert(result.warnings?.[0] || result.error || t("documents.edit.errors.positionsNotRecognized"))
      return
    }

    setRecognizedPositions(
      result.positions.map((item: { label?: string; qty?: unknown; netPrice?: unknown; category?: string }) => ({
        label: item.label || t("documents.edit.fallback.position"),
        qty: decimalInputValue(item.qty, 1),
        price: decimalInputValue(item.netPrice, 0),
        category: item.category || "(Keine)"
      }))
    )

    setPositionImportStep("preview")
  }

  function updateRecognizedPosition(index: number, field: keyof PositionImport, value: string) {
    setRecognizedPositions((items) =>
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        return { ...item, [field]: value }
      })
    )
  }

  function deleteRecognizedPosition(index: number) {
    setRecognizedPositions((items) => items.filter((_, itemIndex) => itemIndex !== index))
  }

  function applyRecognizedPositions() {
    setPositions(
      recognizedPositions.map((item, index) => ({
        id: `pos-import-${Date.now()}-${index}`,
        label: item.label || t("documents.edit.fallback.position"),
        qty: item.qty || "0",
        price: item.price || "0",
        category: item.category || "(Keine)"
      }))
    )

    setPositionImportOpen(false)
    setPositionImportStep("upload")
    setPositionFileName("")
    setRecognizedPositions([])
  }

  function sendInvoiceEmail() {
    if (!email.trim()) {
      setSaveStatus("error")
      setSaveMessage("Bitte zuerst eine E-Mail-Adresse eintragen.")
      return
    }

    const subject = encodeURIComponent(`${t("documents.edit.email.subjectPrefix")} ${number}`)
    const body = encodeURIComponent(`${t("documents.edit.email.bodyPrefix")}\n\n${t("documents.edit.email.bodyMiddle")} ${number}.\n\n${t("documents.edit.email.bodyClosing")}`)
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  async function saveInvoice() {
    setSaveStatus("saving")
    setSaveMessage("")

    try {
      const response = await fetch(`/api/invoice/update/${documentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          number,
          date,
          serviceDate,
          dueDate,
          customerName: customer,
          customerEmail: email,
          customerAddress: address,
          project,
          taxRate: taxRatePercent / 100,
          tip: 0,
          note: intro,
          items: positions.map((item) => ({
            name: item.label,
            quantity: parseLocalizedDecimal(item.qty),
            price: parseLocalizedDecimal(item.price),
            category: item.category,
            customerId: item.customerId ?? null,
            projectId: item.projectId ?? null,
            articleId: item.articleId ?? null,
            hours: item.hours ? parseLocalizedDecimal(item.hours) : null,
            hourlyRate: item.hourlyRate ? parseLocalizedDecimal(item.hourlyRate) : null,
            amount: item.amount ? parseLocalizedDecimal(item.amount) : parseLocalizedDecimal(item.qty) * parseLocalizedDecimal(item.price)
          }))
        })
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.error || t("documents.edit.errors.saveFailed"))
      }

      setSaveStatus("saved")
      setSaveMessage(t("documents.edit.messages.saved"))
    } catch (error) {
      setSaveStatus("error")
      setSaveMessage(error instanceof Error ? error.message : t("documents.edit.errors.saveUnknown"))
    }
  }

  const editor = (
    <div className="bm-root fixed inset-0 z-[120] overflow-hidden text-slate-950">
      <div className="bm-shell">
        <aside className="bm-sidebar">
          <div className="bm-sidebar-inner">
            <div className="bm-sidebar-header">
              <Link href="/documents" className="bm-back-link">
                {t("documents.edit.back")}
              </Link>
              <h2>Rechnung bearbeiten</h2>
              <p className="bm-invoice-id">{number}</p>
            </div>

            <div className="bm-section">
              <h3 className="bm-section-title">Basisdaten</h3>
              <div className="bm-basis-grid">
                <label className="bm-label">
                  Rechnungs-Nr.
                  <Input className="bm-input" value={number} onChange={(event) => setNumber(event.target.value)} />
                </label>
                <label className="bm-label">
                  Datum
                  <Input className="bm-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                </label>
                <label className="bm-label">
                  Leistungsdatum
                  <Input className="bm-input" type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} />
                </label>
                <label className="bm-label">
                  Fälligkeit
                  <Input className="bm-input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                </label>
              </div>
            </div>

            <div className="bm-section">
              <h3 className="bm-section-title">Empfaenger</h3>

            <label className="bm-label">
              Kunde aus Daten
              <Select
                className="bm-input"
                value={customer}
                onChange={(event) => selectPreviewCustomer(event.target.value)}
                options={[
                  { value: noCustomerOption, label: noCustomerOption },
                  ...previewCustomerRecords.map((item) => ({ value: item.name, label: item.name }))
                ]}
              />
            </label>

            <label className="bm-label">
              Firmenname / Kunde
              <Input className="bm-input" value={customer} onChange={(event) => setCustomer(event.target.value)} />
            </label>

            <label className="bm-label">
              E-Mail
              <Input className="bm-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@firma.de" />
            </label>

            <label className="bm-label bm-address-label">
              Adresse (optional)
              <Textarea className="bm-textarea bm-address-textarea" value={address} onChange={(event) => setAddress(event.target.value)} placeholder={t("documents.edit.placeholders.address")} />
            </label>

            <label className="bm-label">
              Projekt (optional)
              <Select
                className="bm-input"
                value={project}
                onChange={(event) => setProject(event.target.value)}
                options={[
                  { value: noProjectOption, label: noProjectOption },
                  { value: "Portal Relaunch 2026", label: "Portal Relaunch 2026" },
                  { value: "Launch Kampagne Q4", label: "Launch Kampagne Q4" },
                  { value: "PRJ-2026-001 – Demo Setup", label: "PRJ-2026-001 - Demo Setup" }
                ]}
              />
            </label>

            <div className="bm-action-row">
              <button type="button" onClick={() => setRecipientImportOpen(true)} className="bm-icon-button" title={t("documents.edit.actions.changeRecipient")}>
                <UserRound className="h-4 w-4" />
                Empfaenger
              </button>
              <button type="button" onClick={sendInvoiceEmail} className="bm-icon-button" title={t("documents.edit.actions.sendEmail")}>
                <Mail className="h-4 w-4" />
                E-Mail
              </button>
              <button type="button" onClick={() => setPositionImportOpen(true)} className="bm-icon-button" title={t("documents.edit.actions.importPositions")}>
                <FileUp className="h-4 w-4" />
                Import
              </button>
            </div>
          </div>

          <div className="bm-section" id="invoice-positions">
          <div className="bm-section bm-time-import-section" aria-disabled="true">
            <div className="bm-section-head">
              <h3 className="bm-section-title">Zeiten übernehmen</h3>
              <span className="bm-disabled-badge">Deaktiviert</span>
            </div>
            <p className="bm-muted-copy">
              Vorbereitung fuer spaetere Uebernahme von Zeiten aus bestehenden Kunden, Projekten und Artikeln.
            </p>
            <button type="button" className="bm-time-import-button" disabled>
              Zeiten uebernehmen
            </button>
          </div>

            <div className="bm-section-head">
              <h3 className="bm-section-title">Positionen</h3>
              <div className="bm-catalog-row">
                <select
                  id="invoice-article-select"
                  aria-label={t("documents.edit.actions.addArticle")}
                  value={selectedArticle}
                  onChange={(event) => {
                    const articleValue = event.target.value
                    setSelectedArticle(articleValue)
                    if (articleValue) addCatalogArticle(articleValue)
                  }}
                  className="bm-catalog-select"
                >
                  <option value="">{t("documents.edit.options.addArticle")}</option>
                  {articleCatalog.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <button type="button" onClick={addPosition} className="bm-add-button">
                  + Neu
                </button>
              </div>
            </div>

            {positions.map((item) => (
              <div className="bm-position-card" key={item.id}>
                <div className="bm-position-card-head">
                  <Input
                    className="bm-position-title-input"
                    value={item.label}
                    onChange={(event) => updatePosition(item.id, "label", event.target.value)}
                    placeholder={t("documents.edit.placeholders.position")}
                    aria-label={t("documents.edit.preview.table.description")}
                  />
                  <button type="button" onClick={() => deletePosition(item.id)} className="bm-delete-button" aria-label={t("documents.edit.actions.deletePosition")}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="bm-position-grid">
                  <label>
                    <span className="bm-mini-label">Menge</span>
                    <Input
                      className="bm-mini-input"
                      inputMode="decimal"
                      value={item.qty}
                      onChange={(event) => updatePosition(item.id, "qty", event.target.value)}
                      aria-label={t("documents.edit.fields.quantity")}
                    />
                  </label>
                  <label>
                    <span className="bm-mini-label">Einzel (€)</span>
                    <Input
                      className="bm-mini-input"
                      inputMode="decimal"
                      value={item.price}
                      onChange={(event) => updatePosition(item.id, "price", event.target.value)}
                      aria-label={t("documents.edit.fields.unitPrice")}
                    />
                  </label>
                  <label>
                    <span className="bm-mini-label">Kategorie</span>
                    <Select
                      className="bm-mini-input"
                      value={item.category}
                      onChange={(event) => updatePosition(item.id, "category", event.target.value)}
                      options={categoryOptions.map((category) => ({ value: category, label: categoryLabel(category) }))}
                      aria-label={t("documents.edit.fields.category")}
                    />
                  </label>
                  <div className="bm-total-field">
                    <span className="bm-mini-label">Gesamt</span>
                    <div className="bm-position-total">
                      <Currency value={parseLocalizedDecimal(item.qty) * parseLocalizedDecimal(item.price)} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bm-editor-summary">
            <label className="bm-label bm-tax-rate-label">
              MwSt
              <Select
                className="bm-input"
                value={taxRateInput}
                onChange={(event) => setTaxRateInput(event.target.value)}
                options={[
                  { value: "0", label: "0%" },
                  { value: "7", label: "7%" },
                  { value: "19", label: "19%" }
                ]}
                aria-label="MwSt"
              />
            </label>
            <div className="bm-summary-row">
              <span>{t("documents.edit.totals.net")}</span>
              <span><Currency value={net} /></span>
            </div>
            <div className="bm-summary-row">
              <span>MwSt ({taxRateLabel}%)</span>
              <span><Currency value={tax} /></span>
            </div>
            <div className="bm-summary-row bm-summary-total">
              <span>{t("documents.edit.totals.gross")}</span>
              <Currency value={gross} />
            </div>
          </div>

          <button type="button" onClick={saveInvoice} disabled={saveStatus === "saving"} className="bm-btn-primary">
            {saveStatus === "saving" ? t("documents.edit.actions.saving") : "Änderungen speichern"}
          </button>

          {saveMessage && (
            <p className={`bm-save-message ${saveStatus === "error" ? "bm-save-error" : "bm-save-ok"}`}>
              {saveMessage}
            </p>
          )}
          </div>
        </aside>

        <main className="bm-preview-wrap">
          <div className="bm-preview-label">LIVE VORSCHAU</div>

          <div className="bm-preview-column">
            <div className="bm-preview-page">
              <header className="bm-preview-header">
                <div />

                <div className="bm-company bm-company-sample">
                  <h1>Mustermann GmbH</h1>
                </div>
              </header>

              <section className="bm-preview-address">
                <div className="bm-sender-line">
                  Mustermann GmbH | Musterstraße 123 | 10115 Berlin
                </div>
                <div className="bm-receiver-name">
                  {getPreviewCustomerName(customer, noCustomerOption)}
                  {address && (
                    <>
                      <br />
                      {address.split("\n").map((line, index) => (
                        <span key={`${line}-${index}`}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </section>

              <section className="bm-preview-title-row">
                <h1 className="bm-preview-title bm-preview-title-sample">
                  Rechnung {number}
                </h1>

                <div className="bm-preview-meta bm-preview-meta-sample">
                  <div>
                    <span>Rechnungs-Nr:</span> {number}
                  </div>
                  <div>
                    <span>Datum:</span> {formatDisplayDate(date)}
                  </div>
                  <div>
                    <span>Leistungsdatum:</span> {formatDisplayDate(serviceDate)}
                  </div>
                  <div>
                    <span>Kunden-Nr:</span> KD-0001
                  </div>
                </div>
              </section>

              <section className="bm-preview-text bm-preview-text-sample">
                <p>Sehr geehrte Damen und Herren,</p>
                <p>
                  vielen Dank für Ihren Auftrag. Wir berechnen Ihnen für unsere Leistungen wie folgt:
                </p>
              </section>

              <table className="bm-items-table bm-items-table-sample">
                <thead>
                  <tr>
                    <th>POS.</th>
                    <th>BEZEICHNUNG</th>
                    <th>MENGE</th>
                    <th>EINZELPREIS</th>
                    <th>GESAMT</th>
                  </tr>
                </thead>

                <tbody>
                  {positions.map((item, index) => {
                    const qty = parseLocalizedDecimal(item.qty)
                    const price = parseLocalizedDecimal(item.price)
                    const total = qty * price

                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.label || "Neue Position"}</td>
                        <td>{item.qty}</td>
                        <td>
                          <Currency value={price} />
                        </td>
                        <td>
                          <Currency value={total} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <section className="bm-summary bm-summary-sample">
                <div className="bm-summary-row">
                  <span>Netto:</span>
                  <span>
                    <Currency value={net} />
                  </span>
                </div>

                <div className="bm-summary-row">
                  <span>USt ({taxRateLabel}%):</span>
                  <span>
                    <Currency value={tax} />
                  </span>
                </div>

                <div className="bm-summary-row bm-summary-total">
                  <span>Gesamtbetrag:</span>
                  <Currency value={gross} />
                </div>
              </section>

              <footer className="bm-preview-footer">
                <div>
                  <strong>Mustermann GmbH</strong>
                  <span>Musterstraße 123</span>
                  <span>10115 Berlin</span>
                </div>

                <div>
                  <span>{email || "info@mustermann.example"}</span>
                  <span>www.mustermann.example</span>
                  <span>+49 30 123456</span>
                </div>

                <div>
                  <span>IBAN: DE00 0000 0000 0000</span>
                  <span>BIC: ABCDDEFFXXX</span>
                  <span>USt-ID: DE123456789</span>
                </div>
              </footer>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .bm-root {
          --bm-bg: #f5f5f7;
          --bm-white: #ffffff;
          --bm-border: #e5e7eb;
          --bm-field-bg: #f9fafb;
          --bm-focus: #16a34a;
          --bm-border-dark: #111111;
          --bm-text: #111827;
          --bm-text-muted: #6b7280;
          --bm-green: #16a34a;
          --bm-lime: #d9ff52;
          --bm-lime-hover: #cdf542;
          background: var(--bm-white);
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .bm-shell {
          display: flex;
          height: 100%;
          min-height: 100%;
          gap: 0;
          padding: 0;
          box-sizing: border-box;
          overflow: hidden;
        }

        .bm-sidebar {
          display: flex;
          position: relative;
          z-index: 1;
          flex: 0 0 460px;
          flex-direction: column;
          width: 460px;
          height: 100%;
          min-height: 0;
          border-right: 1px solid var(--bm-border);
          border-radius: 0;
          background: var(--bm-white);
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 32px;
          box-shadow: none;
        }

        .bm-preview-wrap {
          position: relative;
          display: flex;
          flex: 1;
          height: 100%;
          min-width: 0;
          box-sizing: border-box;
          border-radius: 0;
          align-items: flex-start;
          justify-content: center;
          background: #f5f6f7;
          overflow: auto;
          overscroll-behavior: contain;
          padding: 24px 24px 0;
          box-shadow: none;
        }

        .bm-preview-column {
          flex: 0 0 auto;
          box-sizing: border-box;
          width: 746.36px;
          min-height: max(1055.62px, calc(100% - 24px));
          background: var(--bm-white);
          box-shadow:
            -14px 0 18px -18px rgba(15, 23, 42, 0.22),
            14px 0 18px -18px rgba(15, 23, 42, 0.22);
        }

        .bm-preview-page {
          display: flex;
          box-sizing: border-box;
          width: 794px;
          min-height: 1123px;
          flex-direction: column;
          justify-content: space-between;
          border: 0;
          border-radius: 0;
          background: var(--bm-white);
          padding: 50px;
          box-shadow: none;
          transform: scale(0.94);
          transform-origin: top left;
        }

        .bm-sidebar-header,
        .bm-section-head,
        .bm-preview-header,
        .bm-preview-title-row {
          display: flex;
          justify-content: space-between;
          gap: 24px;
        }

        .bm-sidebar-header {
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .bm-sidebar-header h2,
        .bm-section-title {
          margin: 0;
          color: #111827;
          font-weight: 800;
        }

        .bm-sidebar-header h2 {
          font-size: 24px;
        }

        .bm-back-link {
          display: inline-flex;
          margin-bottom: 10px;
          color: #6b7280;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          text-transform: uppercase;
        }

        .bm-doc-status {
          border-radius: 999px;
          background: #ecfdf5;
          color: #15803d;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 800;
        }

        .bm-section {
          border-top: 1px solid #eef0f4;
          padding: 18px 0;
        }

        .bm-label {
          display: block;
          margin-bottom: 10px;
          color: #4b5563;
          font-size: 13px;
          font-weight: 700;
        }

        .bm-basis-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px 16px;
        }

        .bm-root input,
        .bm-root select,
        .bm-root textarea {
          width: 100%;
          box-sizing: border-box;
          margin-top: 4px;
          border-radius: 8px !important;
          border: 1px solid var(--bm-border) !important;
          background: var(--bm-field-bg) !important;
          padding: 8px 10px !important;
          color: var(--bm-text);
          font-size: 14px !important;
          font-weight: 500 !important;
          box-shadow: none !important;
          outline: none;
          transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
        }

        .bm-root input:focus,
        .bm-root select:focus,
        .bm-root textarea:focus {
          border-color: var(--bm-focus) !important;
          background: var(--bm-white) !important;
          box-shadow: 0 0 3px rgba(22, 163, 74, 0.2) !important;
        }

        .bm-root textarea {
          min-height: 82px;
          border-radius: 8px !important;
          resize: vertical;
        }

        .bm-action-row,
        .bm-catalog-row {
          display: flex;
          gap: 8px;
        }

        .bm-action-row {
          margin-top: 12px;
        }

        .bm-muted-copy {
          margin: 8px 0 12px;
          color: var(--bm-text-muted);
          font-size: 13px;
          line-height: 1.45;
        }

        .bm-disabled-badge {
          border-radius: 999px;
          background: #f3f4f6;
          color: #6b7280;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .bm-time-import-button {
          width: 100%;
          min-height: 36px;
          border: 1px solid var(--bm-border);
          border-radius: 6px;
          background: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
          font-size: 12px;
          font-weight: 800;
        }

        .bm-icon-button,
        .bm-add-button,
        .bm-delete-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 0;
          cursor: pointer;
        }

        .bm-icon-button {
          flex: 1;
          min-height: 36px;
          border-radius: 6px;
          background: #111827;
          color: #ffffff;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .bm-section-head {
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }

        .bm-catalog-row {
          align-items: center;
          min-width: 0;
        }

        .bm-catalog-select {
          width: 180px !important;
          min-height: 34px;
          box-shadow: none !important;
        }

        .bm-add-button,
        .bm-delete-button {
          height: 36px;
          border-radius: 6px;
        }

        .bm-add-button {
          min-width: 64px;
          background: #111111;
          color: var(--bm-lime);
          padding: 0 12px;
          font-size: 12px;
          font-weight: 800;
        }

        .bm-delete-button {
          flex: 0 0 32px;
          width: 32px;
          height: 32px;
          background: #fef2f2;
          color: #dc2626;
        }

        .bm-position-card {
          border: 1px solid var(--bm-border);
          border-radius: 10px;
          margin-bottom: 10px;
          background: var(--bm-white);
          padding: 12px 14px;
          box-shadow: none;
        }

        .bm-position-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 8px;
        }

        .bm-position-title {
          min-width: 0;
          overflow: hidden;
          color: var(--bm-text);
          font-size: 14px;
          font-weight: 700;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bm-position-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 72px 96px;
          gap: 10px;
        }

        .bm-position-grid > div {
          min-width: 0;
        }

        .bm-position-grid input,
        .bm-position-category {
          min-height: 40px !important;
          height: 40px !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }

        .bm-position-category {
          margin-top: 10px !important;
        }

        .bm-editor-summary {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          border: 0;
          border-top: 1px solid var(--bm-border);
          border-radius: 0;
          margin: 20px 0 16px;
          background: transparent;
          padding: 14px 0 0;
          color: var(--bm-text);
          font-size: 14px;
          box-shadow: none;
        }

        .bm-tax-rate-label {
          margin-bottom: 10px;
        }

        .bm-tax-rate-label .bm-input {
          height: 40px !important;
          min-height: 40px !important;
          margin-top: 6px !important;
        }

        .bm-summary {
          margin-top: 18px;
          margin-left: auto;
          width: 258px;
          max-width: 100%;
          font-size: 13px;
        }

        .bm-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 5px 0;
        }

        .bm-editor-summary .bm-summary-row {
          padding: 3px 0;
        }

        .bm-summary-total {
          border-top: 1px solid #e5e7eb;
          margin-top: 4px;
          padding-top: 8px;
          color: #111827;
          font-weight: 800;
        }

        .bm-editor-summary .bm-summary-total {
          font-size: 14px;
        }

        .bm-btn-primary {
          width: 100%;
          min-height: 44px;
          margin-top: auto;
          border: none;
          border-radius: 10px;
          background: var(--bm-lime);
          color: #111111;
          cursor: pointer;
          font-weight: 700;
          transition: background-color 0.18s ease, box-shadow 0.18s ease;
        }

        .bm-btn-primary:hover {
          background: var(--bm-lime-hover);
          box-shadow: 0 3px 8px rgba(15, 23, 42, 0.14);
        }

        .bm-btn-primary:disabled {
          cursor: progress;
          opacity: 0.72;
        }

        .bm-save-message {
          border-radius: 8px;
          margin-top: 12px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 700;
        }

        .bm-save-ok {
          background: #ecfdf5;
          color: #15803d;
        }

        .bm-save-error {
          background: #fef2f2;
          color: #b91c1c;
        }

        .bm-preview-header {
          margin-bottom: 66px;
        }

        .bm-company-name {
          color: #111827;
          font-size: 18px;
          font-weight: 800;
        }

        .bm-company-sub,
        .bm-company-meta,
        .bm-preview-meta,
        .bm-preview-address,
        .bm-preview-text,
        .bm-preview-footer {
          color: #374151;
          font-size: 12px;
          line-height: 1.55;
        }

        .bm-company-meta {
          text-align: right;
        }

        .bm-preview-address {
          margin-bottom: 40px;
        }

        .bm-preview-address div {
          color: #111827;
          font-weight: 800;
        }

        .bm-preview-address pre {
          margin: 4px 0 0;
          font-family: inherit;
          white-space: pre-wrap;
        }

        .bm-preview-title-row {
          align-items: flex-start;
          margin-bottom: 26px;
        }

        .bm-preview-title {
          margin: 0;
          color: #111827;
          font-size: 27px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .bm-preview-sub {
          color: #6b7280;
          font-size: 13px;
          font-weight: 700;
        }

        .bm-preview-meta {
          text-align: right;
        }

        .bm-preview-meta span {
          color: #111827;
          font-weight: 800;
        }

        .bm-items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          color: #111827;
          font-size: 12px;
        }

        .bm-items-table th,
        .bm-items-table td {
          border-bottom: 1px solid #e5e7eb;
          padding: 7px 4px;
        }

        .bm-items-table th {
          color: #6b7280;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-align: left;
          text-transform: uppercase;
        }

        .bm-items-table td:nth-child(3),
        .bm-items-table th:nth-child(3),
        .bm-items-table td:nth-child(4),
        .bm-items-table th:nth-child(4),
        .bm-items-table td:last-child,
        .bm-items-table th:last-child {
          text-align: right;
        }

        .bm-preview-footer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 26px;
          border-top: 1px solid #e5e7eb;
          margin-top: auto;
          padding-top: 16px;
          color: #6b7280;
          font-size: 10px;
        }

        .bm-preview-footer strong,
        .bm-preview-footer span {
          display: block;
        }

        @media (max-width: 900px) {
          .bm-shell {
            flex-direction: column;
            overflow: auto;
          }

          .bm-sidebar {
            flex: none;
            width: auto;
            height: auto;
            border-radius: 12px;
            overflow: visible;
          }

          .bm-preview-wrap {
            flex: none;
            height: auto;
            border-radius: 12px;
            overflow: visible;
          }
        }

        @media (max-width: 760px) {
          .bm-shell {
            padding: 14px;
          }

          .bm-basis-grid,
          .bm-position-grid,
          .bm-preview-title-row,
          .bm-preview-footer {
            grid-template-columns: 1fr;
          }

          .bm-sidebar {
            padding: 16px;
          }

          .bm-preview-wrap {
            padding: 20px 14px;
          }

          .bm-preview-page {
            padding: 28px 22px;
          }

          .bm-preview-header {
            flex-direction: column;
            margin-bottom: 36px;
          }

          .bm-company-meta,
          .bm-preview-meta {
            text-align: left;
          }
        }

        .bm-root {
          --bm-sidebar-width: 460px;
          --bm-green: #d7f041;
          --bm-green-hover: #cced35;
          --bm-dark-preview: #5d5d5d;
          --bm-border-soft: #ececec;
          --bm-text-soft: #6b7280;
          background: #ffffff;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .bm-shell {
          display: flex;
          height: 100%;
          min-height: 100%;
          overflow: hidden;
          background: #ffffff;
        }

        .bm-sidebar {
          flex: 0 0 var(--bm-sidebar-width);
          width: var(--bm-sidebar-width);
          height: 100%;
          min-height: 0;
          overflow-x: hidden;
          overflow-y: auto;
          border-right: 1px solid #e8e8e8;
          background: #ffffff;
          padding: 0;
          box-shadow: none;
        }

        .bm-sidebar-inner {
          min-height: 100%;
          padding: 24px 28px;
        }

        .bm-sidebar-header {
          display: block;
          margin-bottom: 24px;
        }

        .bm-sidebar-header h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .bm-back-link {
          display: inline-flex;
          margin-bottom: 14px;
          color: #9ca3af;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-decoration: none;
          text-transform: uppercase;
        }

        .bm-invoice-id {
          margin: 5px 0 0;
          color: #9ca3af;
          font-size: 13px;
          font-weight: 600;
        }

        .bm-section {
          margin-top: 24px;
          border-top: 0;
          padding: 0;
        }

        .bm-section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .bm-basis-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .bm-label {
          display: block;
          margin-bottom: 12px;
          color: #6b7280;
          font-size: 12px;
          font-weight: 700;
        }

        .bm-root input,
        .bm-root select,
        .bm-root textarea {
          width: 100%;
          box-sizing: border-box;
          margin-top: 6px;
          border: 1px solid #e5e7eb !important;
          border-radius: 16px !important;
          background: #ffffff !important;
          color: #111827;
          font-size: 13px !important;
          font-weight: 600 !important;
          outline: none;
          box-shadow: none !important;
          transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
        }

        .bm-root input,
        .bm-root select {
          height: 36px !important;
          min-height: 36px !important;
          padding: 0 12px !important;
        }

        .bm-root textarea {
          min-height: 72px !important;
          padding: 10px 12px !important;
          resize: vertical;
        }

        .bm-address-label {
          font-weight: 500;
        }

        .bm-address-textarea {
          font-weight: 400 !important;
        }

        .bm-root input:hover,
        .bm-root select:hover,
        .bm-root textarea:hover,
        .bm-root input:focus,
        .bm-root select:focus,
        .bm-root textarea:focus {
          border-color: var(--bm-green) !important;
          box-shadow: 0 0 0 2px rgba(215, 240, 65, 0.32) !important;
        }

        .bm-action-row {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .bm-icon-button {
          flex: 1;
          min-height: 34px;
          border: 0;
          border-radius: 7px;
          background: #0f172a;
          color: #ffffff;
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
        }

        .bm-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .bm-catalog-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .bm-catalog-select {
          width: 178px !important;
          height: 30px !important;
          min-height: 30px !important;
          margin-top: 0 !important;
          border-radius: 16px !important;
          font-size: 12px !important;
        }

        .bm-add-button {
          min-width: 64px;
          height: 30px;
          border: 0;
          border-radius: 7px;
          background: #0f172a;
          color: var(--bm-green);
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
        }

        .bm-position-card {
          margin-bottom: 10px;
          border: 1px solid #edf0f2;
          border-radius: 22px;
          background: #ffffff;
          padding: 13px 14px;
          box-shadow: 0 3px 10px rgba(15, 23, 42, 0.08);
        }

        .bm-position-card-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 34px;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }

        .bm-position-title-input {
          height: 30px !important;
          min-height: 30px !important;
          margin-top: 0 !important;
          border: 0 !important;
          border-radius: 15px !important;
          background: #f7f7f7 !important;
          padding: 0 12px !important;
          font-size: 13px !important;
          font-weight: 800 !important;
        }

        .bm-delete-button {
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 10px;
          background: #fff1f1;
          color: #ef4444;
          cursor: pointer;
        }

        .bm-position-grid {
          display: grid;
          grid-template-columns: 0.78fr 0.9fr 1fr 1fr;
          gap: 10px;
          align-items: end;
        }

        .bm-mini-label {
          display: block;
          margin-bottom: 4px;
          color: #9ca3af;
          font-size: 10px;
          font-weight: 700;
        }

        .bm-mini-input {
          height: 30px !important;
          min-height: 30px !important;
          margin-top: 0 !important;
          border: 0 !important;
          border-radius: 14px !important;
          background: #f7f7f7 !important;
          padding: 0 10px !important;
        }

        .bm-total-field {
          min-width: 0;
        }

        .bm-position-total {
          min-height: 30px;
          padding-top: 5px;
          text-align: right;
          color: #111827;
          font-size: 15px;
          font-weight: 800;
          white-space: nowrap;
        }

        .bm-editor-summary {
          margin-top: 14px;
          border: 1px solid #f0f1f3;
          border-radius: 22px;
          background: #fafafa;
          padding: 14px;
          font-size: 14px;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .bm-tax-rate-label {
          margin-bottom: 10px;
        }

        .bm-tax-rate-label .bm-input {
          height: 38px !important;
          min-height: 38px !important;
          margin-top: 6px !important;
        }

        .bm-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 10px;
          padding: 0;
          color: var(--bm-text-soft);
          font-size: 14px;
        }

        .bm-summary-total {
          margin: 0;
          border-top: 1px solid #e5e7eb;
          padding-top: 10px;
          color: #111827;
          font-size: 18px;
          font-weight: 800;
        }

        .bm-editor-summary .bm-summary-total {
          font-size: 18px;
        }

        .bm-btn-primary {
          width: 100%;
          height: 46px;
          min-height: 46px;
          margin-top: 18px;
          border: 0;
          border-radius: 24px;
          background: var(--bm-green);
          color: #111111;
          cursor: pointer;
          font-size: 15px;
          font-weight: 800;
        }

        .bm-btn-primary:hover {
          background: var(--bm-green-hover);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
        }

        .bm-preview-wrap {
          display: flex;
          flex: 1;
          min-width: 0;
          height: 100%;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow: auto;
          background: var(--bm-dark-preview);
          padding: 28px;
        }

        .bm-preview-label {
          margin-bottom: 10px;
          color: #d1d5db;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-align: center;
        }

        .bm-preview-column {
          width: 746.36px;
          min-height: 1055.62px;
          background: transparent;
          box-shadow: none;
        }

        .bm-preview-page {
          display: flex;
          width: 794px;
          min-height: 1123px;
          flex-direction: column;
          border: 0;
          border-radius: 0;
          background: #ffffff;
          padding: 52px;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.35);
          transform: scale(0.94);
          transform-origin: top left;
        }

        .bm-preview-header {
          display: flex;
          justify-content: space-between;
          gap: 28px;
          margin-bottom: 0;
        }

        .bm-sender-line {
          color: #6b7280;
          font-size: 12px;
        }

        .bm-company {
          color: #111827;
          text-align: right;
        }

        .bm-company h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .bm-company div {
          margin-top: 10px;
          color: #374151;
          font-size: 13px;
          line-height: 1.55;
        }

        .bm-company-sample {
          text-align: right;
          padding-top: 6px;
        }

        .bm-company-sample h1 {
          font-size: 18px;
          line-height: 1.15;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .bm-company-sample > div {
          display: none;
        }

        .bm-preview-address {
          margin: 70px 0 0;
          color: #111827;
          font-size: 14px;
          line-height: 1.45;
        }

        .bm-preview-address small,
        .bm-sender-line {
          display: block;
          margin-bottom: 12px;
          color: #111827;
          font-size: 10px;
          font-weight: 400;
          line-height: 1.25;
          letter-spacing: 0;
          text-decoration: underline;
        }

        .bm-receiver-name {
          font-weight: 400;
          line-height: 1.45;
        }

        .bm-preview-title-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 28px;
          margin-top: 96px;
          margin-bottom: 24px;
        }

        .bm-preview-title {
          margin: 0;
          color: #111827;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .bm-preview-title-sample {
          font-size: 18px;
          line-height: 1.2;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .bm-preview-meta {
          min-width: 230px;
          color: #374151;
          font-size: 12px;
          line-height: 1.55;
          text-align: right;
        }

        .bm-preview-meta span {
          color: #111827;
          font-weight: 800;
        }

        .bm-preview-text {
          color: #111827;
          font-size: 14px;
          line-height: 1.7;
        }

        .bm-items-table {
          width: 100%;
          margin-top: 30px;
          border-collapse: collapse;
          color: #111827;
          font-size: 13px;
        }

        .bm-items-table th {
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0;
          padding: 10px 0;
          text-align: left;
          text-transform: none;
        }

        .bm-items-table td {
          border-bottom: 1px solid #f1f1f1;
          padding: 12px 0;
        }

        .bm-items-table th:nth-child(2),
        .bm-items-table td:nth-child(2),
        .bm-items-table th:nth-child(3),
        .bm-items-table td:nth-child(3),
        .bm-items-table th:nth-child(4),
        .bm-items-table td:nth-child(4) {
          text-align: right;
        }

        .bm-summary {
          width: 280px;
          margin-top: 40px;
          margin-left: auto;
          font-size: 14px;
        }

        .bm-preview-footer {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin-top: auto;
          border-top: 1px solid #e5e7eb;
          padding-top: 18px;
          color: #6b7280;
          font-size: 11px;
          line-height: 1.45;
        }

        .bm-preview-footer strong,
        .bm-preview-footer span {
          display: block;
        }

        @media (max-width: 900px) {
          .bm-shell {
            height: auto;
            min-height: 100%;
            flex-direction: column;
            overflow: auto;
          }

          .bm-sidebar {
            flex: none;
            width: 100%;
            height: auto;
            overflow: visible;
          }

          .bm-preview-wrap {
            flex: none;
            height: auto;
            min-height: 100vh;
          }
        }

        @media (max-width: 760px) {
          .bm-sidebar-inner {
            padding: 18px;
          }

          .bm-basis-grid,
          .bm-position-grid,
          .bm-preview-title-row,
          .bm-preview-footer {
            grid-template-columns: 1fr;
          }

          .bm-position-total,
          .bm-preview-meta {
            text-align: left;
          }
        }

        /* Feinschliff Sample Preview */
        .bm-preview-page .bm-company h1 {
          font-size: 18px !important;
          font-weight: 800 !important;
          line-height: 1.15 !important;
        }

        .bm-preview-page .bm-company div {
          display: none !important;
        }

        .bm-preview-page .bm-sender-line {
          display: block !important;
          margin-bottom: 12px !important;
          color: #111827 !important;
          font-size: 10px !important;
          font-weight: 400 !important;
          line-height: 1.25 !important;
          letter-spacing: 0 !important;
          text-decoration: underline !important;
        }

        .bm-preview-page .bm-preview-title {
          font-size: 18px !important;
          line-height: 1.2 !important;
          font-weight: 800 !important;
        }

        .bm-preview-title-row {
          margin-top: 92px !important;
          align-items: flex-start !important;
        }

        /* Adresse links kleiner, nicht fett */
        .bm-address-textarea,
        .bm-address-textarea textarea,
        textarea.bm-address-textarea {
          font-size: 13px !important;
          font-weight: 400 !important;
          line-height: 1.45 !important;
          color: #111827 !important;
        }

        /* Label und Feldhöhe sauberer */
        .bm-address-label {
          margin-top: 14px !important;
        }

        .bm-address-textarea {
          min-height: 74px !important;
          padding-top: 14px !important;
        }

        .bm-preview-page {
          transform: scale(0.95);
          transform-origin: top center;
        }
      `}</style>
      {positionImportOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-4xl rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#111827]">{t("documents.edit.positionsImport.title")}</h2>
                <p className="mt-1 text-sm font-medium text-[#64748b]">
                  {t("documents.edit.positionsImport.description")}
                </p>
              </div>

              <button
                onClick={() => setPositionImportOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-slate-700 hover:bg-[#e4eaf2]"
                aria-label={t("documents.edit.import.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {positionImportStep === "upload" ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#cfd8e5] bg-[#f8fafc] p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-[var(--brand-lime)]">
                  <FileUp className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-[#111827]">
                  {t("documents.edit.positionsImport.uploadTitle")}
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-[#64748b]">
                  {t("documents.edit.positionsImport.uploadDescription")}
                </p>

                <label className="mt-6 inline-flex cursor-pointer rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800">
                  {t("documents.edit.import.chooseFile")}
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.csv,.pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,text/plain,text/csv,application/pdf,image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) recognizePositionFile(file)
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-3 rounded-[20px] bg-[#f8fafc] px-5 py-4">
                  <p className="text-sm font-bold text-[#111827]">{t("documents.edit.import.recognizedFile")} {positionFileName}</p>
                  <p className="mt-1 text-sm font-medium text-[#64748b]">
                    {t("documents.edit.positionsImport.reviewHint")}
                  </p>
                </div>

                <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                  {recognizedPositions.map((item, index) => (
                    <div key={index} className="grid grid-cols-[minmax(0,1fr)_86px_118px_118px_36px] items-end gap-2 rounded-[20px] border border-[#e5eaf0] bg-white p-3">
                      <Input label={t("documents.edit.preview.table.description")} value={item.label} onChange={(event) => updateRecognizedPosition(index, "label", event.target.value)} />
                      <Input inputMode="decimal" label={t("documents.edit.fields.quantity")} value={item.qty} onChange={(event) => updateRecognizedPosition(index, "qty", event.target.value)} />
                      <Input inputMode="decimal" label={t("documents.edit.fields.unitPrice")} value={item.price} onChange={(event) => updateRecognizedPosition(index, "price", event.target.value)} />
                      <Select label={t("documents.edit.fields.category")} value={item.category} onChange={(event) => updateRecognizedPosition(index, "category", event.target.value)} options={categoryOptions.map((category) => ({ value: category, label: categoryLabel(category) }))} />
                      <button
                        type="button"
                        onClick={() => deleteRecognizedPosition(index)}
                        className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#f8fafc] text-slate-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={t("documents.edit.actions.deletePosition")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setPositionImportStep("upload")}
                    className="rounded-full bg-[#eef2f7] px-5 py-2.5 text-sm font-bold text-[#334155]"
                  >
                    {t("documents.edit.import.back")}
                  </button>
                  <button
                    onClick={applyRecognizedPositions}
                    className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-extrabold text-[var(--brand-lime)]"
                  >
                    <Check className="h-4 w-4" />
                    {t("documents.edit.positionsImport.apply")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {recipientImportOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-3xl rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#111827]">{t("documents.edit.import.title")}</h2>
                <p className="mt-1 text-sm font-medium text-[#64748b]">
                  {t("documents.edit.import.description")}
                </p>
              </div>

              <button
                onClick={() => setRecipientImportOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-slate-700 hover:bg-[#e4eaf2]"
                aria-label={t("documents.edit.import.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {recipientImportStep === "upload" ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#cfd8e5] bg-[#f8fafc] p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-[var(--brand-lime)]">
                  <Sparkles className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-[#111827]">
                  {t("documents.edit.import.uploadTitle")}
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-[#64748b]">
                  {t("documents.edit.import.uploadDescription")}
                </p>

                <label className="mt-6 inline-flex cursor-pointer rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800">
                  {t("documents.edit.import.chooseFile")}
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.csv,.pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff,text/plain,text/csv,application/pdf,image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) recognizeRecipientFile(file)
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-3 rounded-[20px] bg-[#f8fafc] px-5 py-4">
                  <p className="text-sm font-bold text-[#111827]">{t("documents.edit.import.recognizedFile")} {recipientFileName}</p>
                  <p className="mt-1 text-sm font-medium text-[#64748b]">
                    {t("documents.edit.import.reviewHint")}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input label={t("documents.edit.import.company")} value={recognizedRecipient.company} onChange={(event) => updateRecognizedRecipient("company", event.target.value)} />
                  <Input label={t("documents.edit.import.contact")} value={recognizedRecipient.contact} onChange={(event) => updateRecognizedRecipient("contact", event.target.value)} />
                  <Input label={t("documents.edit.fields.email")} value={recognizedRecipient.email} onChange={(event) => updateRecognizedRecipient("email", event.target.value)} />
                  <Input label={t("documents.edit.import.vatId")} value={recognizedRecipient.vatId} onChange={(event) => updateRecognizedRecipient("vatId", event.target.value)} />
                  <Input label={t("documents.edit.import.street")} value={recognizedRecipient.street} onChange={(event) => updateRecognizedRecipient("street", event.target.value)} />
                  <Input label={t("documents.edit.import.zip")} value={recognizedRecipient.zip} onChange={(event) => updateRecognizedRecipient("zip", event.target.value)} />
                  <Input label={t("documents.edit.import.city")} value={recognizedRecipient.city} onChange={(event) => updateRecognizedRecipient("city", event.target.value)} />
                  <Input label={t("documents.edit.import.country")} value={recognizedRecipient.country} onChange={(event) => updateRecognizedRecipient("country", event.target.value)} />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setRecipientImportStep("upload")}
                    className="rounded-full bg-[#eef2f7] px-5 py-2.5 text-sm font-bold text-[#334155]"
                  >
                    {t("documents.edit.import.back")}
                  </button>
                  <button
                    onClick={applyRecognizedRecipient}
                    className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-extrabold text-[var(--brand-lime)]"
                  >
                    <Check className="h-4 w-4" />
                    {t("documents.edit.import.apply")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (!isMounted) return null

  return createPortal(editor, globalThis.document.body)
}
