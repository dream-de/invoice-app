"use client"

import { useEffect, useState, type FormEvent } from "react"
import {
  AtSign,
  Check,
  Circle,
  ClipboardCheck,
  Copy,
  FileCheck2,
  FileText,
  Languages,
  Mail,
  MessageSquareText,
  PlusSquare,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X
} from "lucide-react"
import styles from "./AiAssistantPremium.module.css"

type Option = { id: string; name?: string; number?: string; description?: string | null }
type ContextOptions = { customers: Option[]; projects: Option[]; articles: Option[]; invoices: Array<Option & { type?: string | null }> }
type Draft = {
  area: string
  task: string
  customerId: string
  projectId: string
  articleId: string
  invoiceId: string
  prompt: string
  period: string
  documentScope: string
}

type AiMode = "Chat" | "Dokumente" | "Rechnungen" | "Angebote" | "E-Mails" | "Analyse"

const aiModes: Array<{ label: AiMode; icon: typeof MessageSquareText }> = [
  { label: "Chat", icon: MessageSquareText },
  { label: "Dokumente", icon: FileCheck2 },
  { label: "Rechnungen", icon: ReceiptText },
  { label: "Angebote", icon: ClipboardCheck },
  { label: "E-Mails", icon: Mail },
  { label: "Analyse", icon: Circle }
]

const quickActions = ["Kuerzen", "Formell", "Rechtlich pruefen", "In Angebot umwandeln"]

const tools = [
  { id: "invoice_text", title: "Rechnung", icon: ReceiptText },
  { id: "offer_description", title: "Angebot", icon: FileText },
  { id: "reminder", title: "Mahnung", icon: ShieldCheck },
  { id: "email", title: "E-Mail", icon: Mail },
  { id: "document_summary", title: "Zusammenfassung", icon: FileCheck2 },
  { id: "contract_review", title: "Vertrag pruefen", icon: ShieldCheck },
  { id: "translate", title: "Uebersetzen", icon: Languages },
  { id: "classify", title: "Klassifizieren", icon: ClipboardCheck },
  { id: "extract", title: "Daten extrahieren", icon: PlusSquare }
]

const initialDraft: Draft = {
  area: "invoices",
  task: "invoice_text",
  customerId: "",
  projectId: "",
  articleId: "",
  invoiceId: "",
  prompt: "",
  period: "current_month",
  documentScope: ""
}

function displayOption(item: Option | undefined, fallback: string) {
  return item?.name || item?.number || fallback
}

export function AiAssistantClient() {
  const [context, setContext] = useState<ContextOptions>({ customers: [], projects: [], articles: [], invoices: [] })
  const [draft, setDraft] = useState<Draft>(initialDraft)
  const [result, setResult] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeMode, setActiveMode] = useState<AiMode>("Chat")

  useEffect(() => {
    fetch("/api/ai-assistant/context", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data?.ok) setContext({ customers: data.customers || [], projects: data.projects || [], articles: data.articles || [], invoices: data.invoices || [] })
      })
      .catch(() => null)
  }, [])

  const invoices = context.invoices.filter((item) => item.type !== "offer")
  const offers = context.invoices.filter((item) => item.type === "offer")
  const selectedDocument = [...invoices, ...offers].find((item) => item.id === draft.documentScope)
  const periodLabel = draft.period === "last_month" ? "Vormonat" : draft.period === "quarter" ? "Quartal" : draft.period === "year" ? "Jahr" : "Aktueller Monat"

  function updateDraft(key: keyof Draft, value: string) {
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
    setNotice("Entwurf erstellt mit DreamInvoice KI Premium.")
  }

  return (
    <main className={styles.page}>
      <section className={styles.premiumCanvas}>
        <nav className={styles.compactTabs} aria-label="KI-Assistent Bereiche">
          {aiModes.map(({ label, icon: Icon }) => (
            <button key={label} type="button" className={activeMode === label ? styles.compactTabActive : styles.compactTab} onClick={() => setActiveMode(label)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <section className={styles.assistantGrid}>
          <section className={styles.chatColumn} aria-label="KI-Chat">
            <div className={styles.chatHistoryPremium}>
              <article className={styles.userBubblePremium}>
                <p>{draft.prompt || "Erstelle bitte einen professionellen Rechnungstext fuer eine Wartungspauschale."}</p>
                <small>10:45 <Check size={15} /></small>
              </article>

              <article className={styles.assistantMessagePremium}>
                <span className={styles.aiSpark}><Sparkles size={18} /></span>
                <div className={styles.assistantBubblePremium}>
                  <p>{result || "Sehr geehrte Damen und Herren,\n\nvielen Dank fuer Ihren Auftrag und das entgegengebrachte Vertrauen.\n\nGemaess unserer Vereinbarung erlauben wir uns, Ihnen die erbrachte Leistung in Rechnung zu stellen.\n\nFuer Rueckfragen stehen wir Ihnen jederzeit gerne zur Verfuegung.\n\nMit freundlichen Gruessen\nIhr Team"}</p>
                  <footer>
                    <time>10:45</time>
                    <button type="button" aria-label="Entwurf kopieren"><Copy size={17} /></button>
                    <button type="button" aria-label="Gute Antwort"><ThumbsUp size={17} /></button>
                    <button type="button" aria-label="Schlechte Antwort"><ThumbsDown size={17} /></button>
                  </footer>
                </div>
              </article>
            </div>

            <div className={styles.quickActionRow}>
              {quickActions.map((action) => (
                <button key={action} type="button" onClick={() => updateDraft("prompt", action + ": " + (draft.prompt || "bitte den aktuellen Entwurf bearbeiten."))}>{action}</button>
              ))}
            </div>

            <form className={styles.premiumComposer} onSubmit={generate}>
              <textarea value={draft.prompt} onChange={(event) => updateDraft("prompt", event.target.value)} placeholder="Nachricht eingeben oder / fuer Befehle..." />
              <div className={styles.composerFooter}>
                <div className={styles.composerTools}>
                  <button type="button" aria-label="Datei anhaengen"><FileText size={18} /></button>
                  <button type="button" aria-label="Kontext erwaehnen"><AtSign size={18} /></button>
                  <button type="button" aria-label="Uebersetzen"><Languages size={18} /></button>
                </div>
                <div className={styles.composerActions}>
                  <select aria-label="KI-Modus" defaultValue="premium">
                    <option value="premium">DreamInvoice KI Premium</option>
                    <option value="standard">DreamInvoice KI Standard</option>
                    <option value="local">Lokale KI</option>
                  </select>
                  <button type="submit" disabled={busy} aria-label="Nachricht senden"><Send size={19} /></button>
                </div>
              </div>
            </form>
            {notice ? <p className={styles.notice}>{notice}</p> : null}
            <p className={styles.privacyNote}><ShieldCheck size={14} /> Alle Daten werden gemaess Ihren Einstellungen vertraulich verarbeitet.</p>
          </section>

          <aside className={styles.contextColumn}>
            <section className={styles.contextCard}>
              <header>
                <h2>Kontext</h2>
                <button type="button">Bearbeiten</button>
              </header>
              <label>Kunde<select value={draft.customerId} onChange={(event) => updateDraft("customerId", event.target.value)}><option value="">{displayOption(context.customers[0], "Musterkunde GmbH")}</option>{context.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><X size={16} /></label>
              <label>Projekt<select value={draft.projectId} onChange={(event) => updateDraft("projectId", event.target.value)}><option value="">{displayOption(context.projects[0], "Website Relaunch")}</option>{context.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><X size={16} /></label>
              <label>Dokument<select value={draft.documentScope} onChange={(event) => updateDraft("documentScope", event.target.value)}><option value="">{displayOption(selectedDocument, "Wartungsvertrag.pdf")}</option>{[...invoices, ...offers].map((item) => <option key={item.id} value={item.id}>{item.number || item.name}</option>)}</select><X size={16} /></label>
              <label>Zeitraum<select value={draft.period} onChange={(event) => updateDraft("period", event.target.value)}><option value="current_month">{periodLabel}</option><option value="last_month">Vormonat</option><option value="quarter">Quartal</option><option value="year">Jahr</option></select><X size={16} /></label>
            </section>

            <section className={styles.toolsCard}>
              <h2>Vorlagen & Tools</h2>
              <div className={styles.toolGridPremium}>
                {tools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <button key={tool.id} type="button" className={draft.task === tool.id ? styles.toolPremiumActive : styles.toolPremium} onClick={() => updateDraft("task", tool.id)}>
                      <Icon size={20} />
                      <span>{tool.title}</span>
                    </button>
                  )
                })}
              </div>
              <button type="button" className={styles.allTemplates}>Alle Vorlagen anzeigen <Send size={15} /></button>
            </section>
          </aside>
        </section>
      </section>
    </main>
  )
}
