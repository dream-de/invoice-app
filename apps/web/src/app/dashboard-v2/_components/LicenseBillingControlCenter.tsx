"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Archive,
  Bot,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Crown,
  Download,
  FileText,
  Landmark,
  Leaf,
  MessageCircle,
  Package,
  RefreshCcw,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Star,
  SlidersHorizontal,
  Sparkles,
  ScanText,
  type LucideIcon
} from "lucide-react"
import type { ModuleEngineContext, LicenseStatus } from "@/lib/modules/moduleEngine"
import type { ModulePlan } from "@/lib/modules/appRegistry"
import styles from "./LicenseBillingControlCenter.module.css"

type LicenseBillingMeta = {
  nextPaymentDate?: string | null
}

type PlanOption = {
  plan: string
  name: string
  billingCycle: string
  billingLabel: string
  note: string
  subtitle: string
  priceLabel: string
  priceSuffix: string
  features: string[]
  maxUsers: number
  status: string
  validUntil: string | null
}

type MarketplaceModule = {
  key: string
  name: string
  category: string
  description: string
  provider: string
  priceCents: number | null
  currency: string
  billingCycle: string
  installed: boolean
  active: boolean
  licenseRequired: boolean
  licenseStatus: string
  available: boolean
}

type BillingInvoice = {
  id: string
  number: string
  status: string
  amount: number
  currency: string
  issueDate: string | null
  dueDate: string | null
  paidAt: string | null
  downloadUrl: string
}

type PaymentMethod = {
  id: string
  key: string
  label: string
  enabled: boolean
  prepared: boolean
}

type PaymentHistoryItem = {
  id: string
  amount: number
  currency: string
  method: string | null
  provider: string | null
  status: string
  paidAt: string | null
  invoiceNumber: string | null
}

type CurrentLicense = {
  id: string | null
  plan: string
  billingCycle: string
  maxUsers: number
  activeUsers: number
  remainingUsers: number
  status: string
  validUntil: string | null
  updatedAt: string | null
}

type LicenseBillingData = {
  ok: boolean
  license: CurrentLicense
  plans: PlanOption[]
  marketplace: MarketplaceModule[]
  billing: {
    invoices: BillingInvoice[]
    paymentMethods: PaymentMethod[]
    paymentHistory: PaymentHistoryItem[]
    nextPayment: string | null
  }
}

const tabs = ["Plan", "Marketplace", "Abrechnung", "Historie"] as const
const categoryOrder = ["Alle", "Finanzen", "KI & Automation", "Integration", "Dokumente", "E-Commerce", "Kommunikation", "Weitere"]
const filterOptions = ["Alle", "Installiert", "Verfügbar", "Aktiv", "Lizenzpflichtig"] as const
const iconByCategory: Record<string, LucideIcon> = {
  Finanzen: CreditCard,
  Dokumente: FileText,
  "KI & Automation": Sparkles,
  Kommunikation: Package,
  "E-Commerce": Package,
  Integration: Package,
  Weitere: Package
}
const iconByModuleKey: Record<string, LucideIcon> = {
  datev: ReceiptText,
  "ocr-ki": ScanText,
  ocr: ScanText,
  shopify: ShoppingBag,
  woocommerce: Store,
  warehouse: Boxes,
  lager: Boxes,
  whatsapp: MessageCircle,
  "ai-assistant": Bot,
  "paperless-ngx": Archive,
  open_banking: Landmark,
  "microsoft-teams": MessageCircle,
  "portal-pro": FileText
}

function modulePlanFromLicensePlan(plan?: string | null): ModulePlan {
  const normalized = String(plan || "").toLowerCase()
  if (normalized.includes("enterprise") || normalized.includes("unlimited")) return "enterprise"
  if (normalized.includes("business") || normalized.includes("team") || normalized.includes("pro")) return "business"
  return "free"
}

function planLabel(plan?: string | null) {
  const normalized = String(plan || "free").trim()
  if (!normalized) return "Free"
  if (normalized.toLowerCase() === "business") return "Pro"
  return normalized.slice(0, 1).toUpperCase() + normalized.slice(1)
}

function planTone(plan?: string | null) {
  const normalized = modulePlanFromLicensePlan(plan)
  if (normalized === "enterprise") return "enterprise"
  if (normalized === "business") return "pro"
  return "free"
}

function planIcon(plan?: string | null): LucideIcon {
  const tone = planTone(plan)
  if (tone === "enterprise") return Crown
  if (tone === "pro") return Star
  return Leaf
}

function formatUserLimit(maxUsers: number) {
  return maxUsers >= 100000 ? "Unbegrenzte Benutzer" : `${maxUsers} Benutzer`
}

function categoryLabel(category: string) {
  const normalized = String(category || "Weitere").trim()
  if (!normalized) return "Weitere"
  if (normalized === "KI") return "KI & Automation"
  if (["Projektmanagement", "Produktion", "Business"].includes(normalized)) return "Weitere"
  return normalized
}

function categoryKey(category: string) {
  return categoryLabel(category)
}

function marketIconFor(module: MarketplaceModule): LucideIcon {
  return iconByModuleKey[module.key] ?? iconByCategory[categoryKey(module.category)] ?? Package
}

function marketIconTone(module: MarketplaceModule) {
  const key = module.key.replace(/_/g, "-")
  if (["datev", "shopify", "whatsapp", "open-banking"].includes(key)) return styles.greenIcon
  if (["ocr-ki", "ocr"].includes(key)) return styles.blueIcon
  if (["paperless-ngx"].includes(key)) return styles.orangeIcon
  if (["woocommerce", "ai-assistant"].includes(key)) return styles.purpleIcon
  if (["warehouse", "lager"].includes(key)) return styles.violetIcon
  return styles.greenIcon
}

function fallbackPlanFeatures(plan: PlanOption) {
  const normalized = String(plan.plan).toLowerCase()
  if (normalized === "enterprise") {
    return [
      "Alle Pro Funktionen",
      "Alle Marketplace-Module inklusive",
      "Unbegrenzte Benutzer",
      "Unbegrenzter Speicher",
      "Prioritäts-Support",
      "Früher Zugriff auf neue Funktionen",
      "Alle zukünftigen Module inklusive"
    ]
  }
  if (normalized === "pro" || normalized === "business") {
    return [
      "Alle Free Funktionen",
      "API & Webhooks",
      "Banking",
      "25 Benutzer",
      "100 GB Speicher",
      "Marketplace Module einzeln buchbar",
      "Standard-Support"
    ]
  }
  return ["Rechnungen, Angebote, Kunden", "Projekte & Zeiterfassung", "Dokumente", "5 Benutzer", "2 GB Speicher"]
}

function planActionLabel(currentPlan: string, targetPlan: PlanOption) {
  const currentRank = ["free", "pro", "business", "enterprise", "unlimited"].indexOf(String(currentPlan).toLowerCase())
  const targetRank = ["free", "pro", "business", "enterprise", "unlimited"].indexOf(String(targetPlan.plan).toLowerCase())
  const target = targetPlan.name || planLabel(targetPlan.plan)
  if (targetRank > currentRank) return `Upgrade auf ${target}`
  if (targetRank < currentRank) return `Downgrade auf ${target}`
  return `${target} übernehmen`
}

function statusLabel(status?: string | null) {
  const normalized = String(status || "").toLowerCase()
  if (normalized === "active") return "Aktiv"
  if (normalized === "trial") return "Testphase"
  if (normalized === "expired") return "Abgelaufen"
  if (normalized === "canceled" || normalized === "cancelled") return "Gekündigt"
  return status || "Unbekannt"
}

function formatDate(value?: string | null) {
  if (!value) return "Kein Ablaufdatum"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
}

function formatMoney(cents?: number | null, currency = "EUR") {
  if (cents === null || cents === undefined) return "Nicht hinterlegt"
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(cents / 100)
}

function formatAmount(amount: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(amount)
}

function emptyLicense(): CurrentLicense {
  return {
    id: null,
    plan: "free",
    billingCycle: "free",
    maxUsers: 0,
    activeUsers: 0,
    remainingUsers: 0,
    status: "unconfigured",
    validUntil: null,
    updatedAt: null
  }
}

function moduleContextFromLicense(license: CurrentLicense, base?: ModuleEngineContext): ModuleEngineContext {
  return {
    plan: modulePlanFromLicensePlan(license.plan),
    installedExtensions: base?.installedExtensions ?? [],
    featureFlags: base?.featureFlags ?? {},
    licenseStatus: (license.status === "expired" ? "expired" : license.status === "trial" ? "trial" : "active") as LicenseStatus,
    userPermissions: base?.userPermissions ?? ["settings.read"]
  }
}

export function LicenseBillingControlCenter({ moduleContext, billingMeta }: { moduleContext?: ModuleEngineContext; billingMeta?: LicenseBillingMeta }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Plan")
  const [activeCategory, setActiveCategory] = useState("Alle")
  const [activeFilter, setActiveFilter] = useState<(typeof filterOptions)[number]>("Alle")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [marketSearch, setMarketSearch] = useState("")
  const [data, setData] = useState<LicenseBillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function loadLicenseBilling() {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/license-billing", { credentials: "same-origin" })
      const payload = await response.json()
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Lizenzdaten konnten nicht geladen werden.")
      setData(payload)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Lizenzdaten konnten nicht geladen werden.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLicenseBilling()
  }, [])

  const license = data?.license ?? emptyLicense()
  const currentContext = moduleContextFromLicense(license, moduleContext)
  const activePlanLabel = planLabel(license.plan || currentContext.plan)
  const nextPaymentDate = formatDate(data?.billing.nextPayment ?? billingMeta?.nextPaymentDate ?? license.validUntil)

  const categories = useMemo(() => {
    const present = new Set((data?.marketplace ?? []).map((module) => categoryKey(module.category)))
    const ordered = categoryOrder.filter((category) => category === "Alle" || present.has(category))
    const custom = Array.from(present).filter((category) => !ordered.includes(category)).sort((a, b) => a.localeCompare(b, "de"))
    return [...ordered, ...custom]
  }, [data?.marketplace])

  const filteredMarketplace = useMemo(() => {
    const query = marketSearch.trim().toLowerCase()
    return (data?.marketplace ?? []).filter((module) => {
      const matchesSearch = !query || [module.name, module.category, module.description, module.provider].join(" ").toLowerCase().includes(query)
      const matchesCategory = activeCategory === "Alle" || categoryKey(module.category) === activeCategory
      const matchesFilter =
        activeFilter === "Alle" ||
        (activeFilter === "Installiert" && module.installed) ||
        (activeFilter === "Verfügbar" && module.available) ||
        (activeFilter === "Aktiv" && module.active) ||
        (activeFilter === "Lizenzpflichtig" && module.licenseRequired)
      return matchesSearch && matchesCategory && matchesFilter
    })
  }, [activeCategory, activeFilter, data?.marketplace, marketSearch])

  const marketplacePreview = useMemo(() => filteredMarketplace.slice(0, 8), [filteredMarketplace])

  async function updatePlan(plan: PlanOption) {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/license-billing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action: "update-plan", plan: plan.plan, billingCycle: plan.billingCycle, maxUsers: plan.maxUsers })
      })
      const payload = await response.json()
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Plan konnte nicht gespeichert werden.")
      setData(payload)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Plan konnte nicht gespeichert werden.")
    } finally {
      setIsSaving(false)
    }
  }

  async function updateMarketplace(module: MarketplaceModule, action: "install" | "uninstall" | "activate" | "deactivate") {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch("/api/license-billing", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ action, moduleKey: module.key })
      })
      const payload = await response.json()
      if (!response.ok || payload?.ok === false) throw new Error(payload?.error || "Marketplace-Aktion konnte nicht gespeichert werden.")
      setData(payload)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Marketplace-Aktion konnte nicht gespeichert werden.")
    } finally {
      setIsSaving(false)
    }
  }

  function renderMarketplaceSection(modules: MarketplaceModule[], preview = false) {
    return (
      <section className={styles.marketplaceSection}>
        <div className={styles.marketplaceHead}>
          <div>
            <h2>Marketplace</h2>
            <p>Erweiterungen und Integrationen für DreamInvoice.</p>
          </div>

          <div className={styles.marketTools}>
            <label className={styles.marketSearch}>
              <Search size={16} />
              <input value={marketSearch} onChange={(event) => setMarketSearch(event.target.value)} placeholder="Erweiterungen suchen..." />
            </label>
            <div className={styles.filterMenu}>
              <button className={styles.filterTrigger} type="button" aria-haspopup="menu" aria-expanded={isFilterOpen} onClick={() => setIsFilterOpen((open) => !open)}>
                <SlidersHorizontal size={15} />
                <span>{activeFilter === "Alle" ? "Filter" : activeFilter}</span>
                <ChevronDown size={15} />
              </button>
              {isFilterOpen ? (
                <div className={styles.filterDropdown} role="menu">
                  {filterOptions.map((filter) => (
                    <button
                      key={filter}
                      className={activeFilter === filter ? styles.activeFilterOption : ""}
                      type="button"
                      role="menuitemradio"
                      aria-checked={activeFilter === filter}
                      onClick={() => {
                        setActiveFilter(filter)
                        setIsFilterOpen(false)
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.categoryTabs}>
          {categories.map((category) => (
            <button key={category} className={activeCategory === category ? styles.active : ""} onClick={() => setActiveCategory(category)} type="button">
              {categoryLabel(category)}
            </button>
          ))}
        </div>

        {modules.length ? (
          <div className={`${styles.marketplaceGrid} ${preview ? styles.marketplacePreviewGrid : ""}`}>
            {modules.map((module) => {
              const Icon = marketIconFor(module)
              return (
                <article className={styles.marketplaceCard} key={module.key}>
                  <div className={styles.marketTop}>
                    <div className={`${styles.marketIcon} ${marketIconTone(module)}`}><Icon size={21} /></div>
                    {module.installed ? <span>{module.active ? "Aktiv" : "Installiert"}</span> : null}
                  </div>
                  <h3>{module.name}</h3>
                  <p>{categoryLabel(module.category)}</p>
                  {!preview ? <small>{module.description}</small> : null}
                  <strong>{formatMoney(module.priceCents, module.currency)}{module.billingCycle ? ` / ${module.billingCycle}` : ""}</strong>
                  {preview ? (
                    <div className={`${styles.marketActions} ${styles.singleAction}`}>
                      <button className={module.installed ? styles.installedButton : styles.installButton} type="button" disabled={isSaving || module.installed} onClick={() => updateMarketplace(module, "install")}>
                        {module.installed ? "Installiert" : "Installieren"}
                      </button>
                    </div>
                  ) : (
                    <div className={styles.marketActions}>
                      <button className={module.installed ? styles.installedButton : styles.installButton} type="button" disabled={isSaving} onClick={() => updateMarketplace(module, module.installed ? "uninstall" : "install")}>
                        {module.installed ? "Deinstallieren" : "Installieren"}
                      </button>
                      <button className={module.active ? styles.installedButton : styles.installButton} type="button" disabled={isSaving || !module.installed} onClick={() => updateMarketplace(module, module.active ? "deactivate" : "activate")}>
                        {module.active ? "Deaktivieren" : "Aktivieren"}
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>Keine Marketplace-Erweiterungen in der Datenbank gefunden.</div>
        )}
      </section>
    )
  }

  return (
    <div className={styles.licensePage}>
      <div className={styles.licenseHero}>
        <div>
          <h1>Lizenz & Abrechnung</h1>
          <p>Verwalten Sie Ihren Plan, Marketplace und Abrechnung.</p>
        </div>

        <aside className={styles.currentPlanCard}>
          <span>Aktueller Plan</span>
          <div>
            <strong>{activePlanLabel}</strong>
            <em>{statusLabel(license.status)}</em>
          </div>
          <small>Nächste Zahlung: {nextPaymentDate}</small>
          <button type="button" onClick={() => setActiveTab("Plan")}><Settings size={15} />Plan verwalten</button>
        </aside>
      </div>

      <nav className={styles.planTabs} aria-label="Lizenzbereiche">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? styles.active : ""} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {error ? <div className={styles.stateBanner} data-state="error"><AlertCircle size={16} />{error}</div> : null}
      {isLoading ? <div className={styles.stateBanner}><RefreshCcw size={16} />Lizenz- und Abrechnungsdaten werden aus der Datenbank geladen.</div> : null}

      {activeTab === "Plan" ? (
        <section className={styles.planManagement} aria-label="Planverwaltung">
          <div className={styles.pricingGrid}>
            {(data?.plans.length ? data.plans : [{ plan: license.plan, name: activePlanLabel, billingCycle: license.billingCycle, billingLabel: license.billingCycle, note: "", subtitle: "", priceLabel: license.billingCycle, priceSuffix: "", features: [], maxUsers: license.maxUsers, status: license.status, validUntil: license.validUntil }]).map((plan) => {
              const isCurrent = plan.plan === license.plan && plan.billingCycle === license.billingCycle && plan.maxUsers === license.maxUsers
              const tone = planTone(plan.plan)
              const PlanIcon = planIcon(plan.plan)
              const features = plan.features?.length ? plan.features : fallbackPlanFeatures(plan)
              return (
                <article className={`${styles.pricingCard} ${styles[tone]}`} key={`${plan.plan}-${plan.billingCycle}-${plan.maxUsers}`}>
                  <div className={styles.planTitleRow}>
                    <div className={styles.planIcon}><PlanIcon size={24} /></div>
                    <div>
                      <h2>{plan.name || planLabel(plan.plan)}</h2>
                      <p>{plan.subtitle || plan.note || "Plan und Marketplace"}</p>
                    </div>
                  </div>
                  <div className={styles.planPrice}>
                    <strong>{plan.priceLabel || plan.billingLabel}</strong>
                    <span>{plan.priceSuffix || "/Monat"}</span>
                  </div>
                  <ul className={styles.planFeatureList}>
                    {features.map((feature) => <li key={feature}><CheckCircle2 size={14} />{feature}</li>)}
                  </ul>
                  <button className={isCurrent ? styles.currentPlanButton : styles.upgradeButton} type="button" disabled={isCurrent || isSaving} onClick={() => updatePlan(plan)}>
                    {isCurrent ? "Aktueller Plan" : planActionLabel(license.plan, plan)}
                  </button>
                </article>
              )
            })}
          </div>
          {renderMarketplaceSection(marketplacePreview, true)}
        </section>
      ) : null}

      {activeTab === "Marketplace" ? renderMarketplaceSection(filteredMarketplace) : null}

      {activeTab === "Abrechnung" ? (
        <section className={styles.billingGrid}>
          <article className={styles.billingPanel}>
            <h2>Rechnungen</h2>
            {data?.billing.invoices.length ? data.billing.invoices.map((invoice) => (
              <a className={styles.billingRow} href={invoice.downloadUrl} key={invoice.id}>
                <span><strong>{invoice.number}</strong><small>{formatDate(invoice.issueDate)} · {invoice.status}</small></span>
                <b>{formatAmount(invoice.amount, invoice.currency)}</b>
                <Download size={16} />
              </a>
            )) : <div className={styles.emptyState}>Keine Rechnungen in PostgreSQL gefunden.</div>}
          </article>

          <article className={styles.billingPanel}>
            <h2>Zahlungsmethode</h2>
            {data?.billing.paymentMethods.length ? data.billing.paymentMethods.map((method) => (
              <div className={styles.billingRow} key={method.id}>
                <span><strong>{method.label}</strong><small>{method.key}</small></span>
                <b>{method.enabled ? "Aktiv" : method.prepared ? "Vorbereitet" : "Inaktiv"}</b>
              </div>
            )) : <div className={styles.emptyState}>Keine Zahlungsmethode gespeichert.</div>}
            <p className={styles.nextPayment}>Nächste Zahlung: {nextPaymentDate}</p>
          </article>
        </section>
      ) : null}

      {activeTab === "Historie" ? (
        <section className={styles.billingPanel}>
          <h2>Zahlungshistorie</h2>
          {data?.billing.paymentHistory.length ? data.billing.paymentHistory.map((payment) => (
            <div className={styles.billingRow} key={payment.id}>
              <span><strong>{payment.invoiceNumber ?? payment.provider ?? payment.method ?? "Zahlung"}</strong><small>{formatDate(payment.paidAt)} · {payment.status}</small></span>
              <b>{formatAmount(payment.amount, payment.currency)}</b>
            </div>
          )) : <div className={styles.emptyState}>Keine Zahlungshistorie in PostgreSQL gefunden.</div>}
        </section>
      ) : null}
    </div>
  )
}
