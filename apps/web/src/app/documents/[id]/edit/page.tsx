"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Check, FileUp, Mail, PackagePlus, Plus, Sparkles, Trash2, UserRound, X } from "lucide-react"
import { Button, ContentCard, Currency, Input, Select, Textarea } from "@dream-invoice/ui"
import { documents } from "@/data/invoice-data"
import { useLanguage } from "@/lib/i18n"

type DocumentEditPageProps = {
  params: {
    id: string
  }
}

type Position = {
  id: string
  label: string
  qty: number
  price: number
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

type ApiInvoicePosition = {
  id: string
  title: string
  quantity: unknown
  netPrice: unknown
  description?: string | null
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
  const [customer, setCustomer] = useState(document.customer)
  const [project, setProject] = useState(noProjectOption)
  const [date, setDate] = useState("2026-05-14")
  const [serviceDate, setServiceDate] = useState("2026-05-14")
  const [dueDate, setDueDate] = useState("2026-05-28")
  const [email, setEmail] = useState("billing@aurora-labs.example")
  const [address, setAddress] = useState("Lindenallee 42\n50667 Koeln")
  const [intro, setIntro] = useState(defaultIntro)

  const [positions, setPositions] = useState<Position[]>([
    { id: "pos-1", label: "Dashboard Design", qty: 1, price: 851, category: "(Keine)" },
    { id: "pos-2", label: "Frontend Integration", qty: 5, price: 80, category: "(Keine)" }
  ])

  const [selectedArticle, setSelectedArticle] = useState("")
  const [recipientImportOpen, setRecipientImportOpen] = useState(false)
  const [recipientImportStep, setRecipientImportStep] = useState<"upload" | "preview">("upload")
  const [recipientFileName, setRecipientFileName] = useState("")
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

  useEffect(() => {
    let cancelled = false

    async function loadInvoice() {
      try {
        const response = await fetch(`/api/invoice/get/${documentId}`)

        if (!response.ok) return

        const invoice = await response.json() as ApiInvoice

        if (cancelled) return

        setNumber(invoice.number || document.number)
        setCustomer(invoice.customer?.name || noCustomerOption)
        setEmail(invoice.customer?.email || "")

        const addressLines = [
          invoice.customer?.street,
          [invoice.customer?.zip, invoice.customer?.city].filter(Boolean).join(" ")
        ].filter(Boolean)

        setAddress(addressLines.join("\n"))

        const invoiceDate = formatDateForInput(invoice.issueDate)
        setDate(invoiceDate || "2026-05-14")
        setServiceDate(invoiceDate)
        setDueDate(formatDateForInput(invoice.dueDate) || "")
        setIntro(invoice.notes || defaultIntro)

        if (Array.isArray(invoice.positions) && invoice.positions.length > 0) {
          setPositions(
            invoice.positions.map((item, index) => ({
              id: item.id || `pos-${index + 1}`,
              label: item.title || t("documents.edit.fallback.position"),
              qty: Number(item.quantity ?? 1) || 0,
              price: Number(item.netPrice ?? 0) || 0,
              category: item.description || "(Keine)"
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
    () => positions.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    [positions]
  )
  const tax = net * 0.19
  const gross = net + tax

  function updatePosition(id: string, field: keyof Position, value: string) {
    setPositions((items) =>
      items.map((item) => {
        if (item.id !== id) return item

        if (field === "qty" || field === "price") {
          return { ...item, [field]: Number(String(value).replace(",", ".")) || 0 }
        }

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
        qty: 1,
        price: 0,
        category: "(Keine)"
      }
    ])
  }

  function deletePosition(id: string) {
    setPositions((items) => items.filter((item) => item.id !== id))
  }

  function addCatalogArticle() {
    const article = articleCatalog.find((item) => item.value === selectedArticle)

    setPositions((items) => [
      ...items,
      {
        id: `pos-${Date.now()}`,
        label: article?.label ?? t("documents.edit.fallback.newPosition"),
        qty: 1,
        price: article?.price ?? 0,
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

  function sendInvoiceEmail() {
    if (!email.trim()) return

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
          taxRate: 0.19,
          tip: 0,
          note: intro,
          items: positions.map((item) => ({
            name: item.label,
            quantity: item.qty,
            price: item.price,
            category: item.category
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

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-white text-slate-950">
      <div className="flex h-10 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2 font-black">
          <span className="text-[var(--brand-lime)]">B</span>
          <span>Invoice</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>−</span>
          <span>□</span>
          <span>×</span>
        </div>
      </div>
      <div className="h-[calc(100vh-40px)] overflow-hidden bg-white px-4 py-5">
        <div className="invoice-edit-compact grid h-full w-full min-w-[1180px] grid-cols-[420px_minmax(0,1fr)] gap-3">
        <div className="invoice-edit-compact-left-flat h-[calc(100vh-80px)] w-[420px] shrink-0 overflow-y-auto pr-4">
          <div className="mb-9">
            <Link href="/documents" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400 no-underline hover:text-slate-900">
              {t("documents.edit.back")}
            </Link>
            <h1 className="mt-6 text-2xl font-black tracking-tight text-slate-950">{t("documents.edit.title")}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">{number}</p>
          </div>
          <ContentCard title={t("documents.edit.sections.base")} description="">
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("documents.edit.fields.invoiceNumber")} value={number} onChange={(event) => setNumber(event.target.value)} />
              <Input label={t("documents.edit.fields.date")} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <Input label={t("documents.edit.fields.serviceDate")} type="date" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} />
              <Input label={t("documents.edit.fields.dueDate")} type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>
          </ContentCard>

          <ContentCard title={t("documents.edit.sections.recipient")} description="">
            <Select
              label={t("documents.edit.fields.customerSelect")}
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
              options={[
                { value: noCustomerOption, label: noCustomerOption },
                { value: "Aurora Labs GmbH", label: "Aurora Labs GmbH" },
                { value: "Aurora Labs GmbH", label: "Aurora Labs GmbH" },
                { value: "Urban Commerce AG", label: "Urban Commerce AG" },
                { value: "Polar Digital GmbH", label: "Polar Digital GmbH" }
              ]}
            />

            <div className="mt-3">
              <Select
                label={t("documents.edit.fields.project")}
                value={project}
                onChange={(event) => setProject(event.target.value)}
                options={[
                  { value: noProjectOption, label: noProjectOption },
                  { value: "Portal Relaunch 2026", label: "Portal Relaunch 2026" },
                  { value: "Launch Kampagne Q4", label: "Launch Kampagne Q4" },
                  { value: "PRJ-2026-001 – Demo Setup", label: "PRJ-2026-001 – Demo Setup" }
                ]}
              />
            </div>

            <div className="mt-3">
              <Input label={t("documents.edit.fields.customerName")} value={customer} onChange={(event) => setCustomer(event.target.value)} />
            </div>

            <div className="mt-3">
              <Input label={t("documents.edit.fields.email")} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@firma.de" />
            </div>

            <div className="mt-3">
              <Textarea label={t("documents.edit.fields.addressOptional")} value={address} onChange={(event) => setAddress(event.target.value)} placeholder={t("documents.edit.placeholders.address")} />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRecipientImportOpen(true)}
                className="inline-flex h-8 min-h-8 items-center justify-center gap-1.5 rounded-full bg-black px-3 text-xs font-black text-[var(--brand-lime)]"
              >
                <UserRound className="h-3.5 w-3.5" />
                {t("documents.edit.actions.changeRecipient")}
              </button>

              <button
                type="button"
                onClick={sendInvoiceEmail}
                disabled={!email.trim()}
                className="inline-flex h-8 min-h-8 items-center justify-center gap-1.5 rounded-full bg-[#eef2f7] px-3 text-xs font-black text-slate-800 disabled:opacity-50"
              >
                <Mail className="h-3.5 w-3.5" />
                {t("documents.edit.actions.sendEmail")}
              </button>
            </div>
          </ContentCard>

          <ContentCard title="" description="">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.04em] text-slate-950">
                <span className="h-3 w-3 rounded-[3px] bg-[var(--brand-lime)] shadow-[0_0_0_2px_rgba(216,246,60,0.24)]" />
                {t("documents.edit.sections.positions")}
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label={t("documents.edit.actions.addArticle")}
                  value={selectedArticle}
                  onChange={(event) => setSelectedArticle(event.target.value)}
                  className="compact-mini-control w-[188px]"
                >
                  <option value="">{t("documents.edit.options.addArticle")}</option>
                  {articleCatalog.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={addCatalogArticle}
                  className="compact-mini-button inline-flex items-center justify-center gap-1.5 rounded-full bg-black px-3 text-xs font-black text-[var(--brand-lime)]"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  {t("documents.edit.actions.new")}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {positions.map((item, index) => (
                <div key={item.id} className={`position-card rounded-[32px] border ${index < 2 ? "border-[var(--brand-lime)]" : "border-[#e5eaf0]"} bg-white p-4 shadow-[0_8px_18px_rgba(15,23,42,0.10)]`}>
                  <div className="flex items-start gap-2">
                    <div className="position-card-title flex-1">
                      <Input className="bg-[#f8fbfc] px-4 py-1 text-sm font-black" value={item.label} onChange={(event) => updatePosition(item.id, "label", event.target.value)} placeholder={t("documents.edit.placeholders.position")} />
                    </div>

                    <button
                      type="button"
                      onClick={() => deletePosition(item.id)}
                      className="position-delete-button mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-transparent text-slate-300 hover:bg-slate-100 hover:text-red-500"
                      aria-label={t("documents.edit.actions.deletePosition")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="position-card-row mt-3 grid grid-cols-[82px_82px_104px_1fr] items-end gap-2">
                    <Input className="position-card-control bg-[#f8fbfc] px-3 py-1" label={t("documents.edit.fields.quantity")} value={String(item.qty)} onChange={(event) => updatePosition(item.id, "qty", event.target.value)} />
                    <Input className="position-card-control bg-[#f8fbfc] px-3 py-1" label={t("documents.edit.fields.unitPrice")} value={String(item.price)} onChange={(event) => updatePosition(item.id, "price", event.target.value)} />
                    <Select className="position-card-control bg-[#f8fbfc] px-3 py-1" label={t("documents.edit.fields.category")} value={item.category} onChange={(event) => updatePosition(item.id, "category", event.target.value)} options={categoryOptions.map((category) => ({ value: category, label: categoryLabel(category) }))} />
                    <div className="space-y-2 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t("documents.edit.fields.total")}</p>
                      <p className="h-8 pt-1 text-sm font-black text-slate-950">
                        <Currency value={item.qty * item.price} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>

          <div className="rounded-[32px] border border-[#e5eaf0] bg-[#f8fbfc] p-4 shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
            <div className="flex justify-between text-sm text-slate-500">
              <span>{t("documents.edit.totals.net")}</span>
              <span className="font-bold text-slate-900"><Currency value={net} /></span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-500">
              <span>{t("documents.edit.totals.vat")}</span>
              <span className="font-bold text-slate-900"><Currency value={tax} /></span>
            </div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-4 text-lg font-extrabold text-slate-950">
              <span>{t("documents.edit.totals.gross")}</span>
              <Currency value={gross} />
            </div>
          </div>

          <div className="sticky bottom-0 z-20 -mx-1 bg-white/95 px-1 py-4 backdrop-blur">
            <Button
              onClick={saveInvoice}
              disabled={saveStatus === "saving"}
              className="flex h-12 w-full items-center justify-center rounded-full bg-[var(--brand-lime)] text-sm font-black text-black shadow-[0_12px_26px_rgba(217,249,68,0.34)]"
            >
              {saveStatus === "saving" ? t("documents.edit.actions.saving") : t("documents.edit.actions.save")}
            </Button>

            {saveMessage && (
              <p className={`mt-3 rounded-2xl px-4 py-3 text-sm font-black ${saveStatus === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {saveMessage}
              </p>
            )}
          </div>
        </div>

        <div className="sticky top-0 h-[calc(100vh-40px)] min-w-0 self-start overflow-x-hidden overflow-y-auto bg-[#555]">
          <div className="flex min-h-full flex-col items-center bg-[#555] px-8 pb-8 pt-8">
            <div className="mb-4 flex w-[794px] max-w-full justify-center text-white/50">
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/50">{t("documents.edit.preview.live")}</p>
          </div>
          <div className="flex w-full justify-center">
              <div className="invoice-a4-preview relative mx-auto min-h-[1123px] w-[794px] shrink-0 rounded-[4px] bg-white px-14 py-12 shadow-[0_25px_50px_rgba(0,0,0,0.28)]" style={{ zoom: 0.9 }}>
                <div className="mb-20 flex justify-center">
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Dream Ledger GmbH</h2>
                </div>

                <div className="mt-6 grid grid-cols-[1fr_250px] items-start gap-12">
                  <div>
                    <p className="text-[11px] font-semibold leading-5 text-slate-400">
                      Dream Ledger GmbH | Lindenallee 42 | 50667 Koeln
                    </p>
                    <div className="mt-4 text-[13px] leading-6 text-slate-800">
                      <p className="font-extrabold text-slate-950">{customer}</p>
                      <p className="whitespace-pre-line">{address}</p>
                      <p className="text-slate-500">{email}</p>
                    </div>
                  </div>

                  <div className="text-right text-[13px] leading-6 text-slate-700">
                    <p><span className="font-bold text-slate-950">{t("documents.edit.preview.labels.invoiceNumber")}</span> {number}</p>
                    <p><span className="font-bold text-slate-950">{t("documents.edit.preview.labels.date")}</span> {date}</p>
                    <p><span className="font-bold text-slate-950">{t("documents.edit.preview.labels.serviceDate")}</span> {serviceDate}</p>
                    <p><span className="font-bold text-slate-950">{t("documents.edit.preview.labels.customerNumber")}</span> DI-DI-KD-1001</p>
                  </div>
                </div>

                <div className="mx-auto mt-28 max-w-[640px]">
                  <h4 className="text-[19px] font-semibold tracking-tight text-slate-950">
                    {t("documents.edit.preview.titlePrefix")} {number}
                  </h4>

                  <p className="mt-8 text-[11px] font-semibold leading-5 text-slate-900">{t("documents.edit.preview.greeting")}</p>
                  <p className="mt-5 text-[11px] font-semibold leading-5 text-slate-900">{intro}</p>

                  <div className="mt-7">
                    <table className="w-full border-collapse text-[11px]">
                      <thead className="bg-slate-100 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <tr className="border-b border-slate-200">
                          <th className="py-2.5 pl-2 pr-3">{t("documents.edit.preview.table.pos")}</th>
                          <th className="px-3 py-2.5">{t("documents.edit.preview.table.description")}</th>
                          <th className="px-3 py-2.5 text-right">{t("documents.edit.preview.table.quantity")}</th>
                          <th className="px-3 py-2.5 text-right">{t("documents.edit.preview.table.unitPrice")}</th>
                          <th className="py-2.5 pl-3 pr-2 text-right">{t("documents.edit.preview.table.total")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((item, index) => (
                          <tr key={item.id} className="border-b border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                            <td className="py-3 pl-2 pr-3 font-bold text-slate-600">{index + 1}</td>
                            <td className="px-3 py-3 font-bold text-slate-900">{item.label}</td>
                            <td className="px-3 py-3 text-right font-bold text-slate-800">{item.qty}</td>
                            <td className="px-3 py-3 text-right font-bold text-slate-800"><Currency value={item.price} /></td>
                            <td className="py-3 pl-3 pr-2 text-right font-black text-slate-950"><Currency value={item.price * item.qty} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-10 ml-auto max-w-[210px] space-y-1 text-[10.5px] font-black leading-4 text-slate-950">
                    <div className="flex justify-between gap-6">
                      <span>{t("documents.edit.preview.totals.net")}</span>
                      <span><Currency value={net} /></span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span>{t("documents.edit.preview.totals.vat")}</span>
                      <span><Currency value={tax} /></span>
                    </div>
                    <div className="flex justify-between gap-6">
                      <span>{t("documents.edit.preview.totals.gross")}</span>
                      <Currency value={gross} />
                    </div>
                  </div>

                  <p className="mt-7 text-[10px] font-semibold leading-4 text-slate-900">
                    {t("documents.edit.preview.payment.line1")}<br />
                    {t("documents.edit.preview.payment.line2")}
                  </p>

                  <div className="absolute bottom-10 left-14 right-14">
                    <div className="border-t border-slate-200" />
                    <div className="grid grid-cols-3 gap-10 pt-4 text-[9px] font-medium leading-4 text-slate-500">
                      <div>
                        <p>Dream Ledger GmbH</p>
                        <p>Lindenallee 42</p>
                        <p>50667 Koeln</p>
                      </div>
                      <div>
                        <p>{t("documents.edit.preview.footer.contact")}</p>
                        <p>{t("documents.edit.preview.footer.phone")} +49 30 1234567</p>
                        <p>{t("documents.edit.preview.footer.email")} office@dream-ledger.example</p>
                        <p>{t("documents.edit.preview.footer.web")} www.dream-ledger.example</p>
                      </div>
                      <div>
                        <p>{t("documents.edit.preview.footer.bank")}</p>
                        <p>{t("documents.edit.preview.footer.iban")} DE12 1005 0000 1234 5678 90</p>
                        <p>{t("documents.edit.preview.footer.bic")} BELA DE BE XXX</p>
                        <p>{t("documents.edit.preview.footer.vatId")} DE123456789</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <style>{`
        .invoice-edit-compact-left-flat > section {
          border: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
          border-radius: 0 !important;
          margin: 0 !important;
          padding: 0 0 22px 0 !important;
        }

        .invoice-edit-compact-left-flat > section > div,
        .invoice-edit-compact-left-flat > section > div > div {
          border: 0 !important;
          box-shadow: none !important;
          background: transparent !important;
          border-radius: 0 !important;
          padding: 0 !important;
        }

        .invoice-edit-compact-left-flat > section > div:first-child {
          margin-bottom: 14px !important;
        }

        .invoice-edit-compact-left-flat h2 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0 !important;
          font-size: 14px !important;
          line-height: 20px !important;
          font-weight: 900 !important;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .invoice-edit-compact-left-flat h2::before {
          content: "";
          width: 11px;
          height: 11px;
          border-radius: 3px;
          background: #d8f63c;
          box-shadow: 0 0 0 2px rgba(216, 246, 60, 0.24);
        }

        .invoice-edit-compact-left-flat p[class*="text-slate-500"] {
          display: none;
        }

        .invoice-edit-compact input,
        .invoice-edit-compact select,
        .invoice-edit-compact textarea {
          min-height: 42px;
          height: 42px;
          border-radius: 32px;
          border-color: #e5e7eb;
          background: #f8fafc;
          padding: 10px 10px;
          font-size: 14px;
          font-weight: 500;
        }

        .invoice-edit-compact textarea {
          min-height: 82px;
          height: 82px;
          border-radius: 32px;
          padding: 10px 10px;
          resize: vertical;
        }


        .invoice-edit-compact-left-flat label,
        .invoice-edit-compact-left-flat p[class*="uppercase"] {
          font-size: 10px;
          letter-spacing: 0.07em;
        }

        .invoice-edit-compact > div:first-child::-webkit-scrollbar {
          width: 8px;
        }

        .invoice-edit-compact > div:first-child::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: #cfd6df;
        }

        .invoice-edit-compact button {
          min-height: 42px;
        }

        .invoice-edit-compact .compact-mini-control,
        .invoice-edit-compact .compact-mini-button {
          min-height: 28px !important;
          height: 28px !important;
          border-radius: 24px !important;
          padding: 4px 10px !important;
          font-size: 12px !important;
          font-weight: 800 !important;
        }

        .invoice-edit-compact .position-delete-button {
          min-height: 24px !important;
          height: 24px !important;
          width: 24px !important;
          padding: 0 !important;
        }

        .invoice-edit-compact .position-card {
          border-radius: 32px !important;
          padding: 14px 16px 16px !important;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.10) !important;
        }

        .invoice-edit-compact .position-card input,
        .invoice-edit-compact .position-card select {
          min-height: 32px !important;
          height: 32px !important;
          border: 0 !important;
          background: #f8fbfc !important;
          box-shadow: none !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
        }

        .invoice-edit-compact .position-card-title input {
          min-height: 34px !important;
          height: 34px !important;
          font-size: 15px !important;
          font-weight: 800 !important;
        }

        .invoice-edit-compact .position-card label,
        .invoice-edit-compact .position-card p[class*="uppercase"] {
          font-size: 10px !important;
          color: #9aa4b2 !important;
          letter-spacing: 0.04em !important;
        }

        .invoice-edit-compact .position-card-row {
          gap: 10px !important;
        }


        .invoice-edit-compact input:focus,
        .invoice-edit-compact select:focus,
        .invoice-edit-compact textarea:focus {
          outline: none;
          border-color: #d9f944;
          box-shadow: 0 0 0 2px rgba(217, 249, 68, 0.7);
        }
      `}</style>
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
}
