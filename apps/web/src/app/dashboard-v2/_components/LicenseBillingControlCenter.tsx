"use client"

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  BarChart3,
  Box,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock,
  Cloud,
  Code2,
  CreditCard,
  Download,
  FileClock,
  FileText,
  FolderOpen,
  History,
  KeyRound,
  Layers3,
  Landmark,
  Mail,
  PackageCheck,
  Package,
  RefreshCw,
  Receipt,
  Search,
  Server,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  SlidersHorizontal,
  Store,
  Upload,
  Users,
  Webhook,
  Zap,
  type LucideIcon
} from "lucide-react"
import { defaultFeatureFlags } from "@/lib/modules/featureFlags"
import { getLockedModules, getMarketplaceModules, getVisibleModules, type ModuleEngineContext } from "@/lib/modules/moduleEngine"
import { businessDatevModuleContext } from "@/lib/modules/mockLicenseContext"
import type { AppModule, ModulePlan, ModuleStatus } from "@/lib/modules/appRegistry"
import { getMarketplaceStateSnapshot, installMarketplaceModule, uninstallMarketplaceModule, type MarketplaceState } from "@/lib/marketplace/marketplaceState"
import styles from "./LicenseBillingControlCenter.module.css"

const planLabels = ["Free", "Business", "Enterprise"] as const

type PlanLabel = (typeof planLabels)[number]

const planToModulePlan: Record<PlanLabel, ModulePlan> = {
  Free: "free",
  Business: "business",
  Enterprise: "enterprise"
}

const marketplaceUiMeta: Record<string, { category: string; price: string; features: string[]; icon: LucideIcon }> = {
  open_banking: { category: "Finanzen", price: "19,90 EUR / Monat", features: ["PSD2", "Live Sync", "Zahlungsabgleich", "Bankregeln"], icon: Landmark },
  datev: { category: "Finanzen", price: "19,90 EUR / Monat", features: ["DATEV Export", "Buchungsdaten", "Steuerberater"], icon: FileText },
  ocr: { category: "KI", price: "14,90 EUR / Monat", features: ["Belegerkennung", "Dokumenten-OCR", "Automatische Felder"], icon: Brain },
  warehouse: { category: "ERP", price: "24,90 EUR / Monat", features: ["Bestand", "Lagerorte", "Artikelbewegung"], icon: Package },
  shopify: { category: "Commerce", price: "19,90 EUR / Monat", features: ["Bestellungen", "Produkte", "Kunden Sync"], icon: Store },
  woocommerce: { category: "Commerce", price: "19,90 EUR / Monat", features: ["Bestellungen", "Produkte", "Rechnungen"], icon: Store },
  nextcloud: { category: "Cloud", price: "9,90 EUR / Monat", features: ["Dateien", "Dokumente", "Sync"], icon: Cloud },
  paperless_ngx: { category: "Cloud", price: "12,90 EUR / Monat", features: ["Archiv", "Dokumente", "Tags"], icon: FolderOpen },
  google_drive: { category: "Cloud", price: "9,90 EUR / Monat", features: ["Dateien", "Dokumente", "Export"], icon: Cloud },
  openai: { category: "KI", price: "29,90 EUR / Monat", features: ["KI-Assistent", "Textanalyse", "Automationen"], icon: Brain },
  whatsapp: { category: "Kommunikation", price: "9,90 EUR / Monat", features: ["Nachrichten", "Kundenkommunikation"], icon: Mail },
  slack: { category: "Kommunikation", price: "9,90 EUR / Monat", features: ["Benachrichtigungen", "Workflows"], icon: Webhook },
  microsoft_teams: { category: "Kommunikation", price: "9,90 EUR / Monat", features: ["Freigaben", "Benachrichtigungen"], icon: Webhook },
  amazon: { category: "Commerce", price: "24,90 EUR / Monat", features: ["Bestellungen", "Produkte", "Rechnungen"], icon: Store },
  ebay: { category: "Commerce", price: "19,90 EUR / Monat", features: ["Bestellungen", "Artikel", "Kunden Sync"], icon: Store }
}

const overviewMarketplaceKeys = ["open_banking", "datev", "ocr", "warehouse", "shopify", "woocommerce", "nextcloud", "paperless_ngx", "openai", "whatsapp", "slack", "amazon", "ebay"]

const invoices = [
  { no: "RE-2026-0008", date: "26.06.2026", amount: "99,00 EUR", status: "Bezahlt" },
  { no: "RE-2026-0007", date: "26.05.2026", amount: "99,00 EUR", status: "Bezahlt" },
  { no: "RE-2026-0006", date: "26.04.2026", amount: "99,00 EUR", status: "Bezahlt" }
]

const history = [
  { date: "26.06.2026", title: "Business Plan verlaengert", meta: "Automatische Verlangerung aktiv" },
  { date: "18.06.2026", title: "DATEV installiert", meta: "Marketplace Erweiterung aktiviert" },
  { date: "01.06.2026", title: "API Limit aktualisiert", meta: "100.000 Requests pro Monat" }
]

const tabs: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Übersicht", icon: BarChart3 },
  { id: "plan", label: "Plan", icon: BadgeCheck },
  { id: "marketplace", label: "Marketplace", icon: ShoppingCart },
  { id: "modules", label: "Erweiterungen", icon: PackageCheck },
  { id: "invoices", label: "Rechnungen", icon: FileText },
  { id: "payments", label: "Zahlungen", icon: CreditCard },
  { id: "api", label: "API", icon: Zap },
  { id: "history", label: "Historie", icon: FileClock },
  { id: "activation", label: "Aktivierung", icon: KeyRound },
  { id: "settings", label: "Einstellungen", icon: Server }
]

type MarketplaceModuleCard = AppModule & { status: ModuleStatus }
type MarketplaceDisplayCard = ReturnType<typeof marketplaceCard>

function marketplaceStatusLabel(status: ModuleStatus, moduleKey: string, marketplaceState: MarketplaceState) {
  if (marketplaceState.integrationErrors.includes(moduleKey)) return "Fehler"
  if (status === "installed") return "Installiert"
  if (status === "available") return "Verfuegbar"
  if (status === "beta") return "Beta"
  if (status === "locked") return "Upgrade"
  return "Verfuegbar"
}

function marketplaceCard(module: MarketplaceModuleCard, marketplaceState: MarketplaceState) {
  const meta = marketplaceUiMeta[module.key] ?? { category: "Marketplace", price: "Auf Anfrage", features: [module.description], icon: Package }

  return {
    ...module,
    categoryLabel: meta.category,
    price: meta.price,
    features: meta.features,
    icon: meta.icon,
    statusLabel: marketplaceStatusLabel(module.status, module.key, marketplaceState)
  }
}

export function LicenseBillingControlCenter({ moduleContext }: { moduleContext?: ModuleEngineContext }) {
  const [plan, setPlan] = useState<PlanLabel>("Enterprise")
  const [activeTab, setActiveTab] = useState("overview")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Alle")
  const [marketSearch, setMarketSearch] = useState("")
  const [marketplaceState, setMarketplaceState] = useState<MarketplaceState>(() => getMarketplaceStateSnapshot())

  const moduleEngineContext = useMemo<ModuleEngineContext>(() => {
    const baseContext = moduleContext ?? businessDatevModuleContext

    return {
      ...baseContext,
      plan: planToModulePlan[plan],
      installedExtensions: Array.from(new Set([...baseContext.installedExtensions, ...marketplaceState.installedExtensions])),
      featureFlags: {
        ...defaultFeatureFlags,
        ...baseContext.featureFlags
      }
    }
  }, [marketplaceState.installedExtensions, moduleContext, plan])

  const engineVisibleModules = useMemo(() => getVisibleModules(moduleEngineContext), [moduleEngineContext])
  const engineLockedModules = useMemo(() => getLockedModules(moduleEngineContext), [moduleEngineContext])
  const engineMarketplaceModules = useMemo(() => getMarketplaceModules(moduleEngineContext).map((module) => marketplaceCard(module, marketplaceState)), [marketplaceState, moduleEngineContext])
  const installedMarketplaceModules = useMemo(() => engineMarketplaceModules.filter((module) => module.status === "installed"), [engineMarketplaceModules])
  const overviewMarketplaceModules = useMemo<MarketplaceDisplayCard[]>(() => {
    return overviewMarketplaceKeys.map((key) => {
      const existing = engineMarketplaceModules.find((module) => module.key === key)
      if (existing) return existing
      const meta = marketplaceUiMeta[key]

      return {
        key,
        name: key === "paperless_ngx" ? "Paperless-ngx" : key === "open_banking" ? "Open Banking" : key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        description: meta.features.join(", "),
        category: meta.category,
        iconKey: key,
        route: `/dashboard-v2/integrations/${key}`,
        requiredPlan: "business",
        marketplace: true,
        featureFlag: undefined,
        installedByDefault: false,
        visibleInSidebar: false,
        visibleInDashboard: false,
        visibleInSearch: true,
        status: "available",
        categoryLabel: meta.category,
        price: meta.price,
        features: meta.features,
        icon: meta.icon,
        statusLabel: "Verfuegbar"
      } as MarketplaceDisplayCard
    })
  }, [engineMarketplaceModules])
  const marketplaceCategories = useMemo(() => ["Alle", ...Array.from(new Set(overviewMarketplaceModules.map((module) => module.categoryLabel)))], [overviewMarketplaceModules])

  const filteredMarketplaceApps = useMemo(() => {
    const query = marketSearch.trim().toLowerCase()
    return overviewMarketplaceModules.filter((app) => {
      const matchesCategory = activeCategory === "Alle" || app.categoryLabel === activeCategory
      const matchesSearch = !query || [app.name, app.categoryLabel, app.description, ...app.features].join(" ").toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, overviewMarketplaceModules, marketSearch])

  function shouldShow(...names: string[]) {
    return activeTab !== "overview" && names.includes(activeTab)
  }

  function installModule(moduleKey: string) {
    setMarketplaceState(installMarketplaceModule(moduleKey))
  }

  function uninstallModule(moduleKey: string) {
    setMarketplaceState(uninstallMarketplaceModule(moduleKey))
  }

  return (
    <div className={styles.licensePage} data-engine-visible-modules={engineVisibleModules.length} data-engine-marketplace-modules={engineMarketplaceModules.length} data-engine-locked-modules={engineLockedModules.length}>
      <div className={styles.licenseHeader}>
        <div>
          <h1>Lizenz & Abrechnung</h1>
          <p>Plan, Erweiterungen, Marketplace und Abrechnung an einem Ort.</p>
        </div>

        <div className={styles.licenseHeaderActions}>
          <button className={`${styles.lbBtn} ${styles.secondary}`} type="button">
            <RefreshCw size={16} />
            Lizenz synchronisieren
          </button>
          <button className={`${styles.lbBtn} ${styles.primary}`} type="button">
            <ShoppingCart size={16} />
            Marketplace öffnen
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <>
      <div className={styles.statusStrip}>
        <StatusCard icon={BadgeCheck} label="Plan" value={plan} meta="Aktiv" />
        <StatusCard icon={Users} label="Benutzer" value="12 / 20" meta="8 frei" />
        <StatusCard icon={PackageCheck} label="Gekaufte Erweiterungen" value={String(installedMarketplaceModules.length)} meta="installiert" />
        <StatusCard icon={Zap} label="API Nutzung" value="45%" meta="45.223 Requests" />
        <StatusCard icon={CalendarDays} label="Nächste Zahlung" value="26.07.2026" meta="99,00 EUR" />
        <StatusCard icon={ShieldCheck} label="Lizenzstatus" value="Aktiv" meta="gültig" />
      </div>

      <section className={styles.modernSection}>
        <div className={styles.modernSectionHead}>
          <div>
            <h2>Plan</h2>
            <p>Aktueller Vertrag, Laufzeit und Benutzerlimit.</p>
          </div>
        </div>

        <div className={styles.planControl}>
          <div className={styles.planCardMain}>
            <div className={styles.planIconLarge}>
              <BadgeCheck size={34} />
            </div>
            <div>
              <h3>DreamInvoice {plan}</h3>
              <span className={`${styles.modernBadge} ${styles.green}`}>Aktiv</span>
              <p>Aktiver SaaS-Plan für Workspace Acme GmbH.</p>
            </div>
          </div>

          <div className={styles.planMeta}>
            <div><span>Verlängerung</span><strong>26.07.2026</strong></div>
            <div><span>Workspace</span><strong>Acme GmbH</strong></div>
            <div><span>Preis</span><strong>99,00 EUR / Monat</strong></div>
            <div><span>Benutzerlimit</span><strong>20 Benutzer</strong></div>
          </div>
        </div>
      </section>

      <section className={styles.modernSection}>
        <div className={styles.modernSectionHead}>
          <div>
            <h2>Gekaufte Erweiterungen</h2>
            <p>Zusätzlich installierte Marketplace-Erweiterungen.</p>
          </div>
        </div>

        {installedMarketplaceModules.length ? (
          <div className={styles.extensionListCompact}>
            {installedMarketplaceModules.map((item) => {
              const Icon = item.icon
              return (
                <div className={styles.extensionCompactCard} key={item.key}>
                  <div className={styles.smallIcon}><Icon size={18} /></div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.categoryLabel} · Version 1.0.0</span>
                  </div>
                  <em>Installiert</em>
                </div>
              )
            })}
          </div>
        ) : (
          <p className={styles.emptyState}>Noch keine Erweiterungen gekauft.</p>
        )}
      </section>

      <section className={styles.modernSection}>
        <div className={`${styles.modernSectionHead} ${styles.marketplaceHead}`}>
          <div>
            <h2>Marketplace</h2>
            <p>Verfügbare Erweiterungen für Ihr Workspace.</p>
          </div>

          <div className={styles.marketTools}>
            <label className={styles.marketSearch}>
              <Search size={16} />
              <input value={marketSearch} onChange={(event) => setMarketSearch(event.target.value)} placeholder="Erweiterung suchen..." />
            </label>
            <button className={styles.lbBtn} type="button">
              <SlidersHorizontal size={16} />
              Filter
            </button>
          </div>
        </div>

        <div className={styles.categoryTabs}>
          {marketplaceCategories.map((category) => (
            <button key={category} className={activeCategory === category ? styles.active : ""} onClick={() => setActiveCategory(category)} type="button">
              {category}
            </button>
          ))}
        </div>

        <div className={`${styles.modernMarketplaceGrid} ${styles.compactMarketplaceGrid}`}>
          {filteredMarketplaceApps.map((app) => {
            const Icon = app.icon
            return (
              <div className={styles.modernMarketplaceCard} key={app.name}>
                <div className={styles.marketCardTop}>
                  <div className={styles.appIcon}><Icon size={24} /></div>
                  <span className={`${styles.modernBadge} ${marketplaceStatusClass(app.statusLabel)}`}>{app.statusLabel}</span>
                </div>
                <h3>{app.name}</h3>
                <p>{app.categoryLabel}</p>
                <ul>
                  {app.features.map((feature) => (
                    <li key={feature}><CheckCircle2 size={14} />{feature}</li>
                  ))}
                </ul>
                <strong className={styles.price}>{app.price}</strong>
                <button className={app.statusLabel === "Installiert" ? styles.installedBtn : styles.installBtn} type="button" onClick={() => app.statusLabel === "Verfuegbar" || app.statusLabel === "Beta" ? installModule(app.key) : undefined}>
                  {app.statusLabel === "Installiert" ? "Installiert" : app.statusLabel === "Upgrade" ? "Upgrade" : app.statusLabel === "Fehler" ? "Fehler prüfen" : "Verfügbar"}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.modernSection}>
        <div className={styles.modernSectionHead}>
          <div>
            <h2>Abrechnung</h2>
            <p>Rechnungen, Zahlungsmethode und nächste Zahlung.</p>
          </div>
        </div>

        <div className={styles.billingOverviewGrid}>
          <div className={styles.billingOverviewCard}>
            <h3>Letzte Rechnungen</h3>
            {invoices.slice(0, 2).map((invoice) => (
              <div className={styles.billingMiniRow} key={invoice.no}>
                <span>{invoice.no}</span>
                <strong>{invoice.amount}</strong>
                <em>{invoice.status}</em>
              </div>
            ))}
          </div>
          <SystemBox icon={CreditCard} title="Zahlungsmethode" value="Mastercard •••• 4242" meta="Standard" />
          <SystemBox icon={CalendarDays} title="Nächste Zahlung" value="26.07.2026" meta="99,00 EUR / Monat" />
        </div>
      </section>

      <section className={`${styles.modernSection} ${styles.systemSection}`}>
        <div className={styles.modernSectionHead}>
          <div>
            <h2>Systemstatus</h2>
            <p>Kompakter Status für Lizenz, API und Integrität.</p>
          </div>
        </div>

        <div className={styles.systemInnerGrid}>
          <SystemBox icon={ShieldCheck} title="Lizenzserver" value="Online" meta="Erreichbar" />
          <SystemBox icon={Zap} title="API" value="45%" meta="45.223 Requests" />
          <SystemBox icon={Server} title="Letzter Sync" value="08:45" meta="26.06.2026" />
          <SystemBox icon={BadgeCheck} title="Integrität" value="Gültig" meta="Signatur geprüft" />
        </div>
      </section>
        </>
      ) : null}

      <div className={styles.licenseTabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <button key={tab.id} className={activeTab === tab.id ? styles.active : ""} onClick={() => setActiveTab(tab.id)} type="button">
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab !== "overview" ? (
      <div className={`${styles.licenseGrid} ${styles.singleMode}`}>
        {shouldShow("plan") ? (
          <section className={`${styles.lbCard} ${styles.planCard}`}>
            <div className={styles.cardTitle}>
              <BadgeCheck size={22} />
              <h2>Aktueller Plan</h2>
            </div>

            <div className={styles.planBox}>
              <div className={styles.planIcon}>
                <Sparkles size={28} />
              </div>

              <div>
                <h3>DreamInvoice {plan}</h3>
                <span className={styles.greenBadge}>Aktiv</span>
                <p>Ihr aktueller Plan steuert die sichtbaren Basismodule der Oberflaeche.</p>
              </div>
            </div>

            <div className={styles.planSwitch}>
              {planLabels.map((item) => (
                <button key={item} className={plan === item ? styles.active : ""} onClick={() => setPlan(item)} type="button">
                  {item}
                </button>
              ))}
            </div>

            <div className={styles.planStats}>
              <div><span>Verlaengerung</span><strong>26.07.2026</strong></div>
              <div><span>Benutzer</span><strong>12 / 20</strong></div>
              <div><span>Aktive Module</span><strong>{engineVisibleModules.length}</strong></div>
              <div><span>Workspace</span><strong>Acme GmbH</strong></div>
            </div>
          </section>
        ) : null}

        {shouldShow("marketplace") ? (
          <section className={`${styles.lbCard} ${styles.marketplaceCard}`}>
            <div className={`${styles.cardTitle} ${styles.between}`}>
              <div>
                <ShoppingCart size={22} />
                <h2>Marketplace</h2>
              </div>
              <button className={styles.textBtn} type="button">Alle Module entdecken</button>
            </div>

            <div className={styles.marketGrid}>
              {engineMarketplaceModules.map((item) => (
                <div className={styles.marketItem} key={item.name}>
                  <div className={styles.marketIcon}>
                    <Box size={22} />
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <ul>
                    {item.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <strong>{item.price}</strong>
                  <small>{item.categoryLabel}</small>
                  <button className={item.statusLabel === "Installiert" ? styles.installed : ""} type="button" onClick={() => item.statusLabel === "Verfuegbar" || item.statusLabel === "Beta" ? installModule(item.key) : undefined}>
                    {item.statusLabel === "Installiert" ? "Installiert" : item.statusLabel === "Upgrade" ? "Upgrade" : item.statusLabel === "Fehler" ? "Fehler prüfen" : "Installieren"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {shouldShow("modules") ? (
          <section className={`${styles.lbCard} ${styles.installedCard}`}>
            <div className={styles.cardTitle}>
              <PackageCheck size={22} />
              <h2>Installierte Erweiterungen</h2>
            </div>

            {installedMarketplaceModules.length ? installedMarketplaceModules.map((item) => (
              <div className={styles.installedRow} key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.categoryLabel} · Version 1.0.0</span>
                </div>
                <em>{item.statusLabel === "Fehler" ? "Fehler" : "Installiert"}</em>
                <button type="button" onClick={() => installModule(item.key)}>Konfigurieren</button>
                <button type="button" onClick={() => uninstallModule(item.key)}>Deinstallieren</button>
              </div>
            )) : <p>Noch keine Erweiterungen installiert.</p>}
          </section>
        ) : null}

        {shouldShow("invoices") ? (
          <section className={`${styles.lbCard} ${styles.invoicesCard}`}>
            <div className={styles.cardTitle}>
              <FileText size={22} />
              <h2>Letzte Rechnungen</h2>
            </div>

            {invoices.map((invoice) => (
              <div className={styles.invoiceRow} key={invoice.no}>
                <div>
                  <strong>{invoice.no}</strong>
                  <span>{invoice.date}</span>
                </div>
                <b>{invoice.amount}</b>
                <em>{invoice.status}</em>
                <button type="button" aria-label={`${invoice.no} herunterladen`}>
                  <Download size={16} />
                </button>
              </div>
            ))}
          </section>
        ) : null}

        {shouldShow("api") ? (
          <section className={`${styles.lbCard} ${styles.apiCard}`}>
            <div className={styles.cardTitle}>
              <Zap size={22} />
              <h2>API Nutzung</h2>
            </div>

            <div className={styles.apiGauge}>
              <strong>45.223</strong>
              <span>von 100.000 Requests</span>
            </div>

            <div className={styles.usageBar}>
              <span style={{ width: "45%" }} />
            </div>

            <div className={styles.usageMeta}>
              <span>Verbraucht: 45%</span>
              <span>Reset: 01.07.2026</span>
            </div>
          </section>
        ) : null}

        {shouldShow("payments") ? (
          <section className={`${styles.lbCard} ${styles.paymentCard}`}>
            <div className={styles.cardTitle}>
              <CreditCard size={22} />
              <h2>Zahlungsmethoden</h2>
            </div>

            <div className={styles.paymentRow}>
              <strong>Mastercard **** 4242</strong>
              <span>Standard</span>
              <b>Naechste Zahlung: 26.07.2026</b>
              <em>99,00 EUR / Monat</em>
            </div>
          </section>
        ) : null}

        {shouldShow("team") ? (
          <section className={`${styles.lbCard} ${styles.teamCard}`}>
            <div className={styles.cardTitle}>
              <Users size={22} />
              <h2>Team-Lizenzen</h2>
            </div>

            <div className={styles.teamStats}>
              <div><strong>12</strong><span>Aktive Benutzer</span></div>
              <div><strong>20</strong><span>Lizenzlimit</span></div>
              <div><strong>8</strong><span>Einladungen offen</span></div>
            </div>
          </section>
        ) : null}

        {shouldShow("history") ? (
          <section className={`${styles.lbCard} ${styles.historyCard}`}>
            <div className={styles.cardTitle}>
              <FileClock size={22} />
              <h2>Lizenzhistorie</h2>
            </div>

            {history.map((entry) => (
              <div className={styles.historyRow} key={`${entry.date}-${entry.title}`}>
                <span>{entry.date}</span>
                <div>
                  <strong>{entry.title}</strong>
                  <p>{entry.meta}</p>
                </div>
              </div>
            ))}
          </section>
        ) : null}

        {shouldShow("settings") ? (
          <section className={`${styles.lbCard} ${styles.systemCard}`}>
            <div className={styles.cardTitle}>
              <Server size={22} />
              <h2>Systeminfos</h2>
            </div>

            <div className={styles.systemGrid}>
              <span>Lizenzstatus</span><strong className={styles.online}>Online</strong>
              <span>Mandant</span><strong>Acme GmbH</strong>
              <span>Region</span><strong>DE</strong>
              <span>Sync</span><strong>26.06.2026 08:45</strong>
              <span>Datenquelle</span><strong>Plan + Marketplace</strong>
              <span>Integritaet</span><strong className={styles.online}>Gueltig</strong>
            </div>
          </section>
        ) : null}

        {shouldShow("activation") ? (
          <section className={`${styles.lbCard} ${styles.advancedCard}`}>
            <button className={styles.advancedToggle} onClick={() => setAdvancedOpen((current) => !current)} type="button">
              <KeyRound size={20} />
              Erweiterte Aktivierung
              <span>{advancedOpen ? "-" : "+"}</span>
            </button>

            {advancedOpen || activeTab === "activation" ? (
              <div className={styles.advancedContent}>
                <button className={`${styles.lbBtn} ${styles.secondary}`} type="button">
                  <RefreshCw size={16} />
                  Lizenz synchronisieren
                </button>
                <button className={`${styles.lbBtn} ${styles.secondary}`} type="button">
                  <Upload size={16} />
                  Lizenzdatei importieren
                </button>
                <label>
                  Lizenzschluessel optional
                  <input placeholder="XXXX-XXXX-XXXX-XXXX" />
                </label>
                <button className={`${styles.lbBtn} ${styles.primary}`} type="button">
                  <Layers3 size={16} />
                  Offline-Aktivierung Enterprise
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
      ) : null}
    </div>
  )
}

function StatusCard({ icon: Icon, label, value, meta }: { icon: LucideIcon; label: string; value: string; meta: string }) {
  return (
    <div className={styles.statusCard}>
      <div className={styles.statusIcon}>
        <Icon size={20} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
    </div>
  )
}

function SystemBox({ icon: Icon, title, value, meta }: { icon: LucideIcon; title: string; value: string; meta: string }) {
  return (
    <div className={styles.systemBox}>
      <div className={styles.smallIcon}>
        <Icon size={18} />
      </div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{meta}</small>
      </div>
    </div>
  )
}

function marketplaceStatusClass(status: string) {
  if (status === "Installiert") return styles.green
  if (status === "Update") return styles.orange
  if (status === "Beta") return styles.blue
  if (status === "Upgrade") return styles.orange
  return styles.gray
}
