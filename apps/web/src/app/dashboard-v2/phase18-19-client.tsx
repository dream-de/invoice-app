"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Company = { id: string; name: string; slug: string; status: string; email?: string | null; city?: string | null; iban?: string | null; bic?: string | null; customers?: number; projects?: number; invoices?: number; bankAccounts?: number; documents?: number }
type Location = { id: string; companyId: string; companyName?: string; name: string; city?: string | null; email?: string | null }
type Tenant = { id: string; name: string; slug: string; status: string; companies?: number; memberships?: number }
type ApiCenter = { apiKeys?: Array<{ id: string; label: string; keyPreview: string; status: string }>; webhooks?: Array<{ id: string; event: string; url: string; status: string }>; integrations?: Array<{ id: string; provider: string; status: string }>; restEndpoints?: Array<{ method: string; path: string; status: string }>; events?: string[]; providers?: string[]; docs?: { overview: string; authentication: string; basePath: string } }

const pageStyle: React.CSSProperties = { minHeight: "100vh", padding: 28, background: "var(--premium-bg, #0f172a)", color: "var(--premium-text, #f8fafc)", fontFamily: "Inter, system-ui, sans-serif" }
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }
const panelStyle: React.CSSProperties = { border: "1px solid rgba(148,163,184,.25)", borderRadius: 8, padding: 18, background: "rgba(15,23,42,.72)" }
const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid rgba(148,163,184,.35)", borderRadius: 6, padding: "10px 12px", background: "rgba(15,23,42,.8)", color: "inherit" }
const buttonStyle: React.CSSProperties = { border: 0, borderRadius: 6, padding: "10px 14px", background: "#38bdf8", color: "#082f49", fontWeight: 700, cursor: "pointer" }
function BackLink() { return <Link href="/dashboard-v2" style={{ color: "#93c5fd", textDecoration: "none" }}>Dashboard</Link> }

export function CompaniesClient() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [form, setForm] = useState({ name: "", email: "", city: "", iban: "", bic: "" })
  const [message, setMessage] = useState("")
  async function load() { const result = await fetch("/api/companies", { cache: "no-store" }).then((response) => response.json()); setCompanies(Array.isArray(result.companies) ? result.companies : []) }
  useEffect(() => { void load() }, [])
  async function submit(event: React.FormEvent) { event.preventDefault(); const result = await fetch("/api/companies", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }).then((response) => response.json()); setMessage(result.ok ? "Firma gespeichert." : result.error || "Speichern fehlgeschlagen."); if (result.ok) { setForm({ name: "", email: "", city: "", iban: "", bic: "" }); await load() } }
  return <main style={pageStyle}><BackLink /><h1>Firmen</h1><p>Eigene Kunden, Projekte, Rechnungen, Bankkonten und Dokumente werden pro Firma getrennt gefuehrt.</p><section style={gridStyle}><form onSubmit={submit} style={panelStyle}><h2>Firma anlegen</h2>{(["name","email","city","iban","bic"] as const).map((field) => <p key={field}><input style={inputStyle} placeholder={field.toUpperCase()} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></p>)}<button style={buttonStyle}>Speichern</button><p>{message}</p></form>{companies.map((company) => <article key={company.id} style={panelStyle}><h2>{company.name}</h2><p>{company.city || "Ohne Ort"} · {company.status}</p><p>{company.email || "Keine E-Mail"} · {company.iban || "Keine IBAN"}</p><p>Kunden {company.customers ?? 0} · Projekte {company.projects ?? 0} · Rechnungen {company.invoices ?? 0}</p><p>Bankkonten {company.bankAccounts ?? 0} · Dokumente {company.documents ?? 0}</p></article>)}</section></main>
}

export function LocationsClient() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [form, setForm] = useState({ companyId: "", name: "", city: "", email: "" })
  async function load() { const [cr, lr] = await Promise.all([fetch("/api/companies", { cache: "no-store" }).then((r) => r.json()), fetch("/api/company-locations", { cache: "no-store" }).then((r) => r.json())]); const cs = Array.isArray(cr.companies) ? cr.companies : []; setCompanies(cs); setLocations(Array.isArray(lr.locations) ? lr.locations : []); setForm((current) => ({ ...current, companyId: current.companyId || cs[0]?.id || "" })) }
  useEffect(() => { void load() }, [])
  async function submit(event: React.FormEvent) { event.preventDefault(); const result = await fetch("/api/company-locations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }).then((response) => response.json()); if (result.ok) { setForm({ companyId: companies[0]?.id || "", name: "", city: "", email: "" }); await load() } }
  return <main style={pageStyle}><BackLink /><h1>Standorte</h1><section style={gridStyle}><form onSubmit={submit} style={panelStyle}><h2>Standort anlegen</h2><p><select style={inputStyle} value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })}>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></p>{(["name","city","email"] as const).map((field) => <p key={field}><input style={inputStyle} placeholder={field.toUpperCase()} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></p>)}<button style={buttonStyle}>Speichern</button></form>{locations.map((location) => <article key={location.id} style={panelStyle}><h2>{location.name}</h2><p>{location.companyName}</p><p>{location.city || "Ohne Ort"} · {location.email || "Keine E-Mail"}</p></article>)}</section></main>
}

export function TenantsClient() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [name, setName] = useState("")
  async function load() { const result = await fetch("/api/tenants", { cache: "no-store" }).then((response) => response.json()); setTenants(Array.isArray(result.tenants) ? result.tenants : []) }
  useEffect(() => { void load() }, [])
  async function submit(event: React.FormEvent) { event.preventDefault(); const result = await fetch("/api/tenants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) }).then((response) => response.json()); if (result.ok) { setName(""); await load() } }
  return <main style={pageStyle}><BackLink /><h1>Mandanten</h1><section style={gridStyle}><form onSubmit={submit} style={panelStyle}><h2>Mandant vorbereiten</h2><p><input style={inputStyle} placeholder="Mandantenname" value={name} onChange={(event) => setName(event.target.value)} /></p><button style={buttonStyle}>Speichern</button></form><article style={panelStyle}><h2>Rollenmodell</h2>{["Super Admin", "Firmen Admin", "Mitarbeiter", "Kunde"].map((role) => <p key={role}>{role}</p>)}</article>{tenants.map((tenant) => <article key={tenant.id} style={panelStyle}><h2>{tenant.name}</h2><p>{tenant.slug} · {tenant.status}</p><p>Firmen {tenant.companies ?? 0} · Rechte {tenant.memberships ?? 0}</p></article>)}</section></main>
}

export function ApiCenterClient() {
  const [data, setData] = useState<ApiCenter>({})
  const [keyLabel, setKeyLabel] = useState("Production API Key")
  const [webhookUrl, setWebhookUrl] = useState("https://example.test/webhooks/dreaminvoice")
  const [eventName, setEventName] = useState("invoice.created")
  const [provider, setProvider] = useState("Zapier")
  const [secret, setSecret] = useState("")
  const events = useMemo(() => data.events?.length ? data.events : ["invoice.created", "invoice.paid", "customer.created", "project.created", "payment.received"], [data.events])
  const providers = useMemo(() => data.providers?.length ? data.providers : ["Zapier", "Make", "n8n", "Microsoft Power Automate"], [data.providers])
  async function load() { const result = await fetch("/api/api-center", { cache: "no-store" }).then((response) => response.json()); setData(result) }
  useEffect(() => { void load() }, [])
  async function action(body: Record<string, unknown>) { const result = await fetch("/api/api-center", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((response) => response.json()); setSecret(result.plainKey || result.secret || ""); await load() }
  return <main style={pageStyle}><BackLink /><h1>API Center</h1><p>{data.docs?.overview || "REST API, API Keys, Webhooks und Integrationen vorbereitet."}</p><section style={gridStyle}><article style={panelStyle}><h2>API Keys</h2><p><input style={inputStyle} value={keyLabel} onChange={(event) => setKeyLabel(event.target.value)} /></p><button style={buttonStyle} onClick={() => void action({ action: "apiKey.create", label: keyLabel })}>API Key erstellen</button>{secret ? <p>Einmalig sichtbar: {secret}</p> : null}{data.apiKeys?.map((key) => <p key={key.id}>{key.label} · {key.keyPreview} · {key.status} <button onClick={() => void action({ action: "apiKey.disable", id: key.id })}>Deaktivieren</button> <button onClick={() => void action({ action: "apiKey.delete", id: key.id })}>Loeschen</button></p>)}</article><article style={panelStyle}><h2>Webhooks</h2><p><select style={inputStyle} value={eventName} onChange={(event) => setEventName(event.target.value)}>{events.map((item) => <option key={item}>{item}</option>)}</select></p><p><input style={inputStyle} value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} /></p><button style={buttonStyle} onClick={() => void action({ action: "webhook.create", event: eventName, url: webhookUrl })}>Webhook erstellen</button>{data.webhooks?.map((hook) => <p key={hook.id}>{hook.event} · {hook.status}<br />{hook.url}</p>)}</article><article style={panelStyle}><h2>Integrationen</h2><p><select style={inputStyle} value={provider} onChange={(event) => setProvider(event.target.value)}>{providers.map((item) => <option key={item}>{item}</option>)}</select></p><button style={buttonStyle} onClick={() => void action({ action: "integration.prepare", provider })}>Integration vorbereiten</button>{data.integrations?.map((item) => <p key={item.id}>{item.provider} · {item.status}</p>)}</article><article style={panelStyle}><h2>Dokumentation</h2><p>{data.docs?.authentication}</p>{data.restEndpoints?.map((endpoint) => <p key={endpoint.path}>{endpoint.method} {endpoint.path} · {endpoint.status}</p>)}</article></section></main>
}
