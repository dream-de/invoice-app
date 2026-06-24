import { newFeatureFlags, newMarketplaceExtensions, type NewFeatureFlag } from "@/lib/saas-license-migration"

export type SaasPlanKey = "free" | "starter" | "business" | "enterprise"
export type SaasPlan = {
  key: SaasPlanKey
  name: string
  status: "Vorbereitet" | "Aktiv"
  seats: number | "Individuell"
  monthlyPrice: string
  target: string
}

export const saasPlans: readonly SaasPlan[] = [
  { key: "free", name: "Free", status: "Vorbereitet", seats: 1, monthlyPrice: "0 EUR", target: "Einzelne Test- und Demo-Instanzen" },
  { key: "starter", name: "Starter", status: "Vorbereitet", seats: 5, monthlyPrice: "Noch offen", target: "Kleine Teams mit Basis-Automatisierung" },
  { key: "business", name: "Business", status: "Vorbereitet", seats: 25, monthlyPrice: "Noch offen", target: "Wachsende Unternehmen mit Erweiterungen" },
  { key: "enterprise", name: "Enterprise", status: "Vorbereitet", seats: "Individuell", monthlyPrice: "Individuell", target: "Mandanten, SLA und individuelle Limits" }
]

export type InstalledExtensionKey = "ocr" | "datev" | "banking" | "api-premium" | "multi-tenant" | "customer-portal-pro"
export const installedExtensions: readonly { key: InstalledExtensionKey; name: string; status: "Vorbereitet"; flag: NewFeatureFlag; marketplaceKey: string }[] = [
  { key: "ocr", name: "OCR", status: "Vorbereitet", flag: "feature.ocr", marketplaceKey: "ocr-ai" },
  { key: "datev", name: "DATEV", status: "Vorbereitet", flag: "feature.datev", marketplaceKey: "datev" },
  { key: "banking", name: "Banking", status: "Vorbereitet", flag: "feature.banking", marketplaceKey: "banking" },
  { key: "api-premium", name: "API Premium", status: "Vorbereitet", flag: "feature.api_premium", marketplaceKey: "api-premium" },
  { key: "multi-tenant", name: "Multi-Mandanten", status: "Vorbereitet", flag: "feature.multitenant", marketplaceKey: "multitenant" },
  { key: "customer-portal-pro", name: "Kundenportal Pro", status: "Vorbereitet", flag: "feature.portal_pro", marketplaceKey: "portal-pro" }
]

export const marketplaceCategories = [
  { category: "Finanzen", items: ["DATEV", "Banking", "PayPal", "Stripe"] },
  { category: "KI", items: ["KI Assistent", "OCR KI", "Dokumentanalyse"] },
  { category: "E-Commerce", items: ["Shopify", "WooCommerce"] },
  { category: "Projektmanagement", items: ["Zeiterfassung Pro", "Ressourcenplanung"] },
  { category: "Produktion", items: ["Lagerverwaltung", "Inventur"] },
  { category: "Business", items: ["Multi-Mandanten", "API Premium", "Kundenportal Pro"] }
] as const

export type UsageLimitKey = "users" | "customers" | "documents" | "ocr" | "apiRequests" | "storage"
export const usageLimits: readonly { key: UsageLimitKey; label: string; used: number; limit: number; unit: string }[] = [
  { key: "users", label: "Benutzer", used: 3, limit: 5, unit: "Seats" },
  { key: "customers", label: "Kunden", used: 128, limit: 500, unit: "Kunden" },
  { key: "documents", label: "Dokumente", used: 860, limit: 2500, unit: "Dokumente" },
  { key: "ocr", label: "OCR", used: 240, limit: 1000, unit: "Seiten" },
  { key: "apiRequests", label: "API Requests", used: 4200, limit: 10000, unit: "Requests" },
  { key: "storage", label: "Speicherplatz", used: 18, limit: 100, unit: "GB" }
]

export const featureFlags = newFeatureFlags

export const marketplaceExtensions = newMarketplaceExtensions

export const rolePermissionActions = ["Lesen", "Erstellen", "Bearbeiten", "Loeschen", "Freigeben", "Exportieren"] as const
