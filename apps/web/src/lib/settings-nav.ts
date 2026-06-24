import type { ComponentType } from "react"
import {
  Archive,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  Code2,
  FileText,
  Hash,
  KeyRound,
  Landmark,
  Mail,
  MapPin,
  Palette,
  Plug,
  Scale,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  Wallet,
  Webhook,
  Workflow
} from "lucide-react"

export type SettingsStatus = "Aktiv" | "Teilweise aktiv" | "Premium vorbereitet" | "Nicht eingerichtet"
export type SettingsCategory = "core" | "finance" | "communication" | "security" | "platform" | "compliance"
export type SettingsIcon = ComponentType<{ size?: number; className?: string }>
export type SettingsGroupKey = "company" | "finance" | "security" | "platform" | "compliance" | "communication"

export type SettingsNavItem = {
  key: string
  title: string
  description: string
  href: string
  legacyHref?: string
  icon: SettingsIcon
  category: SettingsCategory
  order: number
  status: SettingsStatus
  accent: string
  accentSoft: string
}

export type SettingsNavGroup = {
  key: SettingsGroupKey
  title: string
  href: string
  itemKeys: readonly string[]
}

export const settingsNav = [
  { key: "company", title: "Unternehmen", description: "Firmendaten, Adresse, Kontakt und Stammdaten", href: "/dashboard-v2/settings/company", legacyHref: "/settings/company", icon: Building2, category: "core", order: 10, status: "Aktiv", accent: "#2563eb", accentSoft: "#dbeafe" },
  { key: "locations", title: "Standorte", description: "Standorte und Standortkontakte", href: "/dashboard-v2/settings/locations", icon: MapPin, category: "core", order: 20, status: "Teilweise aktiv", accent: "#0f766e", accentSoft: "#ccfbf1" },
  { key: "tenants", title: "Mandanten", description: "Mandantenstruktur und Rollenmodell", href: "/dashboard-v2/settings/tenants", icon: Users, category: "core", order: 30, status: "Teilweise aktiv", accent: "#4f46e5", accentSoft: "#e0e7ff" },
  { key: "branding", title: "Branding", description: "Logo, Farben und Dokumentauftritt", href: "/dashboard-v2/settings/branding", icon: Palette, category: "core", order: 40, status: "Aktiv", accent: "#7c3aed", accentSoft: "#ede9fe" },
  { key: "finance", title: "Finanzen", description: "Bankdaten, Steuerdaten und Zahlungsbasis", href: "/dashboard-v2/settings/finance", legacyHref: "/settings/finance", icon: Wallet, category: "finance", order: 110, status: "Teilweise aktiv", accent: "#0f766e", accentSoft: "#ccfbf1" },
  { key: "documents", title: "Dokumente", description: "Dokumenttypen, Vorlagen und Ablage", href: "/dashboard-v2/settings/documents", icon: FileText, category: "finance", order: 120, status: "Aktiv", accent: "#7c3aed", accentSoft: "#ede9fe" },
  { key: "time-tracking", title: "Zeiterfassung", description: "Bestehender Premium-Zugang fuer Zeiten und Projektbezug", href: "/dashboard-v2/settings/time-tracking", icon: CalendarClock, category: "finance", order: 901, status: "Teilweise aktiv", accent: "#0284c7", accentSoft: "#e0f2fe" },
  { key: "billing", title: "Fakturierung", description: "Bestehender Premium-Zugang fuer Fakturierungsprozesse", href: "/dashboard-v2/settings/billing", icon: FileText, category: "finance", order: 902, status: "Teilweise aktiv", accent: "#db2777", accentSoft: "#fce7f3" },
  { key: "number-ranges", title: "Nummernkreise", description: "Rechnungs-, Angebots- und Kundennummern", href: "/dashboard-v2/settings/number-ranges", legacyHref: "/settings/number-ranges", icon: Hash, category: "finance", order: 130, status: "Teilweise aktiv", accent: "#0d9488", accentSoft: "#ccfbf1" },
  { key: "reminders", title: "Mahnwesen", description: "Mahnstufen, Wiedervorlagen und E-Mail-Folgen", href: "/dashboard-v2/settings/reminders", legacyHref: "/settings/reminders", icon: CalendarClock, category: "finance", order: 140, status: "Teilweise aktiv", accent: "#ca8a04", accentSoft: "#fef9c3" },
  { key: "payment-terms", title: "Zahlungsziele", description: "Standard-Zahlungsziele fuer neue Rechnungen", href: "/dashboard-v2/settings/payment-terms", icon: CalendarClock, category: "finance", order: 150, status: "Teilweise aktiv", accent: "#db2777", accentSoft: "#fce7f3" },
  { key: "users", title: "Benutzer & Rollen", description: "Team, Rollen und Einladungen", href: "/dashboard-v2/settings/users", legacyHref: "/settings/users", icon: Users, category: "security", order: 210, status: "Aktiv", accent: "#4f46e5", accentSoft: "#e0e7ff" },
  { key: "security", title: "Sicherheit", description: "Passwort, 2FA und Kontoschutz", href: "/dashboard-v2/settings/security", icon: ShieldCheck, category: "security", order: 220, status: "Teilweise aktiv", accent: "#dc2626", accentSoft: "#fee2e2" },
  { key: "sessions", title: "Sitzungen", description: "Aktive Sitzungen und Login-Sicherheit", href: "/dashboard-v2/settings/sessions", icon: ShieldCheck, category: "security", order: 230, status: "Aktiv", accent: "#0f172a", accentSoft: "#e2e8f0" },
  { key: "permissions", title: "Berechtigungen", description: "Rechte, Limits und Zugriffsebenen", href: "/dashboard-v2/settings/permissions", icon: KeyRound, category: "security", order: 240, status: "Aktiv", accent: "#6d28d9", accentSoft: "#ede9fe" },
  { key: "api", title: "API", description: "API-Zugaenge, Keys und Versionierung", href: "/dashboard-v2/settings/api", icon: Plug, category: "platform", order: 310, status: "Premium vorbereitet", accent: "#9333ea", accentSoft: "#f3e8ff" },
  { key: "webhooks", title: "Webhooks", description: "Webhook-Endpunkte, Events und Logs", href: "/dashboard-v2/settings/webhooks", icon: Webhook, category: "platform", order: 320, status: "Premium vorbereitet", accent: "#7e22ce", accentSoft: "#f3e8ff" },
  { key: "integrations", title: "Integrationen", description: "Externe Dienste und Datenuebergaben", href: "/dashboard-v2/settings/integrations", icon: Plug, category: "platform", order: 330, status: "Premium vorbereitet", accent: "#0891b2", accentSoft: "#cffafe" },
  { key: "automation", title: "Automatisierung", description: "Regeln, Trigger und geplante Ablaeufe", href: "/dashboard-v2/settings/automation", icon: Workflow, category: "platform", order: 340, status: "Premium vorbereitet", accent: "#c2410c", accentSoft: "#ffedd5" },
  { key: "system", title: "System", description: "Sprache, Systemoptionen, Logs und Wartung", href: "/dashboard-v2/settings/system", legacyHref: "/settings/system", icon: Settings, category: "platform", order: 350, status: "Teilweise aktiv", accent: "#475569", accentSoft: "#e2e8f0" },
  { key: "dev", title: "Dev", description: "Entwickleroptionen, technische Freigaben und Diagnose", href: "/dashboard-v2/settings/dev", icon: Code2, category: "platform", order: 360, status: "Premium vorbereitet", accent: "#6366f1", accentSoft: "#e0e7ff" },
  { key: "logs-monitoring", title: "Logs & Ueberwachung", description: "Aktivitaeten, Login-Historie, Audit, API, Webhooks und Systemereignisse", href: "/dashboard-v2/settings/logs-monitoring", icon: SlidersHorizontal, category: "platform", order: 370, status: "Teilweise aktiv", accent: "#7c3aed", accentSoft: "#ede9fe" },
  { key: "reports", title: "Berichte", description: "Auswertungen, Umsatz, KPIs und Exporte", href: "/dashboard-v2/settings/reports", icon: BarChart3, category: "compliance", order: 420, status: "Aktiv", accent: "#16a34a", accentSoft: "#dcfce7" },
  { key: "archive", title: "Archiv", description: "Dokumentenarchiv, Export und Ablage", href: "/dashboard-v2/settings/archive", icon: Archive, category: "compliance", order: 430, status: "Nicht eingerichtet", accent: "#64748b", accentSoft: "#e2e8f0" },
  { key: "legal", title: "Rechtliches", description: "Steuern, E-Rechnung, Impressum und Pflichttexte", href: "/dashboard-v2/settings/legal", legacyHref: "/settings/legal", icon: Scale, category: "compliance", order: 440, status: "Premium vorbereitet", accent: "#a16207", accentSoft: "#fef3c7" },
  { key: "license-billing", title: "Lizenz & Abrechnung", description: "Plan, Marketplace, Seats, Limits, Rechnungen und Aktivierung", href: "/dashboard-v2/settings/license-billing", icon: Landmark, category: "compliance", order: 450, status: "Premium vorbereitet", accent: "#6d28d9", accentSoft: "#ede9fe" },
  { key: "license", title: "Lizenzverwaltung", description: "Bestehende Aktivierung, Benutzerlimit und interne Keys", href: "/dashboard-v2/settings/license", icon: KeyRound, category: "compliance", order: 455, status: "Aktiv", accent: "#6d28d9", accentSoft: "#ede9fe" },
  { key: "email", title: "E-Mail", description: "SMTP, Resend, Versand und Absender", href: "/dashboard-v2/settings/email", legacyHref: "/settings/email", icon: Mail, category: "communication", order: 510, status: "Teilweise aktiv", accent: "#0891b2", accentSoft: "#cffafe" },
  { key: "notifications", title: "Benachrichtigungen", description: "Ereigniskategorien und Systemhinweise", href: "/dashboard-v2/settings/notifications", legacyHref: "/settings/notifications", icon: Bell, category: "communication", order: 520, status: "Teilweise aktiv", accent: "#ea580c", accentSoft: "#ffedd5" },
  { key: "templates", title: "Vorlagen", description: "Dokument- und Kommunikationsvorlagen", href: "/dashboard-v2/settings/templates", icon: FileText, category: "communication", order: 530, status: "Aktiv", accent: "#2563eb", accentSoft: "#dbeafe" },
  { key: "portal", title: "Portal", description: "Angebotslinks, Kundenportal und Sync", href: "/dashboard-v2/settings/portal", legacyHref: "/settings/portal", icon: Archive, category: "communication", order: 540, status: "Premium vorbereitet", accent: "#64748b", accentSoft: "#e2e8f0" },
  { key: "categories", title: "Kategorien", description: "Produkte und Leistungen", href: "/settings/categories", legacyHref: "/settings/categories", icon: Archive, category: "core", order: 920, status: "Aktiv", accent: "#64748b", accentSoft: "#e2e8f0" }
] as const satisfies readonly SettingsNavItem[]

const typedSettingsNav = settingsNav as readonly SettingsNavItem[]

export const premiumSettingsNav = typedSettingsNav
  .filter((item) => item.href.startsWith("/dashboard-v2/settings/"))
  .sort((a, b) => a.order - b.order)

export const premiumSettingsGroups = [
  { key: "company", title: "Firma & Branding", href: "/dashboard-v2/settings/company", itemKeys: ["company", "locations", "tenants", "branding"] },
  { key: "finance", title: "Finanzen & Dokumente", href: "/dashboard-v2/settings/finance", itemKeys: ["finance", "documents", "number-ranges", "reminders", "payment-terms"] },
  { key: "security", title: "Benutzer & Sicherheit", href: "/dashboard-v2/settings/users", itemKeys: ["users", "security", "sessions", "permissions"] },
  { key: "platform", title: "Technik & Plattform", href: "/dashboard-v2/settings/api", itemKeys: ["api", "webhooks", "integrations", "automation", "system", "dev", "logs-monitoring"] },
  { key: "compliance", title: "Compliance & Analyse", href: "/dashboard-v2/settings/reports", itemKeys: ["reports", "archive", "legal", "license-billing"] },
  { key: "communication", title: "Kommunikation", href: "/dashboard-v2/settings/email", itemKeys: ["email", "notifications", "templates", "portal"] }
] as const satisfies readonly SettingsNavGroup[]

export const visiblePremiumSettingsNav = typedSettingsNav
  .filter((item) => premiumSettingsGroups.some((group) => (group.itemKeys as readonly string[]).includes(item.key)))
  .sort((a, b) => a.order - b.order)

export function settingsItemByKey(key: string) {
  return typedSettingsNav.find((item) => item.key === key)
}

export const legacySettingsNav = typedSettingsNav
  .filter((item) => item.legacyHref)
  .sort((a, b) => a.order - b.order)
  .map((item) => ({ ...item, href: item.legacyHref ?? item.href }))
