"use client"

import Link from "next/link"
import { useEffect, useState, type FormEvent } from "react"
import { Plug, Sparkles } from "lucide-react"
import styles from "../phase15-16.module.css"

type Option = { id: string; name?: string; number?: string; description?: string | null }
type ContextOptions = { customers: Option[]; projects: Option[]; articles: Option[]; invoices: Array<Option & { type?: string | null }> }
type Provider = { provider: string; model: string; label: string; enabled: boolean; localOnly: boolean; apiKeyConfigured: boolean; endpoint?: string | null }

const areas = [
  ["invoices", "Rechnungen"],
  ["offers", "Angebote"],
  ["customers", "Kunden"],
  ["projects", "Projekte"],
  ["time", "Zeiterfassung"]
]

const tasks = [
  ["invoice_text", "Rechnungstexte generieren"],
  ["offer_description", "Angebotsbeschreibungen erstellen"],
  ["reminder", "Mahnungsvorschlaege"],
  ["email", "E-Mail-Vorschlaege"],
  ["customer_summary", "Kundennotizen zusammenfassen"]
]

export function AiAssistantClient() {
  const [context, setContext] = useState<ContextOptions>({ customers: [], projects: [], articles: [], invoices: [] })
  const [providers, setProviders] = useState<Provider[]>([])
  const [draft, setDraft] = useState({ area: "invoices", task: "invoice_text", customerId: "", projectId: "", articleId: "", invoiceId: "", prompt: "" })
  const [result, setResult] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch("/api/ai-assistant/context", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok) setContext({ customers: data.customers || [], projects: data.projects || [], articles: data.articles || [], invoices: data.invoices || [] })
      })
      .catch(() => null)

    fetch("/api/ai-assistant/providers", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok) setProviders(data.providers || [])
      })
      .catch(() => null)
  }, [])

  function updateDraft(key: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setNotice("")
    const response = await fetch("/api/ai-assistant/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    })
    const data = await response.json().catch(() => null)
    setBusy(false)
    if (!response.ok || !data?.ok) {
      setNotice(data?.error || "Vorschlag konnte nicht erstellt werden.")
      return
    }
    setResult(data.draft)
    setNotice(`Entwurf erstellt mit ${data.provider} / ${data.model}.`)
  }

  const invoices = context.invoices.filter((item) => item.type !== "offer")
  const offers = context.invoices.filter((item) => item.type === "offer")

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div><h1>KI-Assistent</h1><p>Texte, Mahnungen, E-Mails und Notizen mit vorhandenem DreamInvoice-Kontext vorbereiten.</p></div>
          <Link className={styles.backLink} href="/dashboard-v2"><Plug size={16} />Dashboard</Link>
        </header>

        <section className={styles.grid}>
          {areas.map(([value, label]) => <article key={value} className={styles.card}><span className={styles.badge}>{label}</span><h3>Bereit</h3><p>Kontext und Vorschlaege vorbereitet.</p></article>)}
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <h2>Vorschlag erstellen</h2>
            <form className={styles.form} onSubmit={generate}>
              <label>Bereich<select value={draft.area} onChange={(event) => updateDraft("area", event.target.value)}>{areas.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Funktion<select value={draft.task} onChange={(event) => updateDraft("task", event.target.value)}>{tasks.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Kunde<select value={draft.customerId} onChange={(event) => updateDraft("customerId", event.target.value)}><option value="">Ohne Kunde</option>{context.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Projekt<select value={draft.projectId} onChange={(event) => updateDraft("projectId", event.target.value)}><option value="">Ohne Projekt</option>{context.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Artikel<select value={draft.articleId} onChange={(event) => updateDraft("articleId", event.target.value)}><option value="">Ohne Artikel</option>{context.articles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Rechnung / Angebot<select value={draft.invoiceId} onChange={(event) => updateDraft("invoiceId", event.target.value)}><option value="">Ohne Dokument</option>{invoices.map((item) => <option key={item.id} value={item.id}>Rechnung {item.number}</option>)}{offers.map((item) => <option key={item.id} value={item.id}>Angebot {item.number}</option>)}</select></label>
              <label>Hinweis<textarea value={draft.prompt} onChange={(event) => updateDraft("prompt", event.target.value)} placeholder="Ton, Ziel oder besondere Punkte" /></label>
              <button className={styles.button} type="submit" disabled={busy}><Sparkles size={16} />{busy ? "Erstelle..." : "Vorschlag erstellen"}</button>
            </form>
          </article>

          <article className={styles.panel}>
            <h2>Provider & Modellverwaltung</h2>
            <div className={styles.list}>
              {providers.map((provider) => (
                <div className={styles.row} key={`${provider.provider}-${provider.model}`}>
                  <strong>{provider.label}</strong>
                  <span>{provider.provider}</span>
                  <span>{provider.model}</span>
                  <span>{provider.localOnly ? "Lokal" : "Cloud vorbereitet"}</span>
                  <span>{provider.apiKeyConfigured ? "Key gesetzt" : "Kein API-Key"}</span>
                </div>
              ))}
            </div>
            {notice ? <p className={styles.notice}>{notice}</p> : null}
            <h2>Entwurf</h2>
            <div className={styles.draft}>{result || "Noch kein Vorschlag erstellt."}</div>
          </article>
        </section>
      </div>
    </main>
  )
}
