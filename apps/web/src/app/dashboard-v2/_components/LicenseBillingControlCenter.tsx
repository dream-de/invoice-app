"use client"

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  BarChart3,
  Box,
  Boxes,
  Brain,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Cloud,
  Code2,
  CreditCard,
  Database,
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
  ToggleRight,
  Upload,
  Users,
  WalletCards,
  Webhook,
  Zap,
  type LucideIcon
} from "lucide-react"
import styles from "./LicenseBillingControlCenter.module.css"

const plans: Record<string, string[]> = {
  Free: ["Kunden", "Angebote", "Rechnungen", "Dokumente", "E-Mail", "Berichte", "Dashboard", "Manuelle Finanzen", "CSV Import"],
  Business: ["Projekte", "Zeiterfassung", "REST API", "Webhooks", "Open Banking Basis", "Zahlungsabgleich"],
  Enterprise: [
    "Multi-Unternehmen",
    "SSO",
    "White Label",
    "Cashflow",
    "Forecast",
    "Bankregeln",
    "Multi-Banking",
    "Erweiterte Audit Logs"
  ]
}

const moduleIcons: Record<string, LucideIcon> = {
  Kunden: Users,
  Angebote: FileText,
  Rechnungen: Receipt,
  Dokumente: FolderOpen,
  "E-Mail": Mail,
  Berichte: BarChart3,
  Dashboard: BarChart3,
  Projekte: Building2,
  Zeiterfassung: Clock,
  "REST API": Code2,
  Webhooks: Webhook,
  "Open Banking Basis": Landmark,
  "Multi-Unternehmen": Building2,
  SSO: ShieldCheck,
  "White Label": ShieldCheck,
  "Manuelle Finanzen": WalletCards,
  "CSV Import": Upload,
  Zahlungsabgleich: Receipt,
  Cashflow: BarChart3,
  Forecast: BarChart3,
  Bankregeln: Landmark,
  "Multi-Banking": Landmark,
  "Erweiterte Audit Logs": ShieldCheck
}

const marketplace = [
  { name: "Open Banking", price: "19,90 EUR / Monat", installed: false, module: "Open Banking", category: "Finanzen", features: ["PSD2 Bankverbindung", "Automatische Synchronisation", "Zahlungsabgleich", "Live Kontostand", "Bankregeln"] },
  { name: "DATEV", price: "19,90 EUR / Monat", installed: true, module: "DATEV", category: "Buchhaltung", features: ["DATEV Export", "Steuerberater-Uebergabe"] },
  { name: "OCR", price: "14,90 EUR / Monat", installed: true, module: "OCR", category: "Dokumente", features: ["Belegerkennung", "Dokumenten-OCR"] },
  { name: "Lager", price: "24,90 EUR / Monat", installed: true, module: "Lager", category: "Waren", features: ["Bestand", "Lagerorte"] },
  { name: "Shopify", price: "19,90 EUR / Monat", installed: true, module: "Shopify", category: "Shop", features: ["Bestellungen", "Produkte"] },
  { name: "WooCommerce", price: "19,90 EUR / Monat", installed: true, module: "WooCommerce", category: "Shop", features: ["Bestellungen", "Produkte"] }
]

const marketplaceApps: Array<{ name: string; category: string; price: string; status: "Installiert" | "Verfuegbar" | "Update" | "Beta"; features: string[]; icon: LucideIcon }> = [
  { name: "Open Banking", category: "Finanzen", price: "19,90 EUR / Monat", status: "Installiert", features: ["PSD2", "Live Sync", "Zahlungsabgleich", "Bankregeln"], icon: Landmark },
  { name: "DATEV", category: "Finanzen", price: "19,90 EUR / Monat", status: "Installiert", features: ["DATEV Export", "Buchungsdaten", "Steuerberater"], icon: FileText },
  { name: "OCR", category: "KI", price: "14,90 EUR / Monat", status: "Verfuegbar", features: ["Belegerkennung", "Dokumenten-OCR", "Automatische Felder"], icon: Brain },
  { name: "Lager", category: "ERP", price: "24,90 EUR / Monat", status: "Verfuegbar", features: ["Bestand", "Lagerorte", "Artikelbewegung"], icon: Package },
  { name: "Shopify", category: "Commerce", price: "19,90 EUR / Monat", status: "Verfuegbar", features: ["Bestellungen", "Produkte", "Kunden Sync"], icon: Store },
  { name: "WooCommerce", category: "Commerce", price: "19,90 EUR / Monat", status: "Verfuegbar", features: ["Bestellungen", "Produkte", "Rechnungen"], icon: Store },
  { name: "Nextcloud", category: "Cloud", price: "9,90 EUR / Monat", status: "Installiert", features: ["Dateien", "Dokumente", "Sync"], icon: Cloud },
  { name: "Paperless-ngx", category: "Cloud", price: "12,90 EUR / Monat", status: "Update", features: ["Archiv", "Dokumente", "Tags"], icon: FolderOpen },
  { name: "OpenAI", category: "KI", price: "29,90 EUR / Monat", status: "Beta", features: ["KI-Assistent", "Textanalyse", "Automationen"], icon: Brain }
]

const marketplaceCategories = ["Alle", "Finanzen", "Commerce", "Cloud", "KI", "ERP"]

const featureFlags = ["open_banking.enabled", "open_banking.psd2", "open_banking.bank_sync", "open_banking.payment_matching", "API / Webhooks", "Portal"]

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
  { id: "modules", label: "Module", icon: PackageCheck },
  { id: "features", label: "Feature Flags", icon: ToggleRight },
  { id: "invoices", label: "Rechnungen", icon: FileText },
  { id: "payments", label: "Zahlungen", icon: CreditCard },
  { id: "api", label: "API Nutzung", icon: Zap },
  { id: "team", label: "Team", icon: Users },
  { id: "history", label: "Historie", icon: FileClock },
  { id: "activation", label: "Aktivierung", icon: KeyRound },
  { id: "settings", label: "Einstellungen", icon: Server }
]

export function LicenseBillingControlCenter() {
  const [plan, setPlan] = useState("Enterprise")
  const [activeTab, setActiveTab] = useState("overview")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Alle")
  const [marketSearch, setMarketSearch] = useState("")

  const visiblePlanModules = useMemo(() => [
    ...plans.Free,
    ...(plan === "Business" || plan === "Enterprise" ? plans.Business : []),
    ...(plan === "Enterprise" ? plans.Enterprise : [])
  ], [plan])

  const activeModules = useMemo(() => {
    const installedModules = marketplace.filter((item) => item.installed).map((item) => item.module)
    return Array.from(new Set([...visiblePlanModules, ...installedModules, ...featureFlags]))
  }, [visiblePlanModules])

  const filteredMarketplaceApps = useMemo(() => {
    const query = marketSearch.trim().toLowerCase()
    return marketplaceApps.filter((app) => {
      const matchesCategory = activeCategory === "Alle" || app.category === activeCategory
      const matchesSearch = !query || [app.name, app.category, ...app.features].join(" ").toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, marketSearch])

  function shouldShow(...names: string[]) {
    return activeTab === "overview" || names.includes(activeTab)
  }

  return (
    <div className={styles.licensePage}>
      <div className={styles.licenseHeader}>
        <div>
          <h1>Lizenz & Abrechnung</h1>
          <p>Verwalten Sie Plan, Marketplace, Feature Flags, Module und Abrechnung.</p>
        </div>

        <div className={styles.licenseHeaderActions}>
          <button className={`${styles.lbBtn} ${styles.secondary}`} type="button">
            <RefreshCw size={16} />
            Lizenz synchronisieren
          </button>
          <button className={`${styles.lbBtn} ${styles.primary}`} type="button">
            <ShoppingCart size={16} />
            Marketplace oeffnen
          </button>
        </div>
      </div>

      <div className={styles.statusStrip}>
        <StatusCard icon={BadgeCheck} label="Plan" value={plan} meta="Aktiv" />
        <StatusCard icon={Users} label="Benutzer" value="12 / 20" meta="8 frei" />
        <StatusCard icon={PackageCheck} label="Module" value={String(activeModules.length)} meta="sichtbar" />
        <StatusCard icon={Zap} label="API" value="45%" meta="45.223 Requests" />
        <StatusCard icon={CalendarDays} label="Abrechnung" value="99,00 EUR" meta="monatlich" />
        <StatusCard icon={ShieldCheck} label="Status" value="Online" meta="Lizenz gueltig" />
      </div>

      <section className={styles.modernSection}>
        <div className={styles.modernSectionHead}>
          <div>
            <h2>1. Lizenz & Plan</h2>
            <p>Aktueller Vertrag, Benutzerlimit, Laufzeit und Lizenzstatus.</p>
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
              <p>Enterprise schaltet erweiterte Administration, Automatisierung, Multi-Banking und Audit-Funktionen frei.</p>
            </div>
          </div>

          <div className={styles.planMeta}>
            <div><span>Verlaengerung</span><strong>26.07.2026</strong></div>
            <div><span>Workspace</span><strong>Acme GmbH</strong></div>
            <div><span>Datenquelle</span><strong>Plan + Marketplace</strong></div>
            <div><span>Integritaet</span><strong className={styles.success}>Gueltig</strong></div>
          </div>
        </div>
      </section>

      <section className={styles.modernSection}>
        <div className={styles.modernSectionHead}>
          <div>
            <h2>2. Kernmodule</h2>
            <p>Module, die direkt durch den aktuellen Plan sichtbar sind.</p>
          </div>
        </div>

        <div className={styles.coreGrid}>
          {visiblePlanModules.map((module) => {
            const Icon = moduleIcons[module] ?? CheckCircle2
            return (
              <div className={styles.coreCard} key={module}>
                <div className={styles.smallIcon}><Icon size={19} /></div>
                <strong>{module}</strong>
                <span>Im Plan</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className={styles.modernSection}>
        <div className={`${styles.modernSectionHead} ${styles.marketplaceHead}`}>
          <div>
            <h2>3. Marketplace</h2>
            <p>Optionale Erweiterungen, die zusaetzlich installiert werden koennen.</p>
          </div>

          <div className={styles.marketTools}>
            <label className={styles.marketSearch}>
              <Search size={16} />
              <input value={marketSearch} onChange={(event) => setMarketSearch(event.target.value)} placeholder="Modul suchen..." />
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

        <div className={styles.modernMarketplaceGrid}>
          {filteredMarketplaceApps.map((app) => {
            const Icon = app.icon
            return (
              <div className={styles.modernMarketplaceCard} key={app.name}>
                <div className={styles.marketCardTop}>
                  <div className={styles.appIcon}><Icon size={24} /></div>
                  <span className={`${styles.modernBadge} ${marketplaceStatusClass(app.status)}`}>{app.status}</span>
                </div>
                <h3>{app.name}</h3>
                <p>{app.category}</p>
                <ul>
                  {app.features.map((feature) => (
                    <li key={feature}><CheckCircle2 size={14} />{feature}</li>
                  ))}
                </ul>
                <strong className={styles.price}>{app.price}</strong>
                <button className={app.status === "Installiert" ? styles.installedBtn : styles.installBtn} type="button">
                  {app.status === "Installiert" ? "Installiert" : "Installieren"}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className={`${styles.modernSection} ${styles.systemSection}`}>
        <div className={styles.modernSectionHead}>
          <div>
            <h2>4. System</h2>
            <p>API-Nutzung, Lizenzhistorie und technische Informationen.</p>
          </div>
        </div>

        <div className={styles.systemInnerGrid}>
          <SystemBox icon={Zap} title="API Nutzung" value="45.223 / 100.000" meta="Reset: 01.07.2026" />
          <SystemBox icon={CreditCard} title="Zahlungsmethode" value="Mastercard •••• 4242" meta="Standard" />
          <SystemBox icon={History} title="Lizenzhistorie" value="Business Plan verlaengert" meta="26.06.2026" />
          <SystemBox icon={Server} title="Lizenzserver" value="Online" meta="Sync: 08:45" />
        </div>
      </section>

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

      <div className={`${styles.licenseGrid} ${activeTab !== "overview" ? styles.singleMode : ""}`}>
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
              {Object.keys(plans).map((item) => (
                <button key={item} className={plan === item ? styles.active : ""} onClick={() => setPlan(item)} type="button">
                  {item}
                </button>
              ))}
            </div>

            <div className={styles.planStats}>
              <div><span>Verlaengerung</span><strong>26.07.2026</strong></div>
              <div><span>Benutzer</span><strong>12 / 20</strong></div>
              <div><span>Aktive Module</span><strong>{activeModules.length}</strong></div>
              <div><span>Workspace</span><strong>Acme GmbH</strong></div>
            </div>
          </section>
        ) : null}

        {shouldShow("features") ? (
          <section className={`${styles.lbCard} ${styles.featureCard}`}>
            <div className={styles.cardTitle}>
              <ToggleRight size={22} />
              <h2>Feature Flags</h2>
            </div>

            <div className={styles.featureGroups}>
              <FeatureColumn title="Plan Module" items={visiblePlanModules} />
              <FeatureColumn title="Aktiviert" items={featureFlags} />
              <FeatureColumn title="Installiert" items={marketplace.filter((item) => item.installed).map((item) => item.module)} />
              <FeatureColumn title="Marketplace" items={marketplace.map((item) => item.module)} />
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
              {marketplace.map((item) => (
                <div className={styles.marketItem} key={item.name}>
                  <div className={styles.marketIcon}>
                    <Box size={22} />
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.name === "Open Banking" ? "PSD2 Bankverbindungen, Kontosynchronisation und Zahlungsabgleich." : `${item.name} Erweiterung fuer DreamInvoice.`}</p>
                  <ul>
                    {item.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                  <strong>{item.price}</strong>
                  <small>{item.category}</small>
                  <button className={item.installed ? styles.installed : ""} type="button">
                    {item.installed ? "Installiert" : "Entdecken"}
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

            {marketplace.filter((item) => item.installed).map((item) => (
              <div className={styles.installedRow} key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.category}</span>
                </div>
                <em>Aktiv</em>
              </div>
            ))}
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
  return styles.gray
}

function FeatureColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      {items.map((item) => (
        <div className={`${styles.featureRow} ${styles.featureActive}`} key={item}>
          <Database size={14} />
          {item}
        </div>
      ))}
    </div>
  )
}
