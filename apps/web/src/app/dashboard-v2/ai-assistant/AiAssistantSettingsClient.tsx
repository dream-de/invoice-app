"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Cloud,
  Code2,
  Copy,
  Database,
  Gauge,
  Globe2,
  Image,
  Laptop,
  Mail,
  MoreHorizontal,
  PlugZap,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  TestTube2,
  Webhook
} from "lucide-react"
import styles from "./AiAssistantPremium.module.css"

const settingsTabs = ["Provider & Verbindungen", "Modelle & Optionen", "API Keys", "E-Mail Integration", "Webhooks", "Nutzung & Limits", "Allgemeine Einstellungen"]

const settingsTabPanels = {
  "Modelle & Optionen": {
    title: "Modelle & Optionen",
    description: "Standardmodelle, Antwortstil und technische Modelloptionen vorbereiten.",
    items: ["Standardmodell pro Provider", "Temperatur und Max Tokens", "Antwortlaenge und Kreativitaet", "Fallback-Modell bei Ausfall"]
  },
  "API Keys": {
    title: "API Keys",
    description: "Schluesselverwaltung als UI vorbereiten. Es werden keine echten API Keys angezeigt oder gespeichert.",
    items: ["Maskierte API-Key Felder", "Organisation optional", "Key-Rotation vorbereiten", "Verbindung testen"]
  },
  "E-Mail Integration": {
    title: "E-Mail Integration",
    description: "KI-Funktionen fuer Kundenmails, Entwuerfe und Verarbeitung vorbereiten.",
    items: ["E-Mail Entwuerfe", "Antwortvorschlaege", "Postfach-Kontext", "Signatur-Regeln"]
  },
  "Webhooks": {
    title: "Webhooks",
    description: "Automationen und externe Ereignisse fuer spaetere Backend-Anbindung strukturieren.",
    items: ["Webhook URL", "Secret Token maskiert", "Event-Auswahl", "Letzte Zustellung"]
  },
  "Nutzung & Limits": {
    title: "Nutzung & Limits",
    description: "Kontingente, Tokenverbrauch und Schutzlimits je Provider sichtbar machen.",
    items: ["Token-Limits", "Anfrage-Limits", "Dokument-Limits", "Warnschwellen"]
  },
  "Allgemeine Einstellungen": {
    title: "Allgemeine Einstellungen",
    description: "Globale KI-Vorgaben ohne neue Suche oder zweite KI-Oberflaeche verwalten.",
    items: ["Standard-Provider", "Sprache", "Antwortton", "Datenschutz-Hinweise"]
  }
} as const

const providers = [
  { id: "openai", title: "OpenAI / ChatGPT", model: "GPT-4o", status: "Verbunden", icon: Sparkles, baseUrl: "https://api.openai.com/v1", color: "green" },
  { id: "anthropic", title: "Anthropic Claude", model: "Claude 3.5 Sonnet", status: "Verbunden", icon: BrainCircuit, baseUrl: "https://api.anthropic.com", color: "sand" },
  { id: "gemini", title: "Google Gemini", model: "Gemini 1.5 Pro", status: "Verbunden", icon: Sparkles, baseUrl: "https://generativelanguage.googleapis.com", color: "blue" },
  { id: "copilot", title: "Microsoft Copilot", model: "GPT-4 via Copilot", status: "Verbunden", icon: CheckCircle2, baseUrl: "https://copilot.microsoft.com", color: "multi" },
  { id: "openrouter", title: "OpenRouter", model: "Mehrere Modelle", status: "Verbunden", icon: Globe2, baseUrl: "https://openrouter.ai/api/v1", color: "navy" },
  { id: "ollama", title: "Ollama lokal", model: "Llama 3 70B", status: "Bereit", icon: Laptop, baseUrl: "http://localhost:11434", color: "slate" },
  { id: "custom", title: "Eigener Anbieter", model: "API Key", status: "Nicht verbunden", icon: PlugZap, baseUrl: "https://api.example.invalid/v1", color: "ink" }
]

const featureFlags = [
  ["Chat", Bot],
  ["Dokumente analysieren", Database],
  ["E-Mails verarbeiten", Mail],
  ["Bilder analysieren", Image],
  ["Websuche erlauben", Globe2],
  ["Code Interpreter", Code2]
] as const

function ProviderLogo({ tone, large = false }: { tone: string; large?: boolean }) {
  return <span className={large ? styles.providerLogoLarge : styles.providerLogo} data-provider={tone} aria-hidden="true"><span /></span>
}

export function AiAssistantSettingsClient() {
  const [activeTab, setActiveTab] = useState(settingsTabs[0])
  const [activeProviderId, setActiveProviderId] = useState("openai")
  const [enabled, setEnabled] = useState(true)
  const [testNotice, setTestNotice] = useState("")
  const activeProvider = useMemo(() => providers.find((provider) => provider.id === activeProviderId) || providers[0], [activeProviderId])
  const activePanel = activeTab === "Provider & Verbindungen" ? null : settingsTabPanels[activeTab as keyof typeof settingsTabPanels]

  return (
    <main className={styles.settingsPage}>
      <section className={styles.settingsHero}>
        <div>
          <Link className={styles.backCircle} href="/dashboard-v2/ai-assistant" aria-label="Zurueck zum KI-Assistenten"><ArrowLeft size={18} /></Link>
          <span className={styles.aiMark}><Sparkles size={19} /></span>
          <div>
            <h1>KI-Einstellungen</h1>
            <p>Verwalten Sie Ihre KI-Provider, Modelle und Verbindungen.</p>
          </div>
        </div>
        <Link href="/dashboard-v2/ai-assistant" className={styles.secondaryAction}>Zum KI-Assistenten</Link>
      </section>

      <nav className={styles.settingsTabs} aria-label="KI-Einstellungen Bereiche">
        {settingsTabs.map((tab) => <button key={tab} type="button" className={activeTab === tab ? styles.settingsTabActive : styles.settingsTab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </nav>

      {activeTab === "Provider & Verbindungen" ? <section className={styles.settingsLayout}>
        <aside className={styles.providerManager}>
          <div className={styles.managerHeader}>
            <div>
              <h2>KI-Provider verwalten</h2>
              <p>Verbinden und konfigurieren Sie Ihre KI-Anbieter.</p>
            </div>
            <button type="button" className={styles.outlineAction}>+ Provider hinzufuegen</button>
          </div>
          <div className={styles.providerManagerList}>
            {providers.map((provider) => {
              const Icon = provider.icon
              return (
                <button type="button" key={provider.id} className={provider.id === activeProviderId ? styles.managerProviderActive : styles.managerProvider} onClick={() => setActiveProviderId(provider.id)}>
                  <ProviderLogo tone={provider.color} />
                  <div><strong>{provider.title}</strong><small>{provider.model}</small></div>
                  <span className={provider.status === "Verbunden" ? styles.dotConnected : provider.status === "Bereit" ? styles.dotReady : styles.dotIdle}>{provider.status}</span>
                  <Settings size={16} />
                </button>
              )
            })}
          </div>
        </aside>

        <section className={styles.providerDetails}>
          <header className={styles.providerDetailHeader}>
            <ProviderLogo tone={activeProvider.color} large />
            <div>
              <h2>{activeProvider.title}</h2>
              <p>Modell: {activeProvider.model}</p>
            </div>
            <span className={activeProvider.status === "Verbunden" ? styles.connectedBadge : styles.readyBadge}>{activeProvider.status}</span>
            <button type="button" className={styles.iconButton} aria-label="Provider bearbeiten"><MoreHorizontal size={18} /></button>
          </header>


          <div className={styles.detailGrid}>
            <section className={styles.detailCard}>
              <h3>Verbindungsdaten</h3>
              <label>API Key<div className={styles.maskedInput}><input type="password" value="placeholder-secret" readOnly aria-label="Maskierter API Key" /><Copy size={16} /></div></label>
              <label>Organisation (optional)<input value="org-xxxxxxxxxxxx" readOnly /></label>
              <label>Base URL<input value={activeProvider.baseUrl} readOnly /></label>
              <label>Modell<input value={activeProvider.model} readOnly /></label>
              <div className={styles.inlineFields}>
                <label>Temperatur<input value="0.4" readOnly /></label>
                <label>Max Tokens<input value="1200" readOnly /></label>
              </div>
              <div className={styles.statusLine}><span>Status</span><strong>{enabled ? "Aktiv" : "Inaktiv"}</strong></div>
              <div className={styles.detailActions}>
                <button type="button" className={styles.secondaryAction} onClick={() => setTestNotice("Verbindungstest vorbereitet. Backend-Integration kann spaeter angebunden werden.")}><TestTube2 size={16} /> Verbindung testen</button>
                <button type="button" className={styles.primaryAction}><Save size={16} /> Speichern</button>
              </div>
              {testNotice ? <p className={styles.notice}>{testNotice}</p> : null}
            </section>

            <section className={styles.detailCard}>
              <h3>Verwendung & Limits</h3>
              {[ ["Token verwendet", "128.450 / 500.000", "26%"], ["Anfragen", "240 / 1.000", "24%"], ["Dokumente analysiert", "18 / 100", "18%"] ].map(([label, value, percent]) => (
                <div className={styles.usageRow} key={label}>
                  <div><span>{label}</span><strong>{value}</strong><small>{percent}</small></div>
                  <div><span style={{ width: percent }} /></div>
                </div>
              ))}
              <button type="button" className={enabled ? styles.toggleOn : styles.toggleOff} onClick={() => setEnabled((current) => !current)}>{enabled ? "Aktiv" : "Inaktiv"}</button>
            </section>

            <section className={styles.detailCard}>
              <h3>Funktionen</h3>
              <div className={styles.featureToggles}>
                {featureFlags.map(([label, Icon]) => <label key={label}><span><Icon size={15} /> {label}</span><input type="checkbox" defaultChecked /></label>)}
              </div>
            </section>
          </div>
        </section>
      </section> : activePanel ? (
        <section className={styles.settingsTabPanel}>
          <header>
            <span className={styles.aiMark}><Settings size={18} /></span>
            <div>
              <h2>{activePanel.title}</h2>
              <p>{activePanel.description}</p>
            </div>
          </header>
          <div className={styles.settingsPanelGrid}>
            {activePanel.items.map((item) => (
              <article key={item} className={styles.settingsPanelCard}>
                <strong>{item}</strong>
                <p>UI vorbereitet. Backend-Anbindung kann spaeter zentral ergaenzt werden.</p>
                <button type="button" className={styles.secondaryAction}>Bearbeiten</button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
