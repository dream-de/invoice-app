"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"

type CustomerOption = { id: string; number?: string; name: string }
type ProjectRow = {
  id: string
  code: string
  name: string
  customerId: string | null
  customer: string
  status: string
  statusKey?: string
  description: string
  startDate: string | null
  endDate: string | null
  budgetAmount: number
  budget: string
  hourlyRate: number | null
  trackedHours: number
  invoicedHours: number
  openHours: number
  revenue: number
  progress: string
}

const statusOptions = [
  { value: "planned", label: "Geplant" },
  { value: "active", label: "Aktiv" },
  { value: "paused", label: "Pausiert" },
  { value: "completed", label: "Abgeschlossen" }
]

const emptyForm = {
  name: "",
  customerId: "",
  description: "",
  startDate: "",
  endDate: "",
  budget: "",
  hourlyRate: "",
  status: "active"
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(value) || 0)
}

function formatHours(value: number) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0) + " h"
}

function statusClass(status: string) {
  if (status === "Aktiv") return "bg-emerald-50 text-emerald-700"
  if (status === "Pausiert") return "bg-amber-50 text-amber-700"
  if (status === "Abgeschlossen") return "bg-slate-100 text-slate-700"
  return "bg-blue-50 text-blue-700"
}

export default function ProjectsPage() {
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [query, setQuery] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return projects
    return projects.filter((project) =>
      [project.code, project.name, project.customer, project.status, project.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [projects, query])

  const totals = useMemo(() => ({
    budget: projects.reduce((sum, project) => sum + Number(project.budgetAmount || 0), 0),
    trackedHours: projects.reduce((sum, project) => sum + Number(project.trackedHours || 0), 0),
    invoicedHours: projects.reduce((sum, project) => sum + Number(project.invoicedHours || 0), 0),
    openHours: projects.reduce((sum, project) => sum + Number(project.openHours || 0), 0),
    revenue: projects.reduce((sum, project) => sum + Number(project.revenue || 0), 0)
  }), [projects])

  async function loadData() {
    setIsLoading(true)
    try {
      const [customerResponse, projectResponse] = await Promise.all([
        fetch("/api/customers/list", { credentials: "same-origin" }),
        fetch("/api/projects/list", { credentials: "same-origin" })
      ])
      const [customerPayload, projectPayload] = await Promise.all([
        customerResponse.ok ? customerResponse.json() : Promise.resolve([]),
        projectResponse.ok ? projectResponse.json() : Promise.resolve([])
      ])
      const nextCustomers = Array.isArray(customerPayload) ? customerPayload : []
      const nextProjects = Array.isArray(projectPayload) ? projectPayload : []
      setCustomers(nextCustomers)
      setProjects(nextProjects)
      setForm((current) => ({ ...current, customerId: current.customerId || nextCustomers[0]?.id || "" }))
    } catch {
      setMessage("Projektverwaltung konnte nicht geladen werden.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  function updateForm(field: keyof typeof emptyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setMessage("")

    try {
      const customer = customers.find((item) => item.id === form.customerId)
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...form, customerName: customer?.name })
      })
      const result = await response.json()
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Projekt konnte nicht gespeichert werden.")
      setProjects((current) => [result.project, ...current.filter((project) => project.id !== result.project.id)])
      setForm({ ...emptyForm, customerId: form.customerId })
      setEditOpen(false)
      setMessage("Projekt wurde angelegt und dem Kunden zugeordnet.")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Projekt konnte nicht gespeichert werden.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="invoice-shell-3d min-h-[calc(100dvh-60px)] rounded-[40px] border border-[#e3e9f1] bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.045)] sm:p-8 lg:p-10">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end lg:mb-8">
        <div>
          <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#111827] sm:text-[34px] lg:text-[34px]">Projekte</h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-[1.45] text-[#64748b] sm:text-[17px] lg:text-lg">
            Zentrale Verbindung zwischen Kunden, Zeiterfassung und Rechnungen.
          </p>
        </div>
        <button onClick={() => setEditOpen(true)} className="rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95">
          + Neues Projekt
        </button>
      </div>

      <section className="mb-6 grid gap-3 md:grid-cols-5">
        <div className="rounded-[18px] border border-[#e5eaf0] bg-[#f8fafc] p-4"><span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Budget</span><strong className="mt-2 block text-lg text-[#0f172a]">{formatEuro(totals.budget)}</strong></div>
        <div className="rounded-[18px] border border-[#e5eaf0] bg-[#f8fafc] p-4"><span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Erfasste Stunden</span><strong className="mt-2 block text-lg text-[#0f172a]">{formatHours(totals.trackedHours)}</strong></div>
        <div className="rounded-[18px] border border-[#e5eaf0] bg-[#f8fafc] p-4"><span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Fakturierte Stunden</span><strong className="mt-2 block text-lg text-[#0f172a]">{formatHours(totals.invoicedHours)}</strong></div>
        <div className="rounded-[18px] border border-[#e5eaf0] bg-[#f8fafc] p-4"><span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Offene Stunden</span><strong className="mt-2 block text-lg text-[#0f172a]">{formatHours(totals.openHours)}</strong></div>
        <div className="rounded-[18px] border border-[#e5eaf0] bg-[#f8fafc] p-4"><span className="text-xs font-bold uppercase tracking-wide text-[#64748b]">Umsatz</span><strong className="mt-2 block text-lg text-[#0f172a]">{formatEuro(totals.revenue)}</strong></div>
      </section>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-[18px] border border-[#dfe6ee] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#334155] outline-none md:max-w-[420px]" placeholder="Projekt, Kunde oder Status suchen" />
        <span className="text-sm font-semibold text-[#64748b]">{isLoading ? "Daten werden geladen" : filtered.length + " Projekte"}</span>
      </div>
      {message ? <p className="mb-4 rounded-[16px] bg-[#eef6ff] px-4 py-3 text-sm font-bold text-[#1e3a8a]">{message}</p> : null}

      <div className="overflow-x-auto rounded-[24px] border border-[#e5eaf0] bg-white shadow-sm">
        <table className="w-full min-w-[1120px]">
          <thead className="bg-[#f4f7fb] text-left text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
            <tr>
              <th className="px-5 py-4">Projekt</th>
              <th className="px-5 py-4">Kunde</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Zeitraum</th>
              <th className="px-5 py-4 text-right">Budget</th>
              <th className="px-5 py-4 text-right">Erfasst</th>
              <th className="px-5 py-4 text-right">Fakturiert</th>
              <th className="px-5 py-4 text-right">Offen</th>
              <th className="px-5 py-4 text-right">Umsatz</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr key={project.id} className="border-t border-[#edf2f7]">
                <td className="px-5 py-4"><p className="font-extrabold text-[#0f172a]">{project.name}</p><p className="text-sm text-[#64748b]">{project.code}</p></td>
                <td className="px-5 py-4 font-semibold text-[#334155]">{project.customer}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${statusClass(project.status)}`}>{project.status}</span></td>
                <td className="px-5 py-4 font-semibold text-[#475569]">{project.startDate || "-"} bis {project.endDate || "offen"}</td>
                <td className="px-5 py-4 text-right font-semibold text-[#475569]">{project.budget}</td>
                <td className="px-5 py-4 text-right font-semibold text-[#475569]">{formatHours(project.trackedHours)}</td>
                <td className="px-5 py-4 text-right font-semibold text-[#475569]">{formatHours(project.invoicedHours)}</td>
                <td className="px-5 py-4 text-right font-semibold text-[#475569]">{formatHours(project.openHours)}</td>
                <td className="px-5 py-4 text-right font-extrabold text-[#0f172a]">{formatEuro(project.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-6">
          <form onSubmit={handleSubmit} className="w-full max-w-[760px] overflow-hidden rounded-[34px] border border-[#dfe6ee] bg-[#f8f9fb] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between border-b border-[#e6ebf1] px-6 py-5">
              <div><h2 className="text-xl font-black text-[#1b2333]">Projekt anlegen</h2><p className="mt-1 text-sm text-[#7b8799]">Kunde, Budget und Zeitbezug speichern.</p></div>
              <button type="button" onClick={() => setEditOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-lg text-slate-700 hover:bg-[#e4eaf2]" aria-label="Schliessen">x</button>
            </div>
            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <label className="text-sm font-bold text-[#334155]">Projektname<input className="mt-2 w-full rounded-[18px] border border-[#dfe6ee] bg-white px-4 py-3 outline-none" value={form.name} onChange={(event) => updateForm("name", event.target.value)} required /></label>
              <label className="text-sm font-bold text-[#334155]">Kunde<select className="mt-2 w-full rounded-[18px] border border-[#dfe6ee] bg-white px-4 py-3 outline-none" value={form.customerId} onChange={(event) => updateForm("customerId", event.target.value)} required>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
              <label className="text-sm font-bold text-[#334155]">Startdatum<input type="date" className="mt-2 w-full rounded-[18px] border border-[#dfe6ee] bg-white px-4 py-3 outline-none" value={form.startDate} onChange={(event) => updateForm("startDate", event.target.value)} /></label>
              <label className="text-sm font-bold text-[#334155]">Enddatum<input type="date" className="mt-2 w-full rounded-[18px] border border-[#dfe6ee] bg-white px-4 py-3 outline-none" value={form.endDate} onChange={(event) => updateForm("endDate", event.target.value)} /></label>
              <label className="text-sm font-bold text-[#334155]">Budget<input className="mt-2 w-full rounded-[18px] border border-[#dfe6ee] bg-white px-4 py-3 outline-none" inputMode="decimal" value={form.budget} onChange={(event) => updateForm("budget", event.target.value)} /></label>
              <label className="text-sm font-bold text-[#334155]">Stundensatz optional<input className="mt-2 w-full rounded-[18px] border border-[#dfe6ee] bg-white px-4 py-3 outline-none" inputMode="decimal" value={form.hourlyRate} onChange={(event) => updateForm("hourlyRate", event.target.value)} /></label>
              <label className="text-sm font-bold text-[#334155]">Status<select className="mt-2 w-full rounded-[18px] border border-[#dfe6ee] bg-white px-4 py-3 outline-none" value={form.status} onChange={(event) => updateForm("status", event.target.value)}>{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label className="md:col-span-2 text-sm font-bold text-[#334155]">Beschreibung<textarea className="mt-2 w-full rounded-[18px] border border-[#dfe6ee] bg-white px-4 py-3 outline-none" rows={4} value={form.description} onChange={(event) => updateForm("description", event.target.value)} /></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e6ebf1] px-6 py-4">
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-full bg-[#edf1f6] px-5 py-2.5 font-semibold text-[#334155]">Abbrechen</button>
              <button type="submit" disabled={isSaving || !form.customerId} className="rounded-full bg-black px-5 py-2.5 font-extrabold text-white disabled:opacity-50">{isSaving ? "Speichern..." : "Speichern"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
