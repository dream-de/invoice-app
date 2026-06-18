"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, ContentCard, PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

type CustomerRecord = {
  id: string
  number: string
  name: string
  contact?: string | null
  email?: string | null
  phone?: string | null
  street?: string | null
  zip?: string | null
  city?: string | null
  country?: string | null
  status?: string | null
  notes?: string | null
}

type InvoiceRecord = {
  id: string
  number?: string
  type?: string | null
  status?: string | null
  grossTotal?: number | string | null
  issueDate?: string | Date | null
  customer?: string | null
}

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  open: "Offen",
  inactive: "Inaktiv"
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { t } = useLanguage()
  const [customer, setCustomer] = useState<CustomerRecord | null>(null)
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    status: "active",
    notes: ""
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const [customerResponse, invoiceResponse] = await Promise.all([
          fetch("/api/customers/list", { credentials: "same-origin" }),
          fetch("/api/invoice/list", { credentials: "same-origin" })
        ])

        const [customerRows, invoiceRows] = await Promise.all([
          customerResponse.ok ? customerResponse.json() : Promise.resolve([]),
          invoiceResponse.ok ? invoiceResponse.json() : Promise.resolve([])
        ])

        if (cancelled) return

        const current = Array.isArray(customerRows)
          ? customerRows.find((item: CustomerRecord) => item.id === params.id) ?? null
          : null

        setCustomer(current)
        setInvoices(Array.isArray(invoiceRows) ? invoiceRows.filter((item: InvoiceRecord) => item.customer === current?.name) : [])

        if (current) {
          setForm({
            name: current.name || "",
            contact: current.contact || "",
            email: current.email || "",
            phone: current.phone || "",
            street: current.street || "",
            zip: current.zip || "",
            city: current.city || "",
            country: current.country || "Deutschland",
            status: current.status || "active",
            notes: current.notes || ""
          })
        }
      } catch {
        if (!cancelled) {
          setError("Kundendaten konnten nicht geladen werden.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [params.id])

  const grossTotal = useMemo(() => {
    return invoices.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  }, [invoices])

  async function saveCustomer() {
    if (!customer) return
    setSaving(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch(`/api/customers/update/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Kunde konnte nicht gespeichert werden.")
      }

      setCustomer(result.customer)
      setMessage("Kunde gespeichert.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde konnte nicht gespeichert werden.")
    } finally {
      setSaving(false)
    }
  }

  async function archiveCustomer(mode: "archive" | "delete") {
    if (!customer) return
    setSaving(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch(`/api/customers/delete/${customer.id}?mode=${mode}`, { method: "DELETE" })
      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Kunde konnte nicht entfernt werden.")
      }

      router.push("/customers")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde konnte nicht entfernt werden.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <PageShell title="Kunde" description="Lade Kundendaten...">
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8 text-sm font-semibold text-slate-500">
          Kundendaten werden geladen.
        </div>
      </PageShell>
    )
  }

  if (!customer) {
    return (
      <PageShell title="Kunde nicht gefunden" description="Der Datensatz existiert nicht mehr oder wurde noch nicht angelegt.">
        <div className="space-y-4 rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-8">
          <p className="text-sm font-semibold text-slate-500">Kein echter Kunde mit dieser ID gefunden.</p>
          <Link href="/customers" className="inline-flex rounded-full bg-black px-4 py-2 text-sm font-extrabold text-white no-underline">Zur Kundenliste</Link>
        </div>
      </PageShell>
    )
  }

  const invoiceCount = invoices.length
  const activeLabel = statusLabels[form.status] || form.status

  return (
    <PageShell title={customer.name} description="Kundenakte und Stammdaten bearbeiten.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/customers" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-700 no-underline shadow-sm ring-1 ring-slate-200">Zurück</Link>
        <Link href="/documents/new" className="rounded-full bg-black px-4 py-2 text-sm font-extrabold text-white no-underline shadow-sm">Neue Rechnung</Link>
        <button type="button" onClick={() => void archiveCustomer("archive")} disabled={saving} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 disabled:opacity-60">Archivieren</button>
        <button type="button" onClick={() => void archiveCustomer("delete")} disabled={saving} className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-red-700 ring-1 ring-red-200 disabled:opacity-60">Löschen</button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ContentCard title="Stammdaten" description="Echte Kundendaten bearbeiten und speichern.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-slate-700">
              Kundennummer
              <input value={customer.number} readOnly className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Status
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                <option value="active">Aktiv</option>
                <option value="open">Offen</option>
                <option value="inactive">Inaktiv</option>
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Firmenname
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Ansprechpartner
              <input value={form.contact} onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              E-Mail
              <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Telefon
              <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Straße
              <input value={form.street} onChange={(event) => setForm((current) => ({ ...current, street: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              PLZ
              <input value={form.zip} onChange={(event) => setForm((current) => ({ ...current, zip: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Ort
              <input value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Land
              <input value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
            </label>
          </div>

          <label className="mt-4 block text-sm font-bold text-slate-700">
            Notizen
            <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700" />
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void saveCustomer()} disabled={saving}>{saving ? "Speichert..." : "Kunde speichern"}</Button>
            {message ? <span className="self-center text-sm font-semibold text-emerald-700">{message}</span> : null}
            {error ? <span className="self-center text-sm font-semibold text-red-700">{error}</span> : null}
          </div>
        </ContentCard>

        <div className="space-y-6">
          <ContentCard title="Kundenakte" description="Verknüpfte Rechnungen und Angebote.">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Dokumente</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{invoiceCount}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Volumen</p>
                <p className="mt-2 text-2xl font-black text-slate-950">{new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(grossTotal)}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 col-span-2">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Status</p>
                <p className="mt-2 text-base font-black text-slate-950">{activeLabel}</p>
              </div>
            </div>
          </ContentCard>

          <ContentCard title="Verknüpfte Dokumente" description="Echte Dokumente aus der Rechnungs-API.">
            {invoices.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">Noch keine verknüpften Dokumente vorhanden.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <Link key={invoice.id} href={`/documents/${invoice.id}`} className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 no-underline hover:border-slate-400">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-950">{invoice.number || "Dokument"}</p>
                        <p className="text-xs font-semibold text-slate-500">{invoice.type === "offer" ? "Angebot" : "Rechnung"} · {invoice.status || "open"}</p>
                      </div>
                      <span className="text-sm font-black text-slate-950">{new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(invoice.grossTotal || 0))}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
