import { normalizeFeatureKey, type FeatureLookup } from "./feature-flags"
import { newFeatureFlags, newMarketplaceExtensions, type NewFeatureFlag } from "./migration"

export type SaasPlanKey = "free" | "starter" | "business" | "enterprise"
export type SaasPlan = {
  key: SaasPlanKey
  name: string
  status: "Vorbereitet" | "Aktiv"
  seats: number | "Individuell"
  monthlyPrice: string
  target: string
  includedFlags: readonly NewFeatureFlag[]
}

export const saasPlans: readonly SaasPlan[] = [
  { key: "free", name: "Free", status: "Vorbereitet", seats: 1, monthlyPrice: "0 EUR", target: "Einzelne Test- und Demo-Instanzen", includedFlags: [] },
  { key: "starter", name: "Starter", status: "Vorbereitet", seats: 5, monthlyPrice: "Noch offen", target: "Kleine Teams mit Basis-Automatisierung", includedFlags: ["feature.time_tracking_pro"] },
  { key: "business", name: "Business", status: "Vorbereitet", seats: 25, monthlyPrice: "Noch offen", target: "Wachsende Unternehmen mit Erweiterungen", includedFlags: ["feature.banking", "feature.datev", "feature.ocr", "feature.api", "feature.time_tracking_pro", "feature.archive_pro"] },
  { key: "enterprise", name: "Enterprise", status: "Vorbereitet", seats: "Individuell", monthlyPrice: "Individuell", target: "Mandanten, SLA und individuelle Limits", includedFlags: newFeatureFlags }
]

export type MarketplaceModuleStatus = "Verfuegbar" | "Installiert" | "Aktiv" | "Nicht verfuegbar"
export type MarketplaceFeatureFlag = NewFeatureFlag | "feature.api_premium"
export type MarketplaceModuleKey =
  | "datev"
  | "banking"
  | "paypal"
  | "stripe"
  | "ai-assistant"
  | "ocr-ki"
  | "document-analysis"
  | "shopify"
  | "woocommerce"
  | "time-tracking-pro"
  | "resource-planning"
  | "warehouse"
  | "inventory"
  | "multi-tenant"
  | "api-premium"
  | "portal-pro"

export type MarketplaceModule = {
  key: MarketplaceModuleKey
  name: string
  category: MarketplaceModuleCategory
  description: string
  featureFlag: MarketplaceFeatureFlag | null
  canonicalFeatureFlag: NewFeatureFlag | null
  status: Extract<MarketplaceModuleStatus, "Verfuegbar" | "Nicht verfuegbar">
  detail: string
  recommendedPlan: SaasPlanKey
}

export type ResolvedMarketplaceModule = MarketplaceModule & {
  runtimeStatus: MarketplaceModuleStatus
  installed: boolean
  active: boolean
}

export type MarketplaceModuleResolutionInput = {
  installedExtensionKeys?: readonly string[] | null
  activeExtensionKeys?: readonly string[] | null
  featureFlags?: readonly FeatureLookup[] | null
}

export type MarketplaceModuleCategory = "Finanzen" | "KI" | "E-Commerce" | "Projektmanagement" | "Produktion" | "Business"

export const marketplaceModules: readonly MarketplaceModule[] = [
  { key: "datev", name: "DATEV", category: "Finanzen", description: "DATEV-Export und Buchhaltungsuebergabe", featureFlag: "feature.datev", canonicalFeatureFlag: "feature.datev", status: "Verfuegbar", detail: "Export-Workflows, Steuerberater-Uebergabe und Finance-Reporting vorbereiten.", recommendedPlan: "business" },
  { key: "banking", name: "Banking", category: "Finanzen", description: "Bankdaten, Abgleich und Zahlungsuebersicht", featureFlag: "feature.banking", canonicalFeatureFlag: "feature.banking", status: "Verfuegbar", detail: "Open-Banking-Verbindungen und Kontoabgleich ueber Feature Flags steuern.", recommendedPlan: "business" },
  { key: "paypal", name: "PayPal", category: "Finanzen", description: "PayPal-Zahlungen und Zahlungsstatus", featureFlag: null, canonicalFeatureFlag: null, status: "Verfuegbar", detail: "Payment-Erweiterung ohne eigenes Feature Flag; Aktivierung wird spaeter ueber Provider-Konfiguration gekoppelt.", recommendedPlan: "starter" },
  { key: "stripe", name: "Stripe", category: "Finanzen", description: "Stripe-Zahlungen, Webhooks und Checkout", featureFlag: null, canonicalFeatureFlag: null, status: "Verfuegbar", detail: "Payment-Erweiterung ohne eigenes Feature Flag; Aktivierung wird spaeter ueber Provider-Konfiguration gekoppelt.", recommendedPlan: "starter" },
  { key: "ai-assistant", name: "KI Assistent", category: "KI", description: "Assistent fuer Texte, Dokumente und Workflows", featureFlag: "feature.ai_assistant", canonicalFeatureFlag: "feature.ai_assistant", status: "Verfuegbar", detail: "KI-Workflows zentral ueber feature.ai_assistant schalten.", recommendedPlan: "business" },
  { key: "ocr-ki", name: "OCR KI", category: "KI", description: "OCR-Erkennung fuer Belege und Dokumente", featureFlag: "feature.ocr", canonicalFeatureFlag: "feature.ocr", status: "Verfuegbar", detail: "OCR wird ueber feature.ocr aktiviert und bleibt kompatibel mit Legacy Premium.", recommendedPlan: "business" },
  { key: "document-analysis", name: "Dokumentanalyse", category: "KI", description: "Dokumentklassifizierung und Archiv-Auswertung", featureFlag: "feature.archive_pro", canonicalFeatureFlag: "feature.archive_pro", status: "Verfuegbar", detail: "Dokumentanalyse nutzt vorerst das Archiv-Pro-Flag als Compatibility Mapping.", recommendedPlan: "business" },
  { key: "shopify", name: "Shopify", category: "E-Commerce", description: "Shopify-Bestellungen und Kundendaten", featureFlag: "feature.shopify", canonicalFeatureFlag: "feature.shopify", status: "Verfuegbar", detail: "Shop-Integration ueber feature.shopify sichtbar und nutzbar machen.", recommendedPlan: "business" },
  { key: "woocommerce", name: "WooCommerce", category: "E-Commerce", description: "WooCommerce-Bestellungen und Produkte", featureFlag: "feature.woocommerce", canonicalFeatureFlag: "feature.woocommerce", status: "Verfuegbar", detail: "Shop-Integration ueber feature.woocommerce sichtbar und nutzbar machen.", recommendedPlan: "business" },
  { key: "time-tracking-pro", name: "Zeiterfassung Pro", category: "Projektmanagement", description: "Zeiten, Projektbezug und Abrechnung", featureFlag: "feature.time_tracking_pro", canonicalFeatureFlag: "feature.time_tracking_pro", status: "Verfuegbar", detail: "Zeiterfassung wird ueber feature.time_tracking_pro gesteuert.", recommendedPlan: "starter" },
  { key: "resource-planning", name: "Ressourcenplanung", category: "Projektmanagement", description: "Ressourcen, Kapazitaeten und Projektplanung", featureFlag: "feature.time_tracking_pro", canonicalFeatureFlag: "feature.time_tracking_pro", status: "Verfuegbar", detail: "Ressourcenplanung nutzt bis zur eigenen Flag-Migration feature.time_tracking_pro.", recommendedPlan: "business" },
  { key: "warehouse", name: "Lagerverwaltung", category: "Produktion", description: "Bestand, Lagerorte und Warenbewegung", featureFlag: "feature.inventory", canonicalFeatureFlag: "feature.inventory", status: "Verfuegbar", detail: "Produktion und Lager werden ueber feature.inventory gebuendelt.", recommendedPlan: "business" },
  { key: "inventory", name: "Inventur", category: "Produktion", description: "Inventur, Bestandserfassung und Differenzen", featureFlag: "feature.inventory", canonicalFeatureFlag: "feature.inventory", status: "Verfuegbar", detail: "Inventur wird ebenfalls ueber feature.inventory gesteuert.", recommendedPlan: "business" },
  { key: "multi-tenant", name: "Multi-Mandanten", category: "Business", description: "Mandantenstruktur und getrennte Arbeitsbereiche", featureFlag: "feature.api_premium", canonicalFeatureFlag: "feature.api", status: "Nicht verfuegbar", detail: "Enterprise-nahe Erweiterung; Alias feature.api_premium bleibt auf feature.api kompatibel.", recommendedPlan: "enterprise" },
  { key: "api-premium", name: "API Premium", category: "Business", description: "API-Zugriff, Webhooks und technische Freigaben", featureFlag: "feature.api_premium", canonicalFeatureFlag: "feature.api", status: "Verfuegbar", detail: "UI zeigt feature.api_premium, zentrale Pruefung normalisiert auf feature.api.", recommendedPlan: "business" },
  { key: "portal-pro", name: "Kundenportal Pro", category: "Business", description: "Portal, Dokumentfreigaben und Kundenaktionen", featureFlag: "feature.archive_pro", canonicalFeatureFlag: "feature.archive_pro", status: "Verfuegbar", detail: "Portal Pro nutzt vorerst feature.archive_pro als Marketplace-kompatibles Flag.", recommendedPlan: "business" }
]

export const marketplaceCategoryOrder: readonly MarketplaceModuleCategory[] = ["Finanzen", "KI", "E-Commerce", "Projektmanagement", "Produktion", "Business"]

export const marketplaceCategories = marketplaceCategoryOrder.map((category) => ({
  category,
  items: marketplaceModules.filter((module) => module.category === category).map((module) => module.name)
})) as readonly { category: MarketplaceModuleCategory; items: string[] }[]

export const marketplaceModulesByCategory = marketplaceCategoryOrder.map((category) => ({
  category,
  modules: marketplaceModules.filter((module) => module.category === category)
})) as readonly { category: MarketplaceModuleCategory; modules: MarketplaceModule[] }[]

export const defaultInstalledMarketplaceExtensionKeys: readonly MarketplaceModuleKey[] = ["banking", "datev", "ocr-ki", "api-premium", "time-tracking-pro", "portal-pro"]
export const defaultActiveMarketplaceExtensionKeys: readonly MarketplaceModuleKey[] = ["banking", "datev", "ocr-ki", "api-premium", "time-tracking-pro", "portal-pro"]

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort()
}

function canonicalFeatureFlag(feature: FeatureLookup | null | undefined): NewFeatureFlag | null {
  if (!feature) return null
  return normalizeFeatureKey(feature)
}

export function resolveMarketplaceModules(input: MarketplaceModuleResolutionInput = {}): ResolvedMarketplaceModule[] {
  const installedKeys = new Set(input.installedExtensionKeys ?? defaultInstalledMarketplaceExtensionKeys)
  const activeKeys = new Set(input.activeExtensionKeys ?? defaultActiveMarketplaceExtensionKeys)
  const activeFlags = new Set((input.featureFlags ?? []).map(canonicalFeatureFlag).filter((flag): flag is NewFeatureFlag => Boolean(flag)))

  return marketplaceModules.map((module) => {
    const flagIsActive = Boolean(module.canonicalFeatureFlag && activeFlags.has(module.canonicalFeatureFlag))
    const active = module.status !== "Nicht verfuegbar" && (activeKeys.has(module.key) || flagIsActive)
    const installed = active || installedKeys.has(module.key)
    const runtimeStatus: MarketplaceModuleStatus = module.status === "Nicht verfuegbar"
      ? "Nicht verfuegbar"
      : active
        ? "Aktiv"
        : installed
          ? "Installiert"
          : "Verfuegbar"

    return {
      ...module,
      runtimeStatus,
      installed,
      active
    }
  })
}

export function getActiveMarketplaceFeatureFlags(input: MarketplaceModuleResolutionInput = {}) {
  return uniqueSorted(
    resolveMarketplaceModules(input)
      .filter((module) => module.active && module.canonicalFeatureFlag)
      .map((module) => module.canonicalFeatureFlag as NewFeatureFlag)
  )
}

export const dynamicPremiumModules = marketplaceModules.filter((module) => module.canonicalFeatureFlag)

export function getVisiblePremiumModules(input: MarketplaceModuleResolutionInput = {}) {
  return resolveMarketplaceModules(input).filter((module) => module.active && module.canonicalFeatureFlag)
}

export type InstalledExtensionKey = MarketplaceModuleKey
export const installedExtensions = resolveMarketplaceModules({
  installedExtensionKeys: defaultInstalledMarketplaceExtensionKeys,
  activeExtensionKeys: defaultActiveMarketplaceExtensionKeys
})
  .filter((module) => module.installed)
  .map((module) => ({
    key: module.key,
    name: module.name,
    status: module.runtimeStatus,
    flag: module.featureFlag ?? module.canonicalFeatureFlag,
    canonicalFlag: module.canonicalFeatureFlag,
    marketplaceKey: module.key,
    category: module.category,
    description: module.description
  }))

export type UsageLimitKey = "users" | "customers" | "documents" | "ocr" | "apiRequests" | "storage"
export const usageLimits: readonly { key: UsageLimitKey; label: string; used: number; limit: number; unit: string }[] = [
  { key: "users", label: "Benutzer", used: 3, limit: 5, unit: "Seats" },
  { key: "customers", label: "Kunden", used: 128, limit: 500, unit: "Kunden" },
  { key: "documents", label: "Dokumente", used: 860, limit: 2500, unit: "Dokumente" },
  { key: "ocr", label: "OCR", used: 240, limit: 1000, unit: "Seiten" },
  { key: "apiRequests", label: "API Requests", used: 4200, limit: 10000, unit: "Requests" },
  { key: "storage", label: "Speicherplatz", used: 18, limit: 100, unit: "GB" }
]

export const featureFlags = [
  "feature.banking",
  "feature.datev",
  "feature.ocr",
  "feature.ai_assistant",
  "feature.inventory",
  "feature.shopify",
  "feature.woocommerce",
  "feature.api_premium",
  "feature.time_tracking_pro",
  "feature.archive_pro"
] as const

export const marketplaceExtensions = newMarketplaceExtensions

export const rolePermissionActions = ["Lesen", "Erstellen", "Bearbeiten", "Loeschen", "Freigeben", "Exportieren"] as const
