"use client"

import { useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import {
  Archive,
  Brain,
  CheckCircle2,
  Cloud,
  CreditCard,
  FileText,
  Landmark,
  Mail,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Store,
  TestTube2,
  Webhook,
  type LucideIcon
} from "lucide-react"
import {
  canConfigureIntegration,
  canSyncIntegration,
  getAvailableIntegrations,
  getConnectedIntegrations,
  getInstalledIntegrations,
  getIntegrationByKey,
  getIntegrationsByCategory,
  getIntegrationMarketplaceStatus
} from "@/lib/integrations/integrationEngine"
import {
  configureIntegration,
  connectIntegration,
  getMarketplaceStateSnapshot,
  installMarketplaceModule,
  setIntegrationError,
  syncIntegration,
  type MarketplaceState
} from "@/lib/marketplace/marketplaceState"
import type { IntegrationCategory, IntegrationContext, IntegrationDefinition, IntegrationLogEvent, IntegrationMarketplaceStatus } from "@/lib/integrations/types"
import type { ModuleEngineContext } from "@/lib/modules/moduleEngine"
import styles from "../DashboardV2.module.css"

const categories: Array<"Alle" | IntegrationCategory> = ["Alle", "Finanzen", "Commerce", "Cloud", "Kommunikation", "KI"]

const iconMap: Record<string, LucideIcon> = {
  archive: Archive,
  brain: Brain,
  cloud: Cloud,
  "credit-card": CreditCard,
  "file-text": FileText,
  landmark: Landmark,
  mail: Mail,
  "message-circle": MessageCircle,
  "message-square": MessageCircle,
  "messages-square": MessageCircle,
  package: Package,
  "shopping-cart": ShoppingCart,
  store: Store,
  webhook: Webhook
}

const gridStyle: CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))"
}

const cardStyle: CSSProperties = {
  display: "grid",
  gap: 12,
  alignContent: "space-between",
  minHeight: 250
}

const badgeStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.35)",
  borderRadius: 999,
  padding: "4px 9px",
  fontSize: 12,
  fontWeight: 800,
  width: "fit-content"
}

const fieldGridStyle: CSSProperties = {
  display: "grid",
  gap: 10,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))"
}

function statusLabel(status: IntegrationMarketplaceStatus) {
  const labels: Record<IntegrationMarketplaceStatus, string> = {
    locked: "Gesperrt",
    available: "Verfuegbar",
    installed: "Installiert",
    configured: "Konfiguriert",
    connected: "Verbunden",
    error: "Fehler"
  }
  return labels[status]
}

function buildIntegrationContext(moduleContext: ModuleEngineContext, marketplaceState: MarketplaceState): IntegrationContext {
  return {
    moduleContext: {
      ...moduleContext,
      installedExtensions: Array.from(new Set([...moduleContext.installedExtensions, ...marketplaceState.installedExtensions]))
    },
    installedIntegrations: marketplaceState.installedIntegrations,
    configuredIntegrations: marketplaceState.configuredIntegrations,
    connectedIntegrations: marketplaceState.connectedIntegrations,
    errorIntegrations: marketplaceState.integrationErrors,
    lastSyncByKey: marketplaceState.lastSyncByKey
  }
}

function authFields(authType: IntegrationDefinition["authType"]) {
  if (authType === "oauth") return ["Client Label", "Redirect URI"]
  if (authType === "api_key") return ["API Key Label", "Scope"]
  if (authType === "basic") return ["Benutzer", "Server URL"]
  if (authType === "token") return ["Token Label", "Webhook URL"]
  return ["Interner Modus"]
}

export function IntegrationCenter({ moduleContext, mode, searchQuery }: { moduleContext: ModuleEngineContext; mode: "dark" | "light"; searchQuery: string }) {
  const [query, setQuery] = useState(searchQuery)
  const [activeCategory, setActiveCategory] = useState<"Alle" | IntegrationCategory>("Alle")
  const [marketplaceState, setMarketplaceState] = useState<MarketplaceState>(() => getMarketplaceStateSnapshot())
  const [message, setMessage] = useState("")
  const integrationContext = useMemo(() => buildIntegrationContext(moduleContext, marketplaceState), [moduleContext, marketplaceState])
  const availableIntegrations = useMemo(() => getAvailableIntegrations(integrationContext), [integrationContext])
  const selectedFromQuery = getIntegrationByKey(query.trim())
  const selectedIntegration = selectedFromQuery ?? null
  const normalizedQuery = query.trim().toLowerCase()
  const filteredIntegrations = availableIntegrations.filter((integration) => {
    const categoryMatches = activeCategory === "Alle" || integration.category === activeCategory
    const queryMatches = !normalizedQuery || [integration.key, integration.name, integration.description, integration.category].join(" ").toLowerCase().includes(normalizedQuery)
    return categoryMatches && queryMatches
  })
  const installedCount = getInstalledIntegrations(integrationContext).length
  const connectedCount = getConnectedIntegrations(integrationContext).length
  const errorCount = availableIntegrations.filter((integration) => getIntegrationMarketplaceStatus(integration.key, integrationContext).status === "error").length
  const lastSync = Object.values(integrationContext.lastSyncByKey ?? {})[0] ?? "Noch keine Synchronisation"

  async function runPrimaryAction(integration: IntegrationDefinition) {
    const { status } = getIntegrationMarketplaceStatus(integration.key, integrationContext)

    if (status === "available") {
      setMarketplaceState(installMarketplaceModule(integration.marketplaceModuleKey))
      setMessage(`${integration.name} wurde als Mock installiert.`)
      return
    }

    if (status === "installed") {
      setMarketplaceState(configureIntegration(integration.key))
      setMessage(`${integration.name} wurde lokal konfiguriert.`)
      return
    }

    if (status === "configured") {
      setMarketplaceState(connectIntegration(integration.key))
      setMessage(`${integration.name} wurde per Mock verbunden.`)
      return
    }

    if (status === "connected" && integration.syncSupported) {
      const { result, state } = syncIntegration(integration.key)
      setMarketplaceState(state)
      setMessage(result.message)
      return
    }

    if (status === "error") {
      setMarketplaceState(configureIntegration(integration.key))
      setMessage(`${integration.name} Fehler wurde als geprueft markiert.`)
      return
    }

    setMessage(`${integration.name} ist im aktuellen Plan nicht verfuegbar.`)
  }

  function IntegrationCard({ integration }: { integration: IntegrationDefinition }) {
    const Icon = iconMap[integration.iconKey] ?? Package
    const { status, button } = getIntegrationMarketplaceStatus(integration.key, integrationContext)
    const canConfigure = canConfigureIntegration(integration.key, integrationContext)
    const canSync = canSyncIntegration(integration.key, integrationContext)
    const lastIntegrationSync = integrationContext.lastSyncByKey?.[integration.key] ?? "Noch keine Synchronisation"

    return (
      <article className={`${styles.panel} ${styles.moduleCard}`} style={cardStyle}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <span className={styles.smallIcon}><Icon size={20} /></span>
          <span style={badgeStyle}>{statusLabel(status)}</span>
        </div>
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 18 }}>{integration.name}</h2>
          <p style={{ margin: 0, color: "var(--muted, #64748b)" }}>{integration.description}</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span style={badgeStyle}>{integration.category}</span>
          <span style={badgeStyle}>Marketplace: {statusLabel(status)}</span>
          <span style={badgeStyle}>{integration.authType}</span>
          <span style={badgeStyle}>{lastIntegrationSync}</span>
          {integration.webhookSupported ? <span style={badgeStyle}>Webhooks</span> : null}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void runPrimaryAction(integration)}>
            {button}
          </button>
          <Link href={`/dashboard-v2/integrations/${integration.key}?theme=${mode}`}>Details</Link>
          {canConfigure ? <button type="button" onClick={() => setQuery(integration.key)}>Konfiguration</button> : null}
          {canSync ? <button type="button" onClick={() => void runPrimaryAction(integration)}>Sync</button> : null}
        </div>
      </article>
    )
  }

  function DetailPanel({ integration }: { integration: IntegrationDefinition }) {
    const { status, button } = getIntegrationMarketplaceStatus(integration.key, integrationContext)
    const logs = marketplaceState.auditLogs.filter((log) => log.integrationKey === integration.key || log.integrationKey === integration.marketplaceModuleKey)
    const lastIntegrationSync = integrationContext.lastSyncByKey?.[integration.key] ?? "Noch keine Synchronisation"

    return (
      <article className={`${styles.panel} ${styles.moduleCard}`} style={{ display: "grid", gap: 16 }}>
        <div className={styles.panelHead}>
          <div>
            <h2>{integration.name}</h2>
            <span>{statusLabel(status)} · {integration.authType} · Letzte Synchronisation: {lastIntegrationSync}</span>
          </div>
          <Link href={`/dashboard-v2/integrations/${integration.key}?theme=${mode}`}>Detailroute</Link>
        </div>

        {status === "locked" || status === "available" ? (
          <p data-state="warning">{status === "locked" ? "Diese Integration benoetigt ein Upgrade." : "Diese Integration ist verfuegbar und kann als Mock installiert werden."}</p>
        ) : (
          <div style={fieldGridStyle}>
            {authFields(integration.authType).map((field) => (
              <label key={field} style={{ display: "grid", gap: 6 }}>
                <span>{field}</span>
                <input readOnly value={integration.authType === "none" ? "Keine Authentifizierung erforderlich" : "Mock-Wert, kein Secret"} />
              </label>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void runPrimaryAction(integration)}>{button}</button>
          <button type="button" disabled={status === "locked" || status === "available"} onClick={() => setMessage(`${integration.name} Verbindungstest erfolgreich.`)}><TestTube2 size={16} />Verbindung testen</button>
          <button type="button" disabled={!canSyncIntegration(integration.key, integrationContext)} onClick={() => void runPrimaryAction(integration)}><RefreshCw size={16} />Synchronisieren</button>
          <button type="button" disabled={status === "locked" || status === "available"} onClick={() => setMarketplaceState(configureIntegration(integration.key))}><Settings size={16} />Einstellungen speichern</button>
          <button type="button" onClick={() => setMarketplaceState(setIntegrationError(integration.key))}><FileText size={16} />Fehler simulieren</button>
        </div>

        {integration.webhookSupported ? (
          <section>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Webhooks</h3>
            <p style={{ margin: 0 }}>Webhook-Endpoint ist vorbereitet. Es werden keine externen Events empfangen.</p>
          </section>
        ) : null}

        <section id="logs">
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Logs</h3>
          <div className={styles.pipelineList}>
            {(logs.length ? logs : [{ id: "empty", event: "integration_test_success", message: "Noch keine Logs geladen.", createdAt: "-", integrationKey: integration.key, level: "info" } satisfies IntegrationLogEvent]).map((log) => (
              <div key={log.id} className={styles.pipelineRow}>
                <span><strong>{log.event}</strong><small>{log.message}</small></span>
                <b>{log.level}</b>
                <em>{log.createdAt}</em>
              </div>
            ))}
          </div>
        </section>
      </article>
    )
  }

  return (
    <section className={styles.modulePage} data-view="integrations">
      <article className={`${styles.panel} ${styles.moduleHero}`}>
        <div>
          <span>Universal Integration Framework</span>
          <h1>Integrationen</h1>
          <p>Verbinden Sie externe Dienste mit DreamInvoice.</p>
        </div>
        <Link href="/dashboard-v2/license-billing?q=Marketplace"><CheckCircle2 size={18} />Marketplace</Link>
      </article>

      <section className={`${styles.panel} ${styles.moduleCard}`} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", flex: "1 1 260px" }}>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Integration suchen..." />
          </label>
          {categories.map((category) => (
            <button key={category} type="button" data-active={activeCategory === category ? "true" : undefined} onClick={() => setActiveCategory(category)}>
              {category}
            </button>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(0, 1fr) 280px" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {selectedIntegration ? <DetailPanel integration={selectedIntegration} /> : null}
          <div style={gridStyle}>
            {filteredIntegrations.map((integration) => <IntegrationCard key={integration.key} integration={integration} />)}
          </div>
        </div>

        <aside className={`${styles.panel} ${styles.moduleCard}`} style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div className={styles.panelHead}><h2>Status</h2><span>Mock Runtime</span></div>
          <div className={styles.focusList}>
            <span><span>Installiert</span><strong>{installedCount}</strong></span>
            <span><span>Verbunden</span><strong>{connectedCount}</strong></span>
            <span><span>Fehler</span><strong>{errorCount}</strong></span>
            <span><span>Letzte Synchronisation</span><strong>{lastSync}</strong></span>
          </div>
          <div>
            <h3 style={{ fontSize: 15, margin: "0 0 8px" }}>Kategorien</h3>
            <div style={{ display: "grid", gap: 6 }}>
              {categories.filter((category): category is IntegrationCategory => category !== "Alle").map((category) => (
                <span key={category} style={badgeStyle}>{category}: {getIntegrationsByCategory(category).length}</span>
              ))}
            </div>
          </div>
          {message ? <p data-state="success">{message}</p> : null}
        </aside>
      </section>
    </section>
  )
}
