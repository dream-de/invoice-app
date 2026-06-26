"use client"

import { useMemo, useState } from "react"
import {
  BadgeCheck,
  BarChart3,
  Box,
  CreditCard,
  Database,
  Download,
  FileClock,
  FileText,
  KeyRound,
  Layers3,
  PackageCheck,
  RefreshCw,
  Server,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  ToggleRight,
  Upload,
  Users,
  WalletCards,
  Zap,
  type LucideIcon
} from "lucide-react"
import styles from "./LicenseBillingControlCenter.module.css"

const plans: Record<string, string[]> = {
  Free: ["Kunden", "Angebote", "Rechnungen"],
  Business: ["Kunden", "Angebote", "Rechnungen", "Projekte", "Zeiterfassung", "Dokumente"],
  Enterprise: [
    "Kunden",
    "Angebote",
    "Rechnungen",
    "Projekte",
    "Zeiterfassung",
    "Dokumente",
    "API / Webhooks",
    "Portal",
    "Banking",
    "SSO",
    "White Label"
  ]
}

const marketplace = [
  { name: "DATEV", price: "19,90 EUR / Monat", installed: true, module: "DATEV", category: "Buchhaltung" },
  { name: "OCR", price: "14,90 EUR / Monat", installed: true, module: "OCR", category: "Dokumente" },
  { name: "Lager", price: "24,90 EUR / Monat", installed: true, module: "Lager", category: "Waren" },
  { name: "Shopify", price: "19,90 EUR / Monat", installed: true, module: "Shopify", category: "Shop" },
  { name: "WooCommerce", price: "19,90 EUR / Monat", installed: true, module: "WooCommerce", category: "Shop" }
]

const featureFlags = ["Banking", "API / Webhooks", "Portal"]

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

  const activeModules = useMemo(() => {
    const planModules = plans[plan] ?? []
    const installedModules = marketplace.filter((item) => item.installed).map((item) => item.module)
    return Array.from(new Set([...planModules, ...installedModules, ...featureFlags]))
  }, [plan])


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
        <StatusCard icon={BadgeCheck} label="Plan" value={`DreamInvoice ${plan}`} meta="Aktiv" />
        <StatusCard icon={Users} label="Benutzer" value="12 / 20" meta="8 frei" />
        <StatusCard icon={PackageCheck} label="Module" value={String(activeModules.length)} meta="sichtbar" />
        <StatusCard icon={Zap} label="API" value="45%" meta="45.223 Requests" />
        <StatusCard icon={WalletCards} label="Abrechnung" value="99,00 EUR" meta="monatlich" />
        <StatusCard icon={ShieldCheck} label="Status" value="Online" meta="Lizenz gueltig" />
      </div>

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
              <FeatureColumn title="Plan Module" items={plans[plan] ?? []} />
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
                  <p>{item.name} Erweiterung fuer DreamInvoice.</p>
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
