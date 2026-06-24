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

export type InstalledExtensionKey = "banking" | "datev" | "ocr" | "ai-assistant" | "inventory" | "shopify" | "woocommerce" | "api-extension" | "time-tracking-pro" | "archive-pro"
export const installedExtensions: readonly { key: InstalledExtensionKey; name: string; status: "Vorbereitet"; flag: NewFeatureFlag; marketplaceKey: string }[] = [
  { key: "banking", name: "Banking", status: "Vorbereitet", flag: "feature.banking", marketplaceKey: "banking" },
  { key: "datev", name: "DATEV", status: "Vorbereitet", flag: "feature.datev", marketplaceKey: "datev" },
  { key: "ocr", name: "OCR", status: "Vorbereitet", flag: "feature.ocr", marketplaceKey: "ocr" },
  { key: "ai-assistant", name: "KI Assistent", status: "Vorbereitet", flag: "feature.ai_assistant", marketplaceKey: "ai-assistant" },
  { key: "inventory", name: "Lager", status: "Vorbereitet", flag: "feature.inventory", marketplaceKey: "inventory" },
  { key: "shopify", name: "Shopify", status: "Vorbereitet", flag: "feature.shopify", marketplaceKey: "shopify" },
  { key: "woocommerce", name: "WooCommerce", status: "Vorbereitet", flag: "feature.woocommerce", marketplaceKey: "woocommerce" },
  { key: "api-extension", name: "API Erweiterung", status: "Vorbereitet", flag: "feature.api", marketplaceKey: "api-extension" },
  { key: "time-tracking-pro", name: "Zeiterfassung Pro", status: "Vorbereitet", flag: "feature.time_tracking_pro", marketplaceKey: "time-tracking-pro" },
  { key: "archive-pro", name: "Dokumentenarchiv Pro", status: "Vorbereitet", flag: "feature.archive_pro", marketplaceKey: "archive-pro" }
]

export const marketplaceCategories = [
  { category: "Finanzen", items: ["Banking", "DATEV"] },
  { category: "KI", items: ["OCR", "KI Assistent"] },
  { category: "Produktion", items: ["Lager"] },
  { category: "E-Commerce", items: ["Shopify", "WooCommerce"] },
  { category: "Business", items: ["API Erweiterung", "Dokumentenarchiv Pro"] },
  { category: "Projektmanagement", items: ["Zeiterfassung Pro"] }
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
