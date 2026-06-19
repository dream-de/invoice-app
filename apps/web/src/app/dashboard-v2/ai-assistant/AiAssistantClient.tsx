"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cloud,
  FileCheck2,
  FileText,
  Gauge,
  History,
  Languages,
  Laptop,
  Mail,
  MessageSquareText,
  PenLine,
  Plus,
  ReceiptText,
  Save,
  SearchCheck,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X
} from "lucide-react"
import styles from "./AiAssistantPremium.module.css"

type Option = { id: string; name?: string; number?: string; description?: string | null }
type ContextOptions = { customers: Option[]; projects: Option[]; articles: Option[]; invoices: Array<Option & { type?: string | null }> }
type Provider = { provider: string; model: string; label: string; enabled: boolean; localOnly: boolean; apiKeyConfigured: boolean; endpoint?: string | null }
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
type PromptTemplate = { title: string; prompt: string }
type AiMode = "Chat" | "Dokumente" | "Rechnungen" | "Angebote" | "Projekte" | "E-Mail" | "Analyse" | "Mehr"

const aiModes: AiMode[] = ["Chat", "Dokumente", "Rechnungen", "Angebote", "Projekte", "E-Mail", "Analyse", "Mehr"]

const modePanels: Record<AiMode, { title: string; text: string; actions: string[] }> = {
  Chat: { title: "Chat", text: "Freier KI-Dialog mit ausgewähltem Kontext, Provider und Prompt-Vorlagen.", actions: ["Neue Unterhaltung", "Prompt waehlen", "Antwort pruefen"] },
  Dokumente: { title: "Dokumente", text: "Dokumente zusammenfassen, pruefen und in Aufgaben oder E-Mails umwandeln.", actions: ["Dokument zusammenfassen", "Vertrag pruefen", "Kernaussagen extrahieren"] },
  Rechnungen: { title: "Rechnungen", text: "Rechnungstexte, Zahlungsnotizen und Leistungsbeschreibungen vorbereiten.", actions: ["Rechnungstext", "Zahlungshinweis", "Positionen formulieren"] },
  Angebote: { title: "Angebote", text: "Angebotstexte mit Umfang, Nutzen und naechsten Schritten erstellen.", actions: ["Angebotstext", "Leistungsumfang", "Projektziel"] },
  Projekte: { title: "Projekte", text: "Projektstatus, Zusammenfassungen und Kundenkommunikation aus Projektkontext erzeugen.", actions: ["Statusbericht", "Risiken", "Naechste Schritte"] },
  "E-Mail": { title: "E-Mail", text: "Kundenmails, Antworten und Begleittexte mit sauberem Ton vorbereiten.", actions: ["Kundenmail", "Antwort formulieren", "Kurz und freundlich"] },
  Analyse: { title: "Analyse", text: "Inhalte analysieren, offene Punkte finden und strukturierte Empfehlungen erzeugen.", actions: ["Zusammenfassen", "Risiken erkennen", "Entscheidungsvorlage"] },
  Mehr: { title: "Mehr Tools", text: "Weitere KI-Werkzeuge fuer Uebersetzen, Korrekturlesen, Vertrag und eigene Prompts.", actions: ["Uebersetzen", "Korrekturlesen", "Prompt erstellen"] }
}

const providerCards = [
  { id: "openai", title: "OpenAI / ChatGPT", model: "GPT-4o", tone: "Cloud", icon: Sparkles, color: "green" },
  { id: "anthropic", title: "Anthropic Claude", model: "Claude 3.5 Sonnet", tone: "Cloud", icon: BrainCircuit, color: "sand" },
  { id: "gemini", title: "Google Gemini", model: "Gemini 1.5 Pro", tone: "Cloud", icon: Sparkles, color: "blue" },
  { id: "copilot", title: "Microsoft Copilot", model: "GPT-4 via Copilot", tone: "Office", icon: CheckCircle2, color: "multi" },
  { id: "openrouter", title: "OpenRouter", model: "Mehrere Modelle", tone: "Gateway", icon: SearchCheck, color: "navy" },
  { id: "ollama", title: "Ollama lokal", model: "Llama 3 70B", tone: "Lokal", icon: Laptop, color: "slate" },
  { id: "custom", title: "Eigener Anbieter", model: "API Key", tone: "Custom", icon: Gauge, color: "ink" }
]

const tools = [
  { id: "invoice_text", title: "Rechnungstext", icon: ReceiptText },
  { id: "offer_description", title: "Angebotstext", icon: FileText },
  { id: "reminder", title: "Mahnung", icon: ShieldCheck },
  { id: "email", title: "E-Mail", icon: Mail },
  { id: "document_summary", title: "Zusammenfassen", icon: FileCheck2 },
  { id: "contract_review", title: "Vertrag pruefen", icon: ShieldCheck },
  { id: "translate", title: "Uebersetzen", icon: Languages },
  { id: "proofread", title: "Korrekturlesen", icon: PenLine }
]

const defaultPromptTemplates: PromptTemplate[] = [
  { title: "Rechnungstext", prompt: "Erstelle einen professionellen Rechnungstext mit kurzer Leistungsbeschreibung, freundlichem Dank und klarem Zahlungshinweis." },
  { title: "Angebotstext", prompt: "Formuliere einen Angebotsabschnitt mit Leistungsumfang, Nutzen fuer den Kunden und naechstem Schritt." },
  { title: "Mahnung", prompt: "Schreibe eine freundliche, aber klare Zahlungserinnerung mit Bezug auf das offene Dokument und Bitte um Rueckmeldung." },
  { title: "E-Mail", prompt: "Verfasse eine kurze Kunden-E-Mail mit professionellem Ton, konkretem Anliegen und freundlichem Abschluss." },
  { title: "Zusammenfassen", prompt: "Fasse den ausgewaehlten Kontext in Kernaussagen, Risiken und naechste Aufgaben zusammen." },
  { title: "Vertrag pruefen", prompt: "Pruefe den Vertrag auf auffaellige Klauseln, fehlende Angaben, Fristen und offene Rueckfragen." },
  { title: "Uebersetzen", prompt: "Uebersetze den Text praezise und bewahre Ton, Fachbegriffe und Formatierung." },
  { title: "Korrekturlesen", prompt: "Korrigiere Grammatik, Stil und Klarheit, ohne die fachliche Aussage zu veraendern." }
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

function ProviderLogo({ tone }: { tone: string }) {
  return <span className={styles.providerLogo} data-provider={tone} aria-hidden="true"><span /></span>
}

export function AiAssistantClient() {
  const [context, setContext] = useState<ContextOptions>({ customers: [], projects: [], articles: [], invoices: [] })
  const [providers, setProviders] = useState<Provider[]>([])
  const [draft, setDraft] = useState<Draft>(initialDraft)
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(defaultPromptTemplates)
  const [newPromptTitle, setNewPromptTitle] = useState("")
  const [newPromptText, setNewPromptText] = useState("")
  const [result, setResult] = useState("")
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [promptMenuOpen, setPromptMenuOpen] = useState(false)
  const [promptCreatorOpen, setPromptCreatorOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<AiMode>("Chat")

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

  const providerState = useMemo(() => providerCards.map((card) => {
    const configuredProvider = providers.find((provider) => provider.provider.toLowerCase().includes(card.id) || card.id.includes(provider.provider.toLowerCase()))
    const connected = Boolean(configuredProvider?.apiKeyConfigured || (card.id === "ollama" && configuredProvider?.endpoint))
    return {
      ...card,
      status: connected ? "Verbunden" : card.id === "ollama" ? "Bereit" : configuredProvider ? "Vorbereitet" : "Nicht verbunden",
      model: configuredProvider?.model || card.model
    }
  }), [providers])

  const connectedProviders = providerState.filter((provider) => provider.status === "Verbunden").length
  const activeProvider = providerState[0]
  const invoices = context.invoices.filter((item) => item.type !== "offer")
  const offers = context.invoices.filter((item) => item.type === "offer")
  const activeModePanel = modePanels[activeMode]

  function updateDraft(key: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function applyPrompt(template: PromptTemplate) {
    updateDraft("prompt", template.prompt)
    setPromptMenuOpen(false)
  }

  function savePrompt() {
    const title = newPromptTitle.trim() || "Eigener Prompt"
    const prompt = newPromptText.trim()
    if (!prompt) return
    const template = { title, prompt }
    setPromptTemplates((current) => [template, ...current])
    updateDraft("prompt", prompt)
    setNewPromptTitle("")
    setNewPromptText("")
    setPromptCreatorOpen(false)
    setPromptMenuOpen(true)
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
    setNotice("Entwurf erstellt mit " + data.provider + " / " + data.model + ".")
  }

  return (
    <main className={styles.page}>
      <section className={styles.aiHeader}>
        <div>
          <Link className={styles.backCircle} href="/dashboard-v2" aria-label="Zurueck zum Dashboard"><ArrowLeft size={18} /></Link>
          <span className={styles.aiMark}><Sparkles size={19} /></span>
          <div>
            <h1>KI-Assistent</h1>
            <p>Dein intelligenter Assistent fuer alle Aufgaben.</p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.primaryAction}><MessageSquareText size={16} /> Neue Unterhaltung</button>
          <div className={styles.promptMenuWrap} onMouseLeave={() => setPromptMenuOpen(false)}>
            <button type="button" className={styles.secondaryAction} onClick={() => { setSettingsOpen(false); setPromptMenuOpen((current) => !current) }}><WandSparkles size={16} /> Prompt-Vorlagen <ChevronDown size={14} /></button>
            {promptMenuOpen ? (
              <div className={styles.promptMenu}>
                <div className={styles.promptMenuHeader}><strong>Vorlage waehlen</strong><button type="button" onClick={() => { setPromptMenuOpen(false); setPromptCreatorOpen(true) }}><Plus size={14} /> Prompt erstellen</button></div>
                {promptTemplates.map((template) => <button key={template.title + "-" + template.prompt} type="button" onClick={() => applyPrompt(template)}><span>{template.title}</span><small>{template.prompt}</small></button>)}
              </div>
            ) : null}
          </div>
          <button type="button" className={styles.secondaryAction}><History size={16} /> Verlauf</button>
          <div className={styles.settingsMenuWrap} onMouseLeave={() => setSettingsOpen(false)}>
            <button type="button" className={styles.iconButton} aria-label="KI-Einstellungen" onClick={() => { setPromptMenuOpen(false); setSettingsOpen((current) => !current) }}><Settings size={18} /></button>
            {settingsOpen ? (
              <div className={styles.settingsMenu}>
                <Link href="/dashboard-v2/ai-assistant/settings"><Settings size={15} /> KI-Einstellungen</Link>
                <Link href="/dashboard-v2/ai-assistant/settings?tab=providers"><Cloud size={15} /> Provider verwalten</Link>
                <Link href="/dashboard-v2/ai-assistant/settings?tab=api-keys"><ShieldCheck size={15} /> API Keys</Link>
                <Link href="/dashboard-v2/ai-assistant/settings?tab=usage"><Gauge size={15} /> Nutzung & Limits</Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.metricGrid} aria-label="KI Status">
        <div data-tone="blue"><Cloud size={22} /><span>Provider verbunden</span><strong>{connectedProviders}/{providerCards.length}</strong><small>Aktiv</small></div>
        <div data-tone="green"><MessageSquareText size={22} /><span>Vorschlaege heute</span><strong>{result ? "25" : "24"}</strong><small>+12%</small></div>
        <div data-tone="violet"><FileCheck2 size={22} /><span>Dokumente analysiert</span><strong>{Math.max(18, context.invoices.length)}</strong><small>+8%</small></div>
        <div data-tone="orange"><Gauge size={22} /><span>Tokens verwendet</span><strong>128.450</strong><small>Heute</small></div>
        <div data-tone="sky"><Clock3 size={22} /><span>Letzte Aktivitaet</span><strong>Gerade eben</strong><small>Aktiv</small></div>
      </section>

      <section className={styles.assistantShell}>
        <aside className={styles.providerRail}>
          <div className={styles.railHeader}>
            <h2>KI-Provider</h2>
          </div>
          <div className={styles.providerList}>
            {providerState.map((provider) => {
              return (
                <article className={provider.id === activeProvider.id ? styles.providerRowActive : styles.providerRow} key={provider.id} data-provider={provider.color}>
                  <ProviderLogo tone={provider.color} />
                  <div>
                    <strong>{provider.title}</strong>
                    <small>{provider.model}</small>
                  </div>
                  <span className={provider.status === "Verbunden" ? styles.dotConnected : provider.status === "Bereit" ? styles.dotReady : styles.dotIdle}>{provider.status}</span>
                </article>
              )
            })}
          </div>
          <Link className={styles.providerManage} href="/dashboard-v2/ai-assistant/settings?tab=providers">Alle Provider verwalten</Link>
        </aside>

        <section className={styles.chatSurface}>
          <div className={styles.modeTabs}>
            {aiModes.map((item) => (
              <button key={item} type="button" onClick={() => setActiveMode(item)} className={activeMode === item ? styles.modeTabActive : styles.modeTab}>{item}{item === "Mehr" ? <ChevronDown size={14} /> : null}</button>
            ))}
            <button type="button" className={styles.promptAddButton} aria-label="Prompt hinzufuegen" onClick={() => setPromptCreatorOpen((current) => !current)}><Plus size={17} /></button>
          </div>

          <section className={styles.modePanel} aria-label={activeModePanel.title}>
            <div>
              <strong>{activeModePanel.title}</strong>
              <p>{activeModePanel.text}</p>
            </div>
            <div>
              {activeModePanel.actions.map((action) => <button key={action} type="button" onClick={() => updateDraft("prompt", action + ": bitte mit aktuellem Kontext vorbereiten.")}>{action}</button>)}
            </div>
          </section>

          {promptCreatorOpen ? (
            <div className={styles.promptCreator}>
              <div className={styles.promptCreatorHeader}><strong>Prompt erstellen</strong><button type="button" aria-label="Dialog schliessen" onClick={() => setPromptCreatorOpen(false)}><X size={16} /></button></div>
              <label>Name<input value={newPromptTitle} onChange={(event) => setNewPromptTitle(event.target.value)} placeholder="z. B. Zahlung freundlich klaeren" /></label>
              <label>Prompt<textarea value={newPromptText} onChange={(event) => setNewPromptText(event.target.value)} placeholder="Schreibe hier die komplette Prompt-Vorlage..." /></label>
              <div className={styles.promptCreatorActions}>
                <button type="button" className={styles.secondaryAction} onClick={() => setPromptCreatorOpen(false)}>Abbrechen</button>
                <button type="button" className={styles.primaryAction} onClick={savePrompt}><Save size={15} /> Hinzufuegen</button>
              </div>
            </div>
          ) : null}

          <div className={styles.chatHistory}>
            <div className={styles.userBubble}>
              <p>{draft.prompt || "Erstelle bitte einen professionellen Rechnungstext fuer einen IT-Dienstleister fuer eine Wartungspauschale."}</p>
              <small>10:45</small>
            </div>
            <div className={styles.assistantBubble}>
              <span><Bot size={18} /></span>
              <div>
                <strong>Gern! Hier ist ein professioneller Rechnungstext fuer Ihre Wartungspauschale:</strong>
                <p>{result || "Sehr geehrte Damen und Herren, vielen Dank fuer Ihren Auftrag und das entgegengebrachte Vertrauen. Gemaess unserer Vereinbarung erlauben wir uns, Ihnen die erbrachte Leistung in Rechnung zu stellen..."}</p>
                <small>10:45</small>
              </div>
            </div>
          </div>

          <form className={styles.chatComposer} onSubmit={generate}>
            <textarea value={draft.prompt} onChange={(event) => updateDraft("prompt", event.target.value)} placeholder="Nachricht an KI schreiben..." />
            <button type="submit" disabled={busy}><Send size={18} />{busy ? "Sendet" : "Senden"}</button>
          </form>
          {notice ? <p className={styles.notice}>{notice}</p> : null}
        </section>

        <aside className={styles.contextRail}>
          <section className={styles.sidePanel}>
            <h2>Kontext auswaehlen</h2>
            <label>Kunde<select value={draft.customerId} onChange={(event) => updateDraft("customerId", event.target.value)}><option value="">Kunde optional</option>{context.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Projekt<select value={draft.projectId} onChange={(event) => updateDraft("projectId", event.target.value)}><option value="">Projekt optional</option>{context.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label>Dokument<select value={draft.documentScope} onChange={(event) => updateDraft("documentScope", event.target.value)}><option value="">Dokument optional</option>{[...invoices, ...offers].map((item) => <option key={item.id} value={item.id}>{item.number || item.name}</option>)}</select></label>
            <label>Zeitraum<select value={draft.period} onChange={(event) => updateDraft("period", event.target.value)}><option value="current_month">Aktueller Monat</option><option value="last_month">Letzter Monat</option><option value="quarter">Quartal</option><option value="year">Jahr</option></select></label>
            <button type="button" className={styles.linkButton} onClick={() => setDraft(initialDraft)}>Kontext loeschen</button>
          </section>

          <section className={styles.sidePanel}>
            <h2>Vorlagen & Tools</h2>
            <div className={styles.toolGridCompact}>
              {tools.map((tool) => {
                const Icon = tool.icon
                return <button key={tool.id} type="button" onClick={() => updateDraft("task", tool.id)} className={draft.task === tool.id ? styles.toolCompactActive : styles.toolCompact}><Icon size={17} /><span>{tool.title}</span></button>
              })}
            </div>
            <button type="button" className={styles.moreTools}>Mehr Tools</button>
          </section>
        </aside>
      </section>
    </main>
  )
}
