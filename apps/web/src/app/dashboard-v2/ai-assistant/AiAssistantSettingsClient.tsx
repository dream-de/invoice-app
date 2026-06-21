"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import {
  ArrowLeft,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  FileText,
  Gauge,
  Globe2,
  Laptop,
  MessageSquareText,
  MoreVertical,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  WandSparkles
} from "lucide-react"
import styles from "./AiAssistantPremium.module.css"

const settingsTabs = [
  { id: "system", label: "KI-System", icon: MessageSquareText },
  { id: "mode", label: "KI-Modus", icon: Bot },
  { id: "models", label: "Modelle", icon: ClipboardList },
  { id: "usage", label: "Nutzung & Limits", icon: Gauge },
  { id: "security", label: "Sicherheit", icon: ShieldCheck },
  { id: "logs", label: "Logs", icon: FileText }
] as const

const aiModes = [
  { id: "standard", title: "Standard", text: "Schnell und effizient fuer taegliche Aufgaben.", badge: "Empfohlen" },
  { id: "premium", title: "Premium", text: "Hoechste Qualitaet mit mehreren leistungsstarken Modellen." },
  { id: "local", title: "Lokal (On-Premise)", text: "Maximale Datenschutzkontrolle mit lokaler KI." }
]

const providers = [
  { id: "openai", title: "OpenAI", model: "GPT-4o", status: "Verbunden", color: "green", icon: Sparkles },
  { id: "claude", title: "Claude", model: "Claude 3.7 Sonnet", status: "Verbunden", color: "sand", icon: BrainCircuit },
  { id: "gemini", title: "Gemini", model: "Gemini 1.5 Pro", status: "Verbunden", color: "blue", icon: Sparkles },
  { id: "openrouter", title: "OpenRouter", model: "Mehrere", status: "Verbunden", color: "navy", icon: Globe2 },
  { id: "ollama", title: "Ollama (Lokal)", model: "Llama 3.1 70B", status: "Nicht aktiv", color: "slate", icon: Laptop }
]

const systemStats = [
  ["Aktiver Modus", "Premium"],
  ["Gesamt-Tokens (Mai 2025)", "128.450 / 500.000"],
  ["Anfragen", "240 / 1.000"],
  ["Dokumente analysiert", "18 / 100"],
  ["Letzte Aktualisierung", "Heute, 09:30"]
]

const securityItems = [
  ["Ihre Daten bleiben geschuetzt", ShieldCheck],
  ["DSGVO konform", ShieldCheck],
  ["Keine Weitergabe an Dritte", Users],
  ["Verschluesselte Uebertragung", CheckCircle2]
] as const

function ProviderLogo({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={styles.providerLogo} data-provider={tone} aria-hidden="true">{children}</span>
}

export function AiAssistantSettingsClient() {
  const [activeTab, setActiveTab] = useState("system")
  const [activeMode, setActiveMode] = useState("standard")

  return (
    <main className={styles.settingsPage}>
      <section className={styles.settingsTop}>
        <div>
          <h1>Einstellungen</h1>
          <p>Verwalten Sie Ihr KI-System und passen Sie die Funktionen an Ihre Anforderungen an.</p>
        </div>
        <Link href="/dashboard-v2/ai-assistant" className={styles.backToAssistant}><ArrowLeft size={18} /> Zurueck zum KI-Assistenten</Link>
      </section>

      <nav className={styles.settingsNavCompact} aria-label="KI-Einstellungen Bereiche">
        {settingsTabs.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" className={activeTab === id ? styles.settingsNavActive : styles.settingsNavItem} onClick={() => setActiveTab(id)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <section className={styles.settingsPremiumGrid}>
        <div className={styles.settingsMainColumn}>
          <section className={styles.aiModeCard}>
            <h2>KI-Modus</h2>
            <p>Waehlen Sie den aktiven Modus fuer Ihr KI-System.</p>
            <div className={styles.modeCardGrid}>
              {aiModes.map((mode) => (
                <button key={mode.id} type="button" className={activeMode === mode.id ? styles.modeCardActive : styles.modeCard} onClick={() => setActiveMode(mode.id)}>
                  <span className={styles.radioDot} />
                  <strong>{mode.title}</strong>
                  <small>{mode.text}</small>
                  {mode.badge ? <em>{mode.badge}</em> : null}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.providerManageCard}>
            <header>
              <div>
                <h2>Provider verwalten</h2>
                <p>Hier koennen Sie KI-Provider verbinden und verwalten.</p>
              </div>
              <button type="button" aria-label="Provider hinzufuegen"><Plus size={20} /></button>
            </header>

            <div className={styles.providerTable}>
              {providers.map((provider) => {
                const Icon = provider.icon
                return (
                  <article key={provider.id} className={styles.providerTableRow}>
                    <ProviderLogo tone={provider.color}><Icon size={20} /></ProviderLogo>
                    <div>
                      <strong>{provider.title}</strong>
                      <small>Modell: {provider.model}</small>
                    </div>
                    <span className={provider.status === "Verbunden" ? styles.statusConnected : styles.statusIdle}>{provider.status}</span>
                    <button type="button" aria-label={provider.title + " oeffnen"} className={styles.rowChevron}><ChevronRight size={21} /></button>
                    <button type="button" aria-label={provider.title + " Aktionen"} className={styles.rowMenu}><MoreVertical size={20} /></button>
                  </article>
                )
              })}
            </div>
          </section>
        </div>

        <aside className={styles.settingsSideColumn}>
          <section className={styles.systemStatusCard}>
            <h2>Systemstatus</h2>
            <dl>
              <div><dt>Status</dt><dd><span>Alle Systeme aktiv</span></dd></div>
              {systemStats.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            <button type="button"><BarChart3 size={17} /> Nutzung & Limits anzeigen</button>
          </section>

          <section className={styles.aboutAiCard}>
            <h2>Ueber das KI-System</h2>
            <p>DreamInvoice KI verarbeitet Ihre Daten sicher und vertraulich. Je nach gewaehltem Modus verwenden wir verschiedene leistungsstarke Modelle, um Ihnen die bestmoeglichen Ergebnisse zu liefern.</p>
            <ul>
              {securityItems.map(([label, Icon]) => <li key={label}><Icon size={17} /> {label}</li>)}
            </ul>
            <Link href="/dashboard-v2/ai-assistant/settings?tab=security">Mehr erfahren <WandSparkles size={16} /></Link>
          </section>
        </aside>
      </section>
    </main>
  )
}
