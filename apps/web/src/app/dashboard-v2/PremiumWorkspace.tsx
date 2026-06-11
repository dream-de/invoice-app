"use client"

import type { ChangeEvent, ComponentType, FormEvent, RefObject } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { articles as fallbackArticlesData, customers as fallbackCustomersData, projects as fallbackProjectsData } from "@/data/invoice-data"
import {
  AlertCircle,
  BarChart3,
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Crown,
  FileText,
  Folder,
  Grid3X3,
  HelpCircle,
  Home,
  KeyRound,
  MoreVertical,
  Plus,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  Tag,
  UserPlus,
  Users,
  Wallet,
  X,
  Zap
} from "lucide-react"
import styles from "./DashboardV2.module.css"

type ThemeMode = "dark" | "light"
type ThemeLinks = { light: string; dark: string }
const PREMIUM_THEME_STORAGE_KEY = "dream-invoice-premium-theme"
type IconType = ComponentType<{ size?: number; className?: string }>
type NavItem = { label: string; href: string; icon: IconType; badge?: string }
type Tone = "violet" | "green" | "rose" | "blue" | "amber"
type PremiumView =
  | "dashboard"
  | "customers"
  | "projects"
  | "invoices"
  | "offers"
  | "time"
  | "expenses"
  | "articles"
  | "reports"
  | "settings"
  | "users"
  | "license"
  | "license-admin"
  | "integrations"
  | "automation"
  | "notifications"
  | "audit"
  | "api"
type InvoiceRow = [number: string, customer: string, status: string, amount: string, date: string]
type ActivityRow = [title: string, text: string, time: string, tone: string]
type UserRow = [name: string, role: string, initials: string, crown: string]
type IntegrationRow = [name: string, meta: string, color: string]
type ModuleRow = [title: string, subtitle: string, value: string, status: string]
type ApiInvoice = {
  id: string
  number: string
  type?: string
  status: string
  customer: string
  grossTotal: number
  date?: string
  dueDate?: string
  createdAt?: string
}
type ApiCustomer = {
  id: string
  number?: string
  name: string
  contact?: string
  email?: string
  phone?: string | null
  street?: string | null
  zip?: string | null
  city?: string | null
  country?: string | null
  status?: string
}
type ApiArticle = {
  id: string
  name: string
  code?: string
  category?: string | null
  price?: number
  active?: boolean
}
type ProjectData = {
  id: string
  name: string
  customer: string
  status: string
  progress: string
  budget: string
}
type AppUser = {
  id: string
  name?: string | null
  email?: string | null
  role?: string | null
  status?: string | null
}
type UserLimit = {
  plan?: string | null
  maxUsers?: number | null
  currentUsers?: number | null
  validUntil?: string | null
}
type NotificationItem = {
  id: string
  title: string
  message?: string | null
  category?: string | null
  tone?: string | null
  read?: boolean | null
  readAt?: string | null
}
type CompanySettings = {
  company?: string | null
  email?: string | null
  city?: string | null
  country?: string | null
}
type NumberRange = {
  type: string
  prefix: string
  nextValue: number
  padding: number
}
type LicenseAdminPlan = "free" | "pro" | "team" | "business" | "unlimited"
type LicenseIssueSummary = {
  id: string
  licenseId: string
  keyPreview: string
  plan: string
  billingCycle: string
  maxUsers: number
  status: string
  customerName?: string | null
  validUntil?: string | null
  activatedAt?: string | null
  createdAt?: string | null
}
type LicenseAdminGenerated = {
  licenseKey: string
  license: {
    keyPreview: string
    plan: string
    billingCycle: string
    maxUsers: number
    customerName?: string | null
    validUntil?: string | null
    status: string
  }
}
type PremiumData = {
  invoices: ApiInvoice[]
  customers: ApiCustomer[]
  articles: ApiArticle[]
  projects: ProjectData[]
  appUsers: AppUser[]
  userLimit: UserLimit | null
  notifications: NotificationItem[]
  companySettings: CompanySettings | null
  numberRanges: NumberRange[]
  loaded: boolean
}
type ModuleConfig = {
  stats: Array<[value: string, label: string]>
  rows: ModuleRow[]
  focus: Array<[label: string, value: string]>
  actions: Array<[label: string, href: string]>
  timeline: Array<[title: string, text: string]>
  primaryHref: string
}
type SearchResult = {
  title: string
  subtitle: string
  href: string
  icon: IconType
}
type UpgradeSummary = {
  title: string
  text: string
  action: string
  href: string
}

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard-v2", icon: Home },
  { label: "Kunden", href: "/dashboard-v2/customers", icon: Users },
  { label: "Projekte", href: "/dashboard-v2/projects", icon: Folder },
  { label: "Rechnungen", href: "/dashboard-v2/invoices", icon: FileText },
  { label: "Angebote", href: "/dashboard-v2/offers", icon: Tag },
  { label: "Zeiterfassung", href: "/dashboard-v2/time", icon: Clock3 },
  { label: "Ausgaben", href: "/dashboard-v2/expenses", icon: Wallet },
  { label: "Berichte", href: "/dashboard-v2/reports", icon: BarChart3 },
  { label: "Einstellungen", href: "/dashboard-v2/settings", icon: Settings }
]
const articlesNavItem: NavItem = { label: "Artikel", href: "/dashboard-v2/articles", icon: Briefcase }
const topNav: NavItem[] = [mainNav[0], mainNav[1], mainNav[2], mainNav[3], mainNav[4], articlesNavItem, mainNav[7]]

const sideNav = [
  { section: "Hauptmenu", items: [...mainNav.slice(0, 7), articlesNavItem, mainNav[7]] },
  {
    section: "Management",
    items: [
      { label: "Benutzer & Rollen", href: "/dashboard-v2/users", icon: Users },
      { label: "Lizenzen", href: "/dashboard-v2/license", icon: KeyRound },
      { label: "Lizenz Admin", href: "/dashboard-v2/license-admin", icon: ShieldCheck },
      { label: "Integrationen", href: "/dashboard-v2/integrations", icon: Zap },
      { label: "Automatisierung", href: "/dashboard-v2/automation", icon: Settings }
    ]
  },
  {
    section: "Extras",
    items: [
      { label: "Benachrichtigungen", href: "/dashboard-v2/notifications", icon: Bell },
      { label: "Aktivitaetsprotokoll", href: "/dashboard-v2/audit", icon: ShieldCheck },
      { label: "API & Webhooks", href: "/dashboard-v2/api", icon: Grid3X3 }
    ]
  }
]

const premiumViewMeta: Record<PremiumView, { title: string; eyebrow: string; description: string; primary: string }> = {
  dashboard: {
    title: "Dashboard",
    eyebrow: "Premium Uebersicht",
    description: "Alle Kennzahlen, Aktivitaeten und schnellen Aufgaben an einem Ort.",
    primary: "Neue Rechnung"
  },
  customers: {
    title: "Kunden",
    eyebrow: "CRM",
    description: "Kundenprofile, offene Betraege, Projektstatus und Kontaktqualitaet.",
    primary: "Neuer Kunde"
  },
  projects: {
    title: "Projekte",
    eyebrow: "Projektsteuerung",
    description: "Aktive Projekte, Budgets, Phasen, Aufgaben und abrechenbare Zeit.",
    primary: "Neues Projekt"
  },
  invoices: {
    title: "Rechnungen",
    eyebrow: "Dokumente",
    description: "Rechnungen erstellen, pruefen, versenden und Zahlungseingaenge verfolgen.",
    primary: "Rechnung erstellen"
  },
  offers: {
    title: "Angebote",
    eyebrow: "Vertrieb",
    description: "Angebote vorbereiten, Versionen vergleichen und Annahmen verfolgen.",
    primary: "Angebot erstellen"
  },
  time: {
    title: "Zeiterfassung",
    eyebrow: "Produktivitaet",
    description: "Arbeitszeiten erfassen, Projektzeiten kontrollieren und abrechnen.",
    primary: "Timer starten"
  },
  expenses: {
    title: "Ausgaben",
    eyebrow: "Kosten",
    description: "Belege, Kostenstellen, Ausgabenkategorien und Erstattungen verwalten.",
    primary: "Ausgabe erfassen"
  },
  articles: {
    title: "Artikel",
    eyebrow: "Leistungen",
    description: "Artikel, Leistungen, Preise, Kategorien, Import und Export im Premium-Kontext verwalten.",
    primary: "Artikel importieren"
  },
  reports: {
    title: "Berichte",
    eyebrow: "Controlling",
    description: "Umsatz, Ausgaben, Cashflow, Kundenwert und Monatsvergleiche auswerten.",
    primary: "Report exportieren"
  },
  settings: {
    title: "Einstellungen",
    eyebrow: "Workspace",
    description: "Unternehmensdaten, Nummernkreise, E-Mail, Portal und Systemoptionen.",
    primary: "Einstellungen pruefen"
  },
  users: {
    title: "Benutzer & Rollen",
    eyebrow: "Team",
    description: "Rollen, Berechtigungen, Benutzerlimits und Sicherheitsstatus verwalten.",
    primary: "Benutzer einladen"
  },
  license: {
    title: "Lizenzen",
    eyebrow: "Premium",
    description: "Lizenzstatus, Aktivierung, Limits und Upgrade-Optionen ueberblicken.",
    primary: "Lizenz aktivieren"
  },
  "license-admin": {
    title: "Lizenz Admin",
    eyebrow: "Intern",
    description: "Lizenz-Keys fuer Kunden erzeugen, Benutzerlimits setzen und Ausgaben kontrollieren.",
    primary: "Key erzeugen"
  },
  integrations: {
    title: "Integrationen",
    eyebrow: "Automatisierung",
    description: "Zahlungen, Buchhaltung, Cloud-Speicher und Automationen verbinden.",
    primary: "Integration verbinden"
  },
  automation: {
    title: "Automatisierung",
    eyebrow: "Workflows",
    description: "Wiederkehrende Aufgaben, Erinnerungen und Dokumentprozesse automatisieren.",
    primary: "Workflow erstellen"
  },
  notifications: {
    title: "Benachrichtigungen",
    eyebrow: "Inbox",
    description: "Rechnungsstatus, Zahlungen, Aufgaben und Systemmeldungen im Blick behalten.",
    primary: "Regeln bearbeiten"
  },
  audit: {
    title: "Aktivitaetsprotokoll",
    eyebrow: "Audit",
    description: "Aenderungen, Zugriffe, Exporte und sicherheitsrelevante Ereignisse verfolgen.",
    primary: "Audit exportieren"
  },
  api: {
    title: "API & Webhooks",
    eyebrow: "Developer",
    description: "API-Schluessel, Webhooks, Ereignisse und Integrationsstatus steuern.",
    primary: "Webhook erstellen"
  }
}

const kpis: Array<{ label: string; value: string; detail: string; tone: Tone; icon: IconType }> = [
  { label: "Offene Rechnungen", value: "528,99 EUR", detail: "14 Dokumente", tone: "violet", icon: Receipt },
  { label: "Bezahlt", value: "719,05 EUR", detail: "+18% vs. Vormonat", tone: "green", icon: Briefcase },
  { label: "Ueberfaellig", value: "1.147,00 EUR", detail: "11 Dokumente", tone: "rose", icon: AlertCircle },
  { label: "Angebote", value: "1.320,00 EUR", detail: "9 Dokumente", tone: "blue", icon: Tag },
  { label: "Ausgaben", value: "528,99 EUR", detail: "+8% vs. Vormonat", tone: "amber", icon: Wallet }
]

const invoices: InvoiceRow[] = [
  ["OF-2026-5001", "Meridian Studio GmbH", "Entwurf", "1.320,00 EUR", "25.05.2026"],
  ["RE-2026-4999", "Aurora Labs GmbH", "Bezahlt", "719,05 EUR", "23.05.2026"],
  ["RE-2026-4998", "Urban Commerce Inc.", "Bezahlt", "528,99 EUR", "22.05.2026"],
  ["OF-2026-4997", "Pixel Perfect Ltd.", "Ueberfaellig", "1.147,00 EUR", "20.05.2026"]
]

const activities: ActivityRow[] = [
  ["Neue Rechnung erstellt", "OF-2026-5001 fuer Meridian Studio GmbH", "vor 5 Minuten", "blue"],
  ["Zahlung erhalten", "719,05 EUR von Aurora Labs GmbH", "vor 1 Stunde", "green"],
  ["Projekt aktualisiert", "Website Redesign - Phase 2", "vor 3 Stunden", "violet"],
  ["Neuer Kunde hinzugefuegt", "Pixel Perfect Ltd.", "Gestern", "blue"]
]

const users: UserRow[] = [
  ["Daniel", "Administrator", "D", "crown"],
  ["Sarah", "Manager", "S", ""],
  ["Michael", "Buchhalter", "M", ""],
  ["Julia", "Mitarbeiter", "J", ""],
  ["Thomas", "Mitarbeiter", "T", ""]
]

const integrations: IntegrationRow[] = [
  ["Stripe", "Zahlungen", "#635bff"],
  ["PayPal", "Zahlungen", "#0070ba"],
  ["DATEV", "Buchhaltung", "#8cc63f"],
  ["Dropbox", "Dateispeicher", "#0061ff"],
  ["Google Drive", "Dateispeicher", "#16a34a"],
  ["Zapier", "Automatisierung", "#ff4f00"]
]

const licenseAdminPlans: Array<{ key: LicenseAdminPlan; label: string; users: number; billing: string }> = [
  { key: "free", label: "Free", users: 5, billing: "free" },
  { key: "pro", label: "Pro", users: 15, billing: "yearly" },
  { key: "team", label: "Team", users: 25, billing: "yearly" },
  { key: "business", label: "Business", users: 50, billing: "yearly" },
  { key: "unlimited", label: "Unlimited", users: 1_000_000, billing: "custom" }
]

function licenseAdminPlanByKey(plan: LicenseAdminPlan) {
  return licenseAdminPlans.find((item) => item.key === plan) ?? licenseAdminPlans[2]
}

const revenue = [820, 980, 1320, 1580, 1190, 1460, 1440, 1900, 2220, 1980, 2240, 1730, 1750]
const payments = [520, 650, 1020, 1080, 880, 760, 1060, 1500, 1810, 1600, 1450, 1280, 860]
const expenses = [80, 180, 310, 430, 290, 360, 390, 530, 520, 580, 610, 640, 510]
const monthLabels = ["Jan", "Feb", "Maer", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
const fallbackApiInvoices: ApiInvoice[] = invoices.map(([number, customer, status, amount, date]) => ({
  id: number,
  number,
  type: number.startsWith("OF-") ? "offer" : "invoice",
  status,
  customer,
  grossTotal: Number(amount.replaceAll(".", "").replace(",", ".").replace(/[^\d.]/g, "")) || 0,
  date,
  createdAt: date
}))
const fallbackApiCustomers: ApiCustomer[] = fallbackCustomersData.map((customer) => ({
  id: customer.id,
  number: "KD-" + customer.id.padStart(4, "0"),
  name: customer.name,
  contact: customer.contact,
  email: customer.email,
  phone: "",
  street: "",
  zip: "",
  city: "",
  country: "Deutschland",
  status: customer.status
}))
const fallbackApiArticles: ApiArticle[] = fallbackArticlesData.map((article) => ({
  id: article.id,
  name: article.name,
  code: article.code,
  category: article.category,
  price: Number(article.price) || 0,
  active: article.status !== "inactive"
}))
const fallbackProjects: ProjectData[] = fallbackProjectsData.map((project) => ({
  id: project.id,
  name: project.name,
  customer: project.customer,
  status: project.status,
  progress: project.progress,
  budget: project.budget
}))
const fallbackAppUsers: AppUser[] = users.map(([name, role], index) => ({
  id: `fallback-user-${index}`,
  name,
  email: `${name.toLowerCase()}@dreaminvoice.local`,
  role,
  status: "active"
}))
const fallbackUserLimit: UserLimit = {
  plan: "Free",
  currentUsers: 5,
  maxUsers: 5,
  validUntil: null
}
const fallbackNotifications: NotificationItem[] = activities.map(([title, text], index) => ({
  id: `fallback-notification-${index}`,
  title,
  message: text,
  category: index === 1 ? "payments" : "documents",
  tone: index === 1 ? "success" : "info",
  readAt: index > 1 ? new Date().toISOString() : null
}))
const fallbackCompanySettings: CompanySettings = {
  company: "Acme GmbH",
  email: "office@acme.example",
  city: "Koeln",
  country: "Deutschland"
}
const fallbackNumberRanges: NumberRange[] = [
  { type: "invoice", prefix: "RE-%Y-", nextValue: 104, padding: 3 },
  { type: "offer", prefix: "AN-%Y-", nextValue: 42, padding: 3 },
  { type: "customer", prefix: "KD-", nextValue: 4, padding: 4 }
]

function formatEuro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value)
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase()
  if (normalized === "paid") return "Bezahlt"
  if (normalized === "open" || normalized === "sent") return "Offen"
  if (normalized === "draft") return "Entwurf"
  if (normalized === "overdue") return "Ueberfaellig"
  return status
}

function isStatus(status: string, expected: "paid" | "open" | "draft" | "overdue") {
  const normalized = status.toLowerCase()
  if (expected === "paid") return normalized === "paid" || normalized === "bezahlt"
  if (expected === "open") return normalized === "open" || normalized === "sent" || normalized === "offen" || normalized === "gesendet"
  if (expected === "draft") return normalized === "draft" || normalized === "entwurf"
  return normalized === "overdue" || normalized === "ueberfaellig" || normalized === "überfällig"
}

function invoiceType(invoice: ApiInvoice) {
  const normalizedType = String(invoice.type || "").toLowerCase()
  if (normalizedType.includes("offer") || normalizedType.includes("angebot") || invoice.number.startsWith("OF-")) return "offer"
  return "invoice"
}

function invoiceRowsFromData(data: PremiumData): InvoiceRow[] {
  const source = data.invoices.length ? data.invoices : fallbackApiInvoices
  return source.slice(0, 5).map((invoice) => [
    invoice.number,
    invoice.customer || "Unbekannt",
    statusLabel(invoice.status),
    formatEuro(Number(invoice.grossTotal) || 0),
    String(invoice.date || invoice.createdAt || "-").slice(0, 10)
  ])
}

function notificationRows(data: PremiumData): ActivityRow[] {
  const source = data.notifications.length ? data.notifications : fallbackNotifications
  return source.slice(0, 4).map((item, index) => [
    item.title,
    item.message || item.category || "Systemmeldung",
    isNotificationRead(item) ? "Gelesen" : index === 0 ? "Neu" : "Heute",
    item.tone === "success" ? "green" : item.tone === "warning" ? "rose" : "blue"
  ])
}

function isNotificationRead(item: NotificationItem) {
  return item.read === true || Boolean(item.readAt)
}

function normalizeNotificationItem(item: NotificationItem): NotificationItem {
  return {
    ...item,
    readAt: item.readAt ?? (item.read === true ? new Date().toISOString() : null)
  }
}

function normalizeNotifications(items: NotificationItem[]) {
  return items.map(normalizeNotificationItem)
}

function notificationStatus(item: NotificationItem) {
  if (isNotificationRead(item)) return "Gelesen"
  if (item.tone === "warning") return "Wichtig"
  if (item.tone === "success") return "Erledigt"
  return "Neu"
}

function userCardsFromData(data: PremiumData): UserRow[] {
  const source = data.appUsers.length ? data.appUsers : fallbackAppUsers
  return source.slice(0, 5).map((user, index) => {
    const name = user.name || user.email?.split("@")[0] || "Benutzer"
    const role = user.role || "Team"
    return [name, role, name.charAt(0).toUpperCase(), index === 0 ? "crown" : ""]
  })
}

function initialsFromName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "D"
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("")
}

function workspaceFromData(data: PremiumData) {
  const company = data.companySettings ?? fallbackCompanySettings
  const name = company.company || fallbackCompanySettings.company || "DreamInvoice"

  return {
    name,
    initial: initialsFromName(name).charAt(0)
  }
}

function profileFromData(data: PremiumData) {
  const user = (data.appUsers.length ? data.appUsers : fallbackAppUsers)[0]
  const name = user?.name || user?.email?.split("@")[0] || "Daniel"
  const role = user?.role || "Administrator"

  return {
    name,
    role,
    initials: initialsFromName(name)
  }
}

function userLimitFromData(data: PremiumData) {
  const source = data.appUsers.length ? data.appUsers : fallbackAppUsers
  const limit = data.userLimit ?? fallbackUserLimit
  const currentUsers = limit.currentUsers ?? source.length
  const maxUsers = limit.maxUsers ?? fallbackUserLimit.maxUsers ?? 5

  return {
    currentUsers,
    maxUsers,
    plan: limit.plan || fallbackUserLimit.plan || "Free",
    validUntil: limit.validUntil ?? null,
    isFull: currentUsers >= maxUsers
  }
}

function userStatusLabel(value?: string | null) {
  const normalized = String(value || "").toLowerCase()
  if (normalized === "active") return "Aktiv"
  if (normalized === "inactive") return "Inaktiv"
  if (normalized === "invited" || normalized === "pending") return "Eingeladen"
  return value || "Aktiv"
}

function customerStatusLabel(value?: string | null) {
  const normalized = String(value || "").toLowerCase()
  if (normalized === "active" || normalized === "aktiv") return "Aktiv"
  if (normalized === "open" || normalized === "offen") return "Offen"
  if (normalized === "inactive" || normalized === "inaktiv") return "Inaktiv"
  return value || "Aktiv"
}

function numberRangeLabel(type: string) {
  const normalized = type.toLowerCase()
  if (normalized.includes("invoice")) return "Rechnungen"
  if (normalized.includes("offer")) return "Angebote"
  if (normalized.includes("customer")) return "Kunden"
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function dataSourceLabel(data: PremiumData) {
  return data.loaded ? "Live" : "Lokal"
}

function upgradeSummaryFromData(data: PremiumData): UpgradeSummary {
  const limit = userLimitFromData(data)
  if (limit.isFull) {
    return {
      title: "Limit erreicht",
      text: `${limit.currentUsers}/${limit.maxUsers} Benutzer aktiv. Upgrade fuer mehr Teammitglieder vorbereiten.`,
      action: "Upgrade pruefen",
      href: "/dashboard-v2/license?q=Upgrade"
    }
  }

  return {
    title: `${limit.plan} aktiv`,
    text: `${limit.maxUsers - limit.currentUsers} Benutzerplaetze verfuegbar. Lizenzstatus und Limits pruefen.`,
    action: "Lizenzstatus",
    href: "/dashboard-v2/license?q=Benutzerlimit"
  }
}

function matchesSearch(values: readonly string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return values.some((value) => value.toLowerCase().includes(normalizedQuery))
}

function globalSearchResults(data: PremiumData, query: string): SearchResult[] {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  const navItems = [...mainNav, ...sideNav.flatMap((group) => group.items)]
  const uniqueNavItems = Array.from(new Map(navItems.map((item) => [item.href, item])).values())
  const customersSource = data.customers.length ? data.customers : fallbackApiCustomers
  const invoicesSource = data.invoices.length ? data.invoices : fallbackApiInvoices
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const projectsSource = data.projects.length ? data.projects : fallbackProjects
  const usersSource = data.appUsers.length ? data.appUsers : fallbackAppUsers
  const notificationsSource = data.notifications.length ? data.notifications : fallbackNotifications
  const results: SearchResult[] = []

  for (const item of uniqueNavItems) {
    if (!matchesSearch([item.label, item.href], normalizedQuery)) continue
    results.push({ title: item.label, subtitle: "Premium Bereich", href: item.href, icon: item.icon })
  }

  for (const customer of customersSource) {
    if (!matchesSearch([customer.name, customer.email || "", customer.contact || "", customer.status || ""], normalizedQuery)) continue
    results.push({ title: customer.name, subtitle: customer.email || customer.contact || "Kundenprofil", href: `/dashboard-v2/customers?q=${encodeURIComponent(customer.name)}`, icon: Users })
  }

  for (const invoice of invoicesSource) {
    if (!matchesSearch([invoice.number, invoice.customer, statusLabel(invoice.status), formatEuro(Number(invoice.grossTotal) || 0)], normalizedQuery)) continue
    const view = invoiceType(invoice) === "offer" ? "offers" : "invoices"
    results.push({ title: invoice.number, subtitle: `${invoice.customer} · ${formatEuro(Number(invoice.grossTotal) || 0)}`, href: `/dashboard-v2/${view}?q=${encodeURIComponent(invoice.number)}`, icon: FileText })
  }

  for (const project of projectsSource) {
    if (!matchesSearch([project.name, project.customer, project.status, project.progress, project.budget], normalizedQuery)) continue
    results.push({ title: project.name, subtitle: `${project.customer} · ${project.progress}`, href: `/dashboard-v2/projects?q=${encodeURIComponent(project.name)}`, icon: Folder })
  }

  for (const article of articlesSource) {
    if (!matchesSearch([article.name, article.category || "", article.code || "", formatEuro(Number(article.price) || 0)], normalizedQuery)) continue
    results.push({ title: article.name, subtitle: `${article.category || "Leistung"} · ${formatEuro(Number(article.price) || 0)}`, href: `/dashboard-v2/articles?q=${encodeURIComponent(article.name)}`, icon: Briefcase })
  }

  for (const user of usersSource) {
    const name = user.name || user.email || "Benutzer"
    if (!matchesSearch([name, user.email || "", user.role || "", userStatusLabel(user.status)], normalizedQuery)) continue
    results.push({ title: name, subtitle: `${user.role || "Team"} · ${userStatusLabel(user.status)}`, href: `/dashboard-v2/users?q=${encodeURIComponent(name)}`, icon: Users })
  }

  for (const notification of notificationsSource) {
    if (!matchesSearch([notification.title, notification.message || "", notification.category || "", notificationStatus(notification)], normalizedQuery)) continue
    results.push({ title: notification.title, subtitle: notification.message || notification.category || "Systemmeldung", href: `/dashboard-v2/notifications?q=${encodeURIComponent(notification.title)}`, icon: Bell })
  }

  return results.slice(0, 8)
}

function parsePercent(value: string) {
  const parsed = Number(value.replace(/[^\d.,]/g, "").replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function parseMoney(value: string) {
  const normalized = value.replace(/\s/g, "").replaceAll(".", "").replace(",", ".").replace(/[^\d.-]/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function projectBudgetTotal(projectsSource: ProjectData[]) {
  return projectsSource.reduce((sum, project) => sum + parseMoney(project.budget), 0)
}

function estimatedBillableHours(projectsSource: ProjectData[]) {
  return Math.round(projectsSource.reduce((sum, project) => sum + (parsePercent(project.progress) / 100) * 12, 0))
}

function parseInvoiceDate(value?: string) {
  if (!value) return null
  const isoDate = new Date(value)
  if (!Number.isNaN(isoDate.getTime())) return isoDate
  const dateMatch = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!dateMatch) return null
  const parsed = new Date(Number(dateMatch[3]), Number(dateMatch[2]) - 1, Number(dateMatch[1]))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function buildMonthlySeries(data: PremiumData) {
  const source = data.invoices.length ? data.invoices : fallbackApiInvoices
  const parsedDates = source
    .map((invoice) => parseInvoiceDate(invoice.date || invoice.createdAt || invoice.dueDate))
    .filter((date): date is Date => Boolean(date))
  const latestDate = parsedDates.length
    ? new Date(Math.max(...parsedDates.map((date) => date.getTime())))
    : new Date(2026, 6, 1)

  const buckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(latestDate.getFullYear(), latestDate.getMonth() - (5 - index), 1)
    return {
      key: monthKey(date),
      label: monthLabels[date.getMonth()],
      revenue: 0,
      payments: 0,
      expenses: 0
    }
  })
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const invoice of source) {
    const date = parseInvoiceDate(invoice.date || invoice.createdAt || invoice.dueDate)
    if (!date) continue
    const bucket = bucketMap.get(monthKey(date))
    if (!bucket) continue
    const amount = Number(invoice.grossTotal || 0)
    if (invoiceType(invoice) === "offer") {
      bucket.revenue += amount * 0.45
      continue
    }
    bucket.revenue += amount
    bucket.expenses += amount * 0.32
    if (isStatus(invoice.status, "paid")) {
      bucket.payments += amount
    }
  }

  return {
    labels: buckets.map((bucket) => bucket.label),
    years: buckets.map((bucket) => Number(bucket.key.slice(0, 4))),
    revenue: buckets.map((bucket, index) => Math.round(bucket.revenue || revenue[index] || 0)),
    payments: buckets.map((bucket, index) => Math.round(bucket.payments || payments[index] || 0)),
    expenses: buckets.map((bucket, index) => Math.round(bucket.expenses || expenses[index] || 0))
  }
}

const moduleContent: Record<Exclude<PremiumView, "dashboard">, ModuleConfig> = {
  customers: {
    stats: [["186", "Kunden"], ["24", "Aktiv"], ["98%", "Kontaktqualitaet"]],
    rows: [["Meridian Studio GmbH", "4 offene Dokumente", "2.467,00 EUR", "Aktiv"], ["Aurora Labs GmbH", "Zahlung erhalten", "719,05 EUR", "Bezahlt"], ["Pixel Perfect Ltd.", "Neues Projekt", "Design Sprint", "Neu"]],
    focus: [["Offene Forderungen", "3.614,00 EUR"], ["Top Kunde", "Meridian Studio"], ["Naechster Kontakt", "Heute 15:30"]],
    actions: [["Kunde anlegen", "/dashboard-v2/customers?q=Kunde%20vorbereitet"], ["Kundenliste", "/dashboard-v2/customers?q=Kundenliste%20geoeffnet"], ["Segment pruefen", "/dashboard-v2/customers?q=Segment%20geprueft"]],
    timeline: [["Kontakt aktualisiert", "Daniel hat Ansprechpartner und Zahlungsziel angepasst."], ["Projekt verknuepft", "Website Redesign wurde Meridian Studio zugeordnet."], ["Bonitaet geprueft", "Kundenrisiko bleibt im gruenen Bereich."]],
    primaryHref: "/dashboard-v2/customers?q=Kunde%20vorbereitet"
  },
  projects: {
    stats: [["18", "Projekte"], ["8", "In Arbeit"], ["74%", "Auslastung"]],
    rows: [["Website Redesign", "Phase 2 aktiv", "78%", "Aktiv"], ["Brand Portal", "Review offen", "42%", "Review"], ["DATEV Export", "Bereit fuer Abnahme", "100%", "Fertig"]],
    focus: [["Abrechenbare Zeit", "126 h"], ["Budget offen", "8.430,00 EUR"], ["Naechster Meilenstein", "Freitag"]],
    actions: [["Projekt anlegen", "/dashboard-v2/projects?q=Projekt%20vorbereitet"], ["Projektliste", "/dashboard-v2/projects?q=Projektliste%20geoeffnet"], ["Budget pruefen", "/dashboard-v2/projects?q=Budget%20geprueft"]],
    timeline: [["Meilenstein bewegt", "Phase 2 wurde in Review verschoben."], ["Budgetwarnung", "Brand Portal liegt bei 82% des geplanten Budgets."], ["Freigabe erhalten", "DATEV Export kann final abgerechnet werden."]],
    primaryHref: "/dashboard-v2/projects?q=Projekt%20vorbereitet"
  },
  invoices: {
    stats: [["42", "Rechnungen"], ["11", "Ueberfaellig"], ["86%", "Zahlungsquote"]],
    rows: invoices.map(([number, customer, status, amount]) => [number, customer, amount, status]) as ModuleRow[],
    focus: [["Faellig diese Woche", "1.676,00 EUR"], ["Automatische Mahnungen", "7 aktiv"], ["Naechster Versand", "Heute 16:00"]],
    actions: [["Rechnung vorbereiten", "/dashboard-v2/invoices?q=Rechnung%20vorbereitet"], ["Rechnung erstellen", "/dashboard-v2/invoices?q=Rechnung%20neu%20vorbereitet"], ["Zahlung pruefen", "/dashboard-v2/reports?q=Zahlung%20geprueft"]],
    timeline: [["Rechnung erstellt", "OF-2026-5001 wurde fuer Meridian Studio vorbereitet."], ["Zahlung erkannt", "719,05 EUR von Aurora Labs wurden zugeordnet."], ["Mahnung geplant", "Pixel Perfect Ltd. erhaelt morgen eine Erinnerung."]],
    primaryHref: "/dashboard-v2/invoices?q=Rechnung%20vorbereitet"
  },
  offers: {
    stats: [["16", "Angebote"], ["9", "Offen"], ["41%", "Annahmequote"]],
    rows: [["OF-2026-5001", "Meridian Studio GmbH", "1.320,00 EUR", "Entwurf"], ["OF-2026-4997", "Pixel Perfect Ltd.", "1.147,00 EUR", "Offen"], ["OF-2026-4992", "Urban Commerce Inc.", "2.840,00 EUR", "Review"]],
    focus: [["Pipeline", "12.640,00 EUR"], ["Entwuerfe", "5"], ["Ablauf in 7 Tagen", "3"]],
    actions: [["Angebot vorbereiten", "/dashboard-v2/offers?q=Angebot%20vorbereitet"], ["Angebot erstellen", "/dashboard-v2/offers?q=Angebot%20neu%20vorbereitet"], ["Pipeline pruefen", "/dashboard-v2/offers?q=Pipeline%20geprueft"]],
    timeline: [["Angebot versendet", "Pixel Perfect Ltd. hat Version 3 erhalten."], ["Preisposition geaendert", "Hosting wurde als optionale Position markiert."], ["Annahme erwartet", "Meridian Studio will bis Freitag entscheiden."]],
    primaryHref: "/dashboard-v2/offers?q=Angebot%20vorbereitet"
  },
  time: {
    stats: [["126 h", "Erfasst"], ["34 h", "Abrechenbar"], ["91%", "Freigegeben"]],
    rows: [["Website Redesign", "Daniel und Sarah", "18:40 h", "Laeuft"], ["Brand Portal", "Julia", "07:15 h", "Pruefung"], ["Support Retainer", "Thomas", "04:30 h", "Bereit"]],
    focus: [["Aktiver Timer", "01:24:18"], ["Heute erfasst", "6:45 h"], ["Nicht abgerechnet", "34 h"]],
    actions: [["Timer starten", "/dashboard-v2/time?q=Timer%20gestartet"], ["Zeit buchen", "/dashboard-v2/time?q=Zeit%20gebucht"], ["Freigabe senden", "/dashboard-v2/invoices?q=Freigabe%20vorbereitet"]],
    timeline: [["Timer gestartet", "Daniel arbeitet an Website Redesign."], ["Zeit freigegeben", "Sarahs Eintrag wurde fuer Abrechnung markiert."], ["Monatsabschluss", "Mai-Zeiten sind bereit fuer Rechnungen."]],
    primaryHref: "/dashboard-v2/time?q=Timer%20gestartet"
  },
  expenses: {
    stats: [["528,99", "Ausgaben"], ["12", "Belege"], ["100%", "Zuordnung"]],
    rows: [["Adobe Creative Cloud", "Software", "71,39 EUR", "Bezahlt"], ["Hetzner Cloud", "Hosting", "43,20 EUR", "Verbucht"], ["DB Reise", "Projektkosten", "128,40 EUR", "Pruefung"]],
    focus: [["Monatliches Budget", "2.000,00 EUR"], ["Erstattungen offen", "214,20 EUR"], ["DATEV bereit", "10 Belege"]],
    actions: [["Ausgabe erfassen", "/dashboard-v2/expenses?q=Ausgabe%20erfasst"], ["Beleg hochladen", "/dashboard-v2/expenses?q=Beleg%20hochgeladen"], ["Export starten", "/dashboard-v2/expenses?q=DATEV%20vorbereitet"]],
    timeline: [["Beleg erkannt", "OCR hat Kategorie und Betrag automatisch gesetzt."], ["Kostenstelle gesetzt", "Hosting wurde Projekt Website Redesign zugeordnet."], ["Export vorbereitet", "10 Belege sind DATEV-kompatibel."]],
    primaryHref: "/dashboard-v2/expenses?q=Ausgabe%20erfasst"
  },
  articles: {
    stats: [["6", "Artikel"], ["CSV", "Export"], ["API", "Import"]],
    rows: [["Premium Beratung", "Dienstleistung", "149,00 EUR", "Aktiv"], ["Wartungspaket", "Service", "89,00 EUR", "Aktiv"], ["Lizenz Setup", "Software", "249,00 EUR", "Aktiv"]],
    focus: [["Import", "CSV/Bulk"], ["Export", "Preisliste"], ["Vorlage", "Bereit"]],
    actions: [["Artikel importieren", "/dashboard-v2/articles?q=Artikel%20importiert"], ["CSV Export", "/dashboard-v2/articles?q=Artikel%20exportiert"], ["Vorlage laden", "/dashboard-v2/articles?q=Artikel%20Vorlage"]],
    timeline: [["Artikelimport bereit", "CSV-Zeilen koennen direkt gespeichert werden."], ["Export aktiv", "Preisliste wird als CSV erzeugt."], ["Vorlage bereit", "Importstruktur ist downloadbar."]],
    primaryHref: "/dashboard-v2/articles?q=Artikel%20importieren"
  },
  reports: {
    stats: [["18%", "Wachstum"], ["34%", "Marge"], ["12", "Reports"]],
    rows: [["Cashflow Juni", "Umsatz und Ausgaben", "+1.860,00 EUR", "Bereit"], ["Kundenwert", "Top 10 Kunden", "8.420,00 EUR", "Aktuell"], ["Steuerreport", "USt-Voranmeldung", "Pruefen", "Offen"]],
    focus: [["Umsatz YTD", "48.920,00 EUR"], ["Kosten YTD", "18.110,00 EUR"], ["Prognose", "+22%"]],
    actions: [["Report exportieren", "/dashboard-v2/reports?q=Report%20exportiert"], ["DATEV Export", "/dashboard-v2/reports?q=DATEV%20vorbereitet"], ["Finanzbericht", "/dashboard-v2/reports?q=Finanzbericht%20erstellt"], ["Vergleich oeffnen", "/dashboard-v2/reports?q=Vergleich%20geoeffnet"]],
    timeline: [["Report erstellt", "Cashflow Juni wurde aktualisiert."], ["Abweichung erkannt", "Ausgaben liegen 8% unter Prognose."], ["Export geplant", "Steuerreport wird Freitag vorbereitet."]],
    primaryHref: "/dashboard-v2/reports?q=Report%20exportiert"
  },
  settings: {
    stats: [["9", "Bereiche"], ["3", "Pruefen"], ["100%", "Gesichert"]],
    rows: [["Unternehmen", "Acme GmbH", "Vollstaendig", "Aktiv"], ["Nummernkreise", "RE-2026 und OF-2026", "Synchron", "Aktiv"], ["E-Mail Versand", "SMTP verbunden", "OK", "Aktiv"]],
    focus: [["Portal", "Aktiv"], ["Sprache", "Deutsch"], ["Sicherheit", "2FA empfohlen"]],
    actions: [["Firma bearbeiten", "/dashboard-v2/settings?q=Firma%20geprueft"], ["Nummernkreis pruefen", "/dashboard-v2/settings?q=Nummernkreis%20geprueft"], ["Portal oeffnen", "/dashboard-v2/settings?q=Portal%20geoeffnet"]],
    timeline: [["SMTP getestet", "Versandadresse ist erreichbar."], ["Logo aktualisiert", "Premium Branding wurde gespeichert."], ["Backup gesetzt", "Systemeinstellungen wurden versioniert."]],
    primaryHref: "/dashboard-v2/settings?q=Firma%20geprueft"
  },
  users: {
    stats: [["5/5", "Benutzer"], ["3", "Rollen"], ["2FA", "Empfohlen"]],
    rows: users.map(([name, role]) => [name, role, "Aktiv", role === "Administrator" ? "Owner" : "Team"]) as ModuleRow[],
    focus: [["Admin", "Daniel"], ["Lizenzlimit", "5 Benutzer"], ["Letzter Login", "Heute"]],
    actions: [["Benutzer einladen", "/dashboard-v2/users?q=Benutzer%20eingeladen"], ["Rolle bearbeiten", "/dashboard-v2/users?q=Rolle%20vorbereitet"], ["2FA pruefen", "/account/security"]],
    timeline: [["Einladung vorbereitet", "Neuer Benutzer kann per E-Mail eingeladen werden."], ["Rolle geaendert", "Sarah ist Manager mit Projektfreigaben."], ["Sicherheitshinweis", "2FA fuer Buchhaltung empfohlen."]],
    primaryHref: "/dashboard-v2/users?q=Benutzer%20eingeladen"
  },
  license: {
    stats: [["Free", "Tarif"], ["100", "Rechnungen"], ["1 GB", "Speicher"]],
    rows: [["Benutzerlimit", "5 von 5 verwendet", "Voll", "Limit"], ["Dokumente im Workspace", "Geladene Dokumente", "Lokal", "Aktiv"], ["Speicher", "Nicht gemessen", "Lokal", "Info"]],
    focus: [["Upgrade Vorteil", "Unbegrenzt"], ["Premium Support", "Enthalten"], ["Aktivierung", "Lizenz-Key"]],
    actions: [["Lizenz aktivieren", "/dashboard-v2/license?q=Lizenz-Key"], ["Demo-Key pruefen", "/dashboard-v2/license?q=Lizenz%20aktiviert"], ["Benutzerlimit", "/dashboard-v2/license?q=Benutzerlimit"]],
    timeline: [["Limit erreicht", "Kostenloser Plan ist vollstaendig ausgereizt."], ["Upgrade vorbereitet", "Premium schaltet unbegrenzte Benutzer frei."], ["Abrechnung bereit", "Lizenzdaten koennen hinterlegt werden."]],
    primaryHref: "/dashboard-v2/license?q=Lizenz-Key"
  },
  "license-admin": {
    stats: [["5", "Verkaufsplaene"], ["Signiert", "Key-Modus"], ["Intern", "Zugriff"]],
    rows: [["Free", "Basisplan", "5 Benutzer", "Aktiv"], ["Pro", "Wachstum", "15 Benutzer", "Aktiv"], ["Team", "Agentur", "25 Benutzer", "Aktiv"], ["Business", "Firma", "50 Benutzer", "Aktiv"]],
    focus: [["Standard", "Pro 15"], ["Aktivierung", "Kunde traegt Key ein"], ["Speicherung", "Hash + Preview"]],
    actions: [["Key erzeugen", "/dashboard-v2/license-admin?q=Key%20erzeugen"], ["Ausgaben laden", "/dashboard-v2/license-admin?q=Ausgaben"], ["Zur Lizenz", "/dashboard-v2/license"]],
    timeline: [["Key erzeugt", "Vollstaendiger Key wird nur einmal angezeigt."], ["Key geprueft", "Signatur und Laufzeit werden serverseitig validiert."], ["Key aktiviert", "Lizenzlimit wird im Workspace aktualisiert."]],
    primaryHref: "/dashboard-v2/license-admin?q=Key%20erzeugen"
  },
  integrations: {
    stats: [["6", "Verbunden"], ["2", "Aktion noetig"], ["99%", "Sync"]],
    rows: integrations.slice(0, 4).map(([name, meta]) => [name, meta, "Verbunden", "Aktiv"]) as ModuleRow[],
    focus: [["Zahlungen", "Stripe, PayPal"], ["Buchhaltung", "DATEV"], ["Automation", "Zapier"]],
    actions: [["Integration verbinden", "/dashboard-v2/integrations?q=Integration%20verbunden"], ["Sync pruefen", "/dashboard-v2/integrations?q=Sync%20geprueft"], ["Token erneuern", "/dashboard-v2/api?q=Token%20vorbereitet"]],
    timeline: [["Stripe synchronisiert", "Neue Zahlung wurde automatisch zugeordnet."], ["DATEV Export bereit", "Buchhaltungsdaten sind vorbereitet."], ["Zapier aktiv", "Webhook fuer neue Rechnung feuert korrekt."]],
    primaryHref: "/dashboard-v2/integrations?q=Integration%20verbunden"
  },
  automation: {
    stats: [["14", "Workflows"], ["9", "Aktiv"], ["312", "Runs"]],
    rows: [["Mahnung nach 7 Tagen", "Rechnungen", "9 Runs", "Aktiv"], ["Monatsreport senden", "Berichte", "1 Run", "Geplant"], ["Beleg automatisch taggen", "Ausgaben", "42 Runs", "Aktiv"]],
    focus: [["Gesparte Zeit", "18 h"], ["Fehlerquote", "0,8%"], ["Naechster Run", "Morgen 08:00"]],
    actions: [["Workflow erstellen", "/dashboard-v2/automation?q=Workflow%20erstellt"], ["Regel testen", "/dashboard-v2/automation?q=Workflow%20getestet"], ["Run Verlauf", "/dashboard-v2/audit?q=Workflow"]],
    timeline: [["Mahnlauf ausgefuehrt", "3 Kunden wurden automatisch erinnert."], ["Regel getestet", "Belegtagging erkennt Softwarekosten."], ["Workflow pausiert", "Alter Export wurde deaktiviert."]],
    primaryHref: "/dashboard-v2/automation?q=Workflow%20erstellt"
  },
  notifications: {
    stats: [["12", "Neu"], ["4", "Wichtig"], ["0", "Kritisch"]],
    rows: [["Zahlung erhalten", "Aurora Labs GmbH", "719,05 EUR", "Neu"], ["Rechnung ueberfaellig", "Pixel Perfect Ltd.", "1.147,00 EUR", "Wichtig"], ["Projekt aktualisiert", "Website Redesign", "Phase 2", "Info"]],
    focus: [["Inbox", "12 Meldungen"], ["Heute", "6 Ereignisse"], ["Regeln", "8 aktiv"]],
    actions: [["Regeln bearbeiten", "/dashboard-v2/notifications?q=Regeln%20aktualisiert"], ["Alle gelesen", "/dashboard-v2/notifications?q=Alle%20gelesen"], ["Filter setzen", "/dashboard-v2/notifications?q=Filter%20aktiv"]],
    timeline: [["Push gesendet", "Daniel wurde ueber Zahlung informiert."], ["Regel angewendet", "Ueberfaellige Rechnung markiert."], ["Benachrichtigung geplant", "Tagesbericht wird um 18:00 gesendet."]],
    primaryHref: "/dashboard-v2/notifications?q=Regeln%20aktualisiert"
  },
  audit: {
    stats: [["248", "Events"], ["0", "Risiken"], ["30 T", "Aufbewahrung"]],
    rows: [["Daniel", "Rechnung exportiert", "OF-2026-5001", "Heute"], ["Sarah", "Kunde bearbeitet", "Aurora Labs", "Heute"], ["System", "Webhook ausgeliefert", "invoice.created", "Gestern"]],
    focus: [["Sicherheitsstatus", "Gruen"], ["Letzter Export", "Heute"], ["Admin Aktionen", "14"]],
    actions: [["Audit exportieren", "/dashboard-v2/audit?q=Audit%20exportiert"], ["Filter setzen", "/dashboard-v2/audit?q=Audit%20Filter%20aktiv"], ["Ereignis suchen", "/dashboard-v2/audit?q=Ereignis%20gefunden"]],
    timeline: [["Export protokolliert", "PDF-Download wurde im Audit gespeichert."], ["Zugriff erlaubt", "Sarah hat Kundenprofil geoeffnet."], ["Webhook signiert", "Event wurde erfolgreich ausgeliefert."]],
    primaryHref: "/dashboard-v2/audit?q=Audit%20exportiert"
  },
  api: {
    stats: [["3", "Keys"], ["8", "Webhooks"], ["99.9%", "Uptime"]],
    rows: [["invoice.created", "Webhook", "200 OK", "Aktiv"], ["payment.received", "Webhook", "200 OK", "Aktiv"], ["customer.updated", "Webhook", "Retry 1", "Pruefung"]],
    focus: [["Rate Limit", "18% genutzt"], ["Letzter Fehler", "Gestern"], ["Signaturen", "Aktiv"]],
    actions: [["Webhook erstellen", "/dashboard-v2/api?q=Webhook%20erstellt"], ["API-Key rotieren", "/dashboard-v2/api?q=API-Key%20rotiert"], ["Logs oeffnen", "/dashboard-v2/audit?q=Webhook%20Logs"]],
    timeline: [["Webhook ausgeliefert", "invoice.created wurde in 184 ms bestaetigt."], ["Key rotiert", "Alter Schluessel wurde deaktiviert."], ["Retry geplant", "customer.updated wird erneut gesendet."]],
    primaryHref: "/dashboard-v2/api?q=Webhook%20erstellt"
  }
}

function chartCoordinates(values: number[], height: number, maxValue: number) {
  const max = Math.max(maxValue, 1)
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100
    const y = height - (value / max) * (height - 12) - 4
    return { x, y }
  })
}

function linePoints(values: number[], height: number, maxValue: number) {
  return chartCoordinates(values, height, maxValue).map((point) => `${point.x},${point.y}`).join(" ")
}

function readStoredPremiumTheme() {
  try {
    const savedMode = window.localStorage.getItem(PREMIUM_THEME_STORAGE_KEY)
    return savedMode === "light" || savedMode === "dark" ? savedMode : null
  } catch {
    return null
  }
}

function storePremiumTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(PREMIUM_THEME_STORAGE_KEY, mode)
  } catch {
    // Theme switching must still work in restricted browser contexts.
  }
}

function premiumViewPath(view: PremiumView) {
  return view === "dashboard" ? "/dashboard-v2" : `/dashboard-v2/${view}`
}

function premiumThemeHref(path: string, theme: ThemeMode, query: string) {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  params.set("theme", theme)
  return `${path}?${params.toString()}`
}

function withPremiumTheme(href: string, theme: ThemeMode) {
  if (!href.startsWith("/dashboard-v2")) return href

  const [path, queryString = ""] = href.split("?")
  const params = new URLSearchParams(queryString)
  params.set("theme", theme)
  return `${path}?${params.toString()}`
}

function ThemeToggle({ links, mode, onChange }: { links: ThemeLinks; mode: ThemeMode; onChange: (mode: ThemeMode) => void }) {
  return (
    <div className={styles.themeToggle} aria-label="Theme wechseln">
      <Link href={links.light} aria-pressed={mode === "light"} className={mode === "light" ? styles.activeToggle : ""} onClick={() => onChange("light")}>Hell</Link>
      <Link href={links.dark} aria-pressed={mode === "dark"} className={mode === "dark" ? styles.activeToggle : ""} onClick={() => onChange("dark")}>Dark</Link>
    </div>
  )
}

function Topbar({ mode, profile, searchInputRef, searchQuery, themeLinks, unreadCount, workspace, onModeChange, onSearchChange }: { mode: ThemeMode; profile: ReturnType<typeof profileFromData>; searchInputRef: RefObject<HTMLInputElement | null>; searchQuery: string; themeLinks: ThemeLinks; unreadCount: number; workspace: ReturnType<typeof workspaceFromData>; onModeChange: (mode: ThemeMode) => void; onSearchChange: (value: string) => void }) {
  const pathname = usePathname()

  return (
    <header className={styles.topbar}>
      <Link className={styles.topBrand} href={withPremiumTheme("/dashboard-v2", mode)} aria-label="DreamInvoice Dashboard">
        <span className={styles.logoMark}>D</span>
        <span><strong>DreamInvoice</strong><small>{workspace.name}</small></span>
      </Link>
      <div className={styles.searchBox}><Search size={16} /><input ref={searchInputRef} value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Suche..." aria-label="Premium Suche" />{searchQuery ? <Link href={withPremiumTheme(pathname, mode)} aria-label="Suche leeren" onClick={() => onSearchChange("")}><X size={15} /></Link> : null}</div>
      <nav className={styles.desktopNav} aria-label="Hauptnavigation">{topNav.map((item) => { const isActive = pathname === item.href; return <Link key={item.label} className={isActive ? styles.navActive : ""} aria-current={isActive ? "page" : undefined} href={withPremiumTheme(item.href, mode)}>{item.label}</Link> })}</nav>
      <div className={styles.topActions}>
        <ThemeToggle links={themeLinks} mode={mode} onChange={onModeChange} />
        <Link href={withPremiumTheme("/dashboard-v2/invoices/new", mode)} aria-label="Neu"><Plus size={18} /></Link>
        <Link href={withPremiumTheme("/dashboard-v2/notifications?q=Alle%20gelesen", mode)} aria-label="Benachrichtigungen" className={styles.bellButton}><Bell size={18} />{unreadCount > 0 ? <span>{unreadCount}</span> : null}</Link>
        <div className={styles.adminMenu}>
          <button type="button" aria-label="Navigation und Einstellungen"><Settings size={18} /></button>
          <div className={styles.adminMenuPanel}>
            {sideNav.map((group) => <div key={group.section} className={styles.adminMenuGroup}><p>{group.section}</p>{group.items.map((item) => { const Icon = item.icon; const isActive = pathname === item.href; const badge = item.label === "Benachrichtigungen" ? unreadCount : 0; return <Link key={item.label} href={withPremiumTheme(item.href, mode)} aria-current={isActive ? "page" : undefined} className={isActive ? styles.adminMenuActive : ""}><Icon size={16} /><span>{item.label}</span>{badge > 0 ? <em>{badge}</em> : null}</Link> })}</div>)}
          </div>
        </div>
        <Link href={withPremiumTheme("/dashboard-v2/settings?q=Portal%20geoeffnet", mode)} aria-label="Hilfe"><HelpCircle size={18} /></Link>
        <div className={styles.profile}><span>{profile.initials}</span><div><strong>{profile.name}</strong><small>{profile.role}</small></div></div>
      </div>
    </header>
  )
}

function CompactNav({ mode, unreadCount }: { mode: ThemeMode; unreadCount: number }) {
  const pathname = usePathname()
  const compactItems: NavItem[] = [
    mainNav[0],
    mainNav[1],
    mainNav[2],
    mainNav[3],
    mainNav[7],
    sideNav[1].items[0],
    sideNav[1].items[1],
    sideNav[2].items[0],
    sideNav[2].items[2]
  ]

  return (
    <nav className={styles.compactNav} aria-label="Mobile Premium Navigation">
      {compactItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        const badge = item.label === "Benachrichtigungen" ? unreadCount : 0

        return <Link key={item.href} href={withPremiumTheme(item.href, mode)} aria-current={isActive ? "page" : undefined} className={isActive ? styles.compactNavActive : ""}><Icon size={16} /><span>{item.label}</span>{badge > 0 ? <em>{badge}</em> : null}</Link>
      })}
    </nav>
  )
}

function KpiGrid({ data, mode }: { data: PremiumData; mode: ThemeMode }) {
  const source = data.invoices.length ? data.invoices : fallbackApiInvoices
  const invoiceSource = source.filter((invoice) => invoiceType(invoice) === "invoice")
  const offerSource = source.filter((invoice) => invoiceType(invoice) === "offer")
  const openAmount = invoiceSource.filter((invoice) => isStatus(invoice.status, "open")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const paidAmount = invoiceSource.filter((invoice) => isStatus(invoice.status, "paid")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const overdueAmount = invoiceSource.filter((invoice) => isStatus(invoice.status, "overdue")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const offerAmount = offerSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const liveKpis = source.length ? [
    { label: "Offene Rechnungen", value: formatEuro(openAmount), detail: `${invoiceSource.filter((invoice) => isStatus(invoice.status, "open")).length} Dokumente`, tone: "violet" as Tone, icon: Receipt, href: "/dashboard-v2/invoices?q=Rechnung%20vorbereitet" },
    { label: "Bezahlt", value: formatEuro(paidAmount), detail: data.loaded ? "Live synchronisiert" : "+18% vs. Vormonat", tone: "green" as Tone, icon: Briefcase, href: "/dashboard-v2/reports?q=Zahlung%20geprueft" },
    { label: "Ueberfaellig", value: formatEuro(overdueAmount), detail: `${invoiceSource.filter((invoice) => isStatus(invoice.status, "overdue")).length} Dokumente`, tone: "rose" as Tone, icon: AlertCircle, href: "/dashboard-v2/invoices?q=Freigabe%20vorbereitet" },
    { label: "Angebote", value: formatEuro(offerAmount), detail: `${offerSource.length} Dokumente`, tone: "blue" as Tone, icon: Tag, href: "/dashboard-v2/offers?q=Angebot%20vorbereitet" },
    { label: "Kunden", value: String(data.customers.length || 4), detail: data.loaded ? "Live synchronisiert" : "Lokale Daten", tone: "amber" as Tone, icon: Users, href: "/dashboard-v2/customers?q=Segment%20geprueft" }
  ] : kpis.map((item) => ({ ...item, href: item.label === "Angebote" ? "/dashboard-v2/offers?q=Angebot%20vorbereitet" : item.label === "Ausgaben" ? "/dashboard-v2/expenses?q=Ausgabe%20erfasst" : "/dashboard-v2/invoices?q=Rechnung%20vorbereitet" }))

  return <section className={styles.kpiGrid}>{liveKpis.map((item) => { const Icon = item.icon; return <Link key={item.label} href={withPremiumTheme(item.href, mode)} className={`${styles.panel} ${styles.kpiCard}`} data-tone={item.tone}><div className={styles.kpiIcon}><Icon size={22} /></div><div><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div><MoreVertical size={17} className={styles.moreIcon} /></Link> })}</section>
}

function RevenueChart({ data, mode }: { data: PremiumData; mode: ThemeMode }) {
  const chartHeight = 155
  const series = useMemo(() => buildMonthlySeries(data), [data])
  const chartMax = useMemo(() => Math.max(...series.revenue, ...series.payments, ...series.expenses, 1), [series.expenses, series.payments, series.revenue])
  const revenueCoordinates = useMemo(() => chartCoordinates(series.revenue, chartHeight, chartMax), [chartMax, series.revenue])
  const paymentCoordinates = useMemo(() => chartCoordinates(series.payments, chartHeight, chartMax), [chartMax, series.payments])
  const expenseCoordinates = useMemo(() => chartCoordinates(series.expenses, chartHeight, chartMax), [chartMax, series.expenses])
  const revenuePoints = useMemo(() => linePoints(series.revenue, chartHeight, chartMax), [chartMax, series.revenue])
  const paymentPoints = useMemo(() => linePoints(series.payments, chartHeight, chartMax), [chartMax, series.payments])
  const expensePoints = useMemo(() => linePoints(series.expenses, chartHeight, chartMax), [chartMax, series.expenses])
  const latestIndex = Math.max(series.labels.length - 1, 0)
  const chartMarkers = [
    { tone: "violet", point: revenueCoordinates[latestIndex] },
    { tone: "green", point: paymentCoordinates[latestIndex] },
    { tone: "amber", point: expenseCoordinates[latestIndex] }
  ]

  return (
    <article className={`${styles.panel} ${styles.revenuePanel}`}>
      <div className={styles.panelHead}><div><h2>Umsatzuebersicht</h2><span>Umsaetze, Zahlungen und Ausgaben</span></div><Link href={withPremiumTheme("/dashboard-v2/reports?q=Vergleich%20geoeffnet", mode)}>Letzte 12 Monate <ChevronDown size={14} /></Link></div>
      <div className={styles.legend}><span data-color="violet">Umsatz</span><span data-color="green">Zahlungen</span><span data-color="amber">Ausgaben</span></div>
      <div className={styles.chartArea} tabIndex={0} aria-label="Umsatzdiagramm mit Tooltip"><svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" aria-label="Umsatzdiagramm"><polyline points={revenuePoints} className={styles.revenueLine} /><polyline points={paymentPoints} className={styles.paymentLine} /><polyline points={expensePoints} className={styles.expenseLine} />{chartMarkers.map(({ tone, point }) => point ? <circle key={tone} cx={point.x} cy={point.y} r="1.8" className={styles.chartDot} data-tone={tone} /> : null)}</svg><div className={styles.chartTooltip}><strong>{series.labels[latestIndex]} {series.years[latestIndex]}</strong><span><i />Umsatz <b>{formatEuro(series.revenue[latestIndex] || 0)}</b></span><span><i />Zahlungen <b>{formatEuro(series.payments[latestIndex] || 0)}</b></span><span><i />Ausgaben <b>{formatEuro(series.expenses[latestIndex] || 0)}</b></span></div><div className={styles.monthLabels}>{series.labels.map((month, index) => <span key={`${month}-${index}`}>{month}</span>)}</div></div>
    </article>
  )
}

function StatusPanel({ data, mode }: { data: PremiumData; mode: ThemeMode }) {
  const source = (data.invoices.length ? data.invoices : fallbackApiInvoices).filter((invoice) => invoiceType(invoice) === "invoice")
  const statusItems = [
    ["Bezahlt", "green", source.filter((invoice) => isStatus(invoice.status, "paid")).length, "/dashboard-v2/invoices?q=Bezahlt"],
    ["Offen", "blue", source.filter((invoice) => isStatus(invoice.status, "open")).length, "/dashboard-v2/invoices?q=Offen"],
    ["Ueberfaellig", "rose", source.filter((invoice) => isStatus(invoice.status, "overdue")).length, "/dashboard-v2/invoices?q=Ueberfaellig"],
    ["Entwurf", "muted", source.filter((invoice) => isStatus(invoice.status, "draft")).length, "/dashboard-v2/invoices?q=Entwurf"]
  ] as const
  const total = statusItems.reduce((sum, item) => sum + item[2], 0) || source.length || 1

  return <article className={`${styles.panel} ${styles.statusPanel}`}><div className={styles.panelHead}><h2>Rechnungsstatus</h2></div><div className={styles.donutWrap}><Link href={withPremiumTheme("/dashboard-v2/invoices", mode)} className={styles.donut}><div><strong>{total}</strong><span>Gesamt</span></div></Link><div className={styles.statusLegend}>{statusItems.map(([label, tone, count, href]) => <Link key={label} href={withPremiumTheme(href, mode)}><span data-tone={tone} />{label}<b>{count} ({Math.round((count / total) * 100)}%)</b></Link>)}</div></div></article>
}

function QuickActions({ mode, profile }: { mode: ThemeMode; profile: ReturnType<typeof profileFromData> }) {
  const actions: Array<{ label: string; icon: IconType; tone: string; href: string }> = [
    { label: "Neue Rechnung", icon: FileText, tone: "violet", href: "/dashboard-v2/invoices?q=Rechnung%20vorbereitet" },
    { label: "Neuer Kunde", icon: UserPlus, tone: "blue", href: "/dashboard-v2/customers?q=Kunde%20vorbereitet" },
    { label: "Neues Projekt", icon: Folder, tone: "green", href: "/dashboard-v2/projects?q=Projekt%20vorbereitet" },
    { label: "Angebot erstellen", icon: Tag, tone: "amber", href: "/dashboard-v2/offers?q=Angebot%20vorbereitet" },
    { label: "Zeiterfassung starten", icon: Clock3, tone: "rose", href: "/dashboard-v2/time?q=Timer%20gestartet" },
    { label: "Ausgabe erfassen", icon: Wallet, tone: "green", href: "/dashboard-v2/expenses?q=Ausgabe%20erfasst" }
  ]
  return <article className={`${styles.panel} ${styles.quickPanel}`}><div className={styles.robot}>AI</div><div className={styles.panelHead}><div><h2>Schnellaktionen</h2><span>Hallo {profile.name}. Was moechten Sie heute erledigen?</span></div></div><div className={styles.quickGrid}>{actions.map((action) => { const Icon = action.icon; return <Link key={action.label} href={withPremiumTheme(action.href, mode)} data-tone={action.tone}><Icon size={19} /><span>{action.label}</span></Link> })}</div></article>
}

function InvoiceTable({ data, mode, searchQuery }: { data: PremiumData; mode: ThemeMode; searchQuery: string }) {
  const rows = invoiceRowsFromData(data).filter((row) => matchesSearch(row, searchQuery))
  return <article className={`${styles.panel} ${styles.tablePanel}`}><div className={styles.panelHead}><h2>Kuerzlich erstellte Rechnungen</h2><Link href={withPremiumTheme("/dashboard-v2/invoices", mode)}>Alle anzeigen</Link></div><div className={styles.tableScroll}><table><thead><tr><th>Rechnung</th><th>Kunde</th><th>Status</th><th>Betrag</th><th>Datum</th></tr></thead><tbody>{rows.length ? rows.map(([number, customer, status, amount, date]) => <tr key={number}><td><Link href={withPremiumTheme(`/dashboard-v2/invoices?q=${encodeURIComponent(number)}`, mode)}>{number}</Link></td><td>{customer}</td><td><Link href={withPremiumTheme(`/dashboard-v2/invoices?q=${encodeURIComponent(status)}`, mode)} data-status={status}>{status}</Link></td><td>{amount}</td><td>{date}</td></tr>) : <tr><td colSpan={5} className={styles.emptyTableCell}>Keine Treffer</td></tr>}</tbody></table></div></article>
}

function BarPanel({ data, mode }: { data: PremiumData; mode: ThemeMode }) {
  const series = useMemo(() => buildMonthlySeries(data), [data])
  const maxValue = Math.max(...series.revenue, ...series.expenses, 1)

  return <article className={`${styles.panel} ${styles.barPanel}`}><div className={styles.panelHead}><h2>Einnahmen & Ausgaben</h2><Link href={withPremiumTheme("/dashboard-v2/reports?q=Vergleich%20geoeffnet", mode)}>Monatlich <ChevronDown size={14} /></Link></div><div className={styles.barChart}>{series.labels.map((label, index) => <div key={label} className={styles.barGroup}><div><span className={styles.incomeBar} style={{ height: `${Math.max(18, (series.revenue[index] / maxValue) * 122)}px` }} /><span className={styles.spendBar} style={{ height: `${Math.max(12, (series.expenses[index] / maxValue) * 122)}px` }} /></div><small>{label}</small></div>)}</div><div className={styles.legend}><span data-color="violet">Einnahmen</span><span data-color="amber">Ausgaben</span></div></article>
}

function ActivityFeed({ data, mode }: { data: PremiumData; mode: ThemeMode }) {
  const rows = notificationRows(data)
  return <article className={`${styles.panel} ${styles.activityPanel}`}><div className={styles.panelHead}><h2>Aktivitaetsfeed</h2><Link href={withPremiumTheme("/dashboard-v2/audit?q=Ereignis%20gefunden", mode)}>Alle anzeigen</Link></div><div className={styles.activityList}>{rows.map(([title, text, time, tone]) => <Link key={`${title}-${time}`} href={withPremiumTheme(`/dashboard-v2/audit?q=${encodeURIComponent(title)}`, mode)} className={styles.activityItem}><span data-tone={tone}><CheckCircle2 size={14} /></span><div><strong>{title}</strong><p>{text}</p></div><time>{time}</time></Link>)}</div></article>
}

function UsersPanel({ data, mode }: { data: PremiumData; mode: ThemeMode }) {
  const cards = userCardsFromData(data)
  const limit = userLimitFromData(data)
  const usageWidth = Math.min(100, Math.round((limit.currentUsers / Math.max(limit.maxUsers, 1)) * 100))
  return <article className={`${styles.panel} ${styles.usersPanel}`}><div className={styles.usersMeta}><h2>Benutzer & Rollen</h2><span>{limit.currentUsers}/{limit.maxUsers} Benutzer</span><div><i style={{ width: `${usageWidth}%` }} /></div><Link href={withPremiumTheme("/dashboard-v2/users?q=Benutzer%20eingeladen", mode)}>Benutzer verwalten</Link></div><div className={styles.userCards}>{cards.map(([name, role, initials, crown]) => <Link key={`${name}-${role}`} href={withPremiumTheme(`/dashboard-v2/users?q=${encodeURIComponent(name)}`, mode)} className={styles.userCard}><div className={styles.avatar}>{initials}</div>{crown ? <Crown size={15} /> : null}<strong>{name}</strong><span>{role}</span><em>Aktiv</em></Link>)}<Link href={withPremiumTheme("/dashboard-v2/users?q=Benutzer%20eingeladen", mode)} className={styles.addUser}><Plus size={24} /><span>Benutzer hinzufuegen</span></Link></div></article>
}

function LicensePanel({ data, mode }: { data: PremiumData; mode: ThemeMode }) {
  const limit = userLimitFromData(data)
  const documentCount = (data.invoices.length ? data.invoices : fallbackApiInvoices).length
  return <article className={`${styles.panel} ${styles.licensePanel}`}><div className={styles.panelHead}><h2>Lizenzstatus</h2><span className={styles.freeBadge}>{limit.plan}</span></div><div className={styles.licenseGrid}><div><span>Benutzer</span><b>{limit.currentUsers} / {limit.maxUsers}</b></div><div><span>Status</span><b>{limit.isFull ? "Limit erreicht" : "Aktiv"}</b></div><div><span>Dokumente</span><b>{documentCount}</b></div><div><span>Ablaufdatum</span><b>{limit.validUntil ? limit.validUntil.slice(0, 10) : "-"}</b></div></div><Link href={withPremiumTheme("/dashboard-v2/license?q=Lizenz-Key", mode)}><span>Lizenz / Upgrade aktivieren</span><KeyRound size={18} /></Link></article>
}

function IntegrationsPanel({ mode }: { mode: ThemeMode }) {
  return <article className={`${styles.panel} ${styles.integrationsPanel}`}><h2>Integrationen</h2><div className={styles.integrationsGrid}>{integrations.map(([name, meta, color]) => <Link key={name} href={withPremiumTheme(`/dashboard-v2/integrations?q=${encodeURIComponent(name)}`, mode)}><span style={{ backgroundColor: color }}>{name.charAt(0)}</span><strong>{name}</strong><small>{meta}</small></Link>)}<Link href={withPremiumTheme("/dashboard-v2/integrations?q=Integration%20verbunden", mode)} className={styles.moreIntegrationLink}><Grid3X3 size={18} />Mehr anzeigen</Link></div></article>
}

function SearchResultsPanel({ data, mode, searchQuery }: { data: PremiumData; mode: ThemeMode; searchQuery: string }) {
  if (isPremiumActionQuery(searchQuery)) return null

  const results = globalSearchResults(data, searchQuery)
  if (!searchQuery.trim()) return null

  return (
    <article className={`${styles.panel} ${styles.searchResultsPanel}`}>
      <div className={styles.panelHead}><div><h2>Suchtreffer</h2><span>{results.length ? `${results.length} Treffer fuer "${searchQuery}"` : `Keine Treffer fuer "${searchQuery}"`}</span></div><Link href={withPremiumTheme("/dashboard-v2", mode)}>Dashboard</Link></div>
      {results.length ? (
        <div className={styles.searchResultsGrid}>
          {results.map((result) => {
            const Icon = result.icon
            return <Link key={`${result.href}-${result.title}`} href={withPremiumTheme(result.href, mode)}><span><Icon size={17} /></span><strong>{result.title}</strong><small>{result.subtitle}</small></Link>
          })}
        </div>
      ) : (
        <div className={styles.emptySearchResult}><Search size={18} /><span>Suchbegriff pruefen oder einen anderen Bereich oeffnen.</span></div>
      )}
    </article>
  )
}

function DashboardOverview({ data, mode, profile, searchQuery }: { data: PremiumData; mode: ThemeMode; profile: ReturnType<typeof profileFromData>; searchQuery: string }) {
  const effectiveSearchQuery = premiumSearchQuery(searchQuery)

  return (
    <>
      <h1 className={styles.visuallyHidden}>Dashboard</h1>
      <KpiGrid data={data} mode={mode} />
      <SearchResultsPanel data={data} mode={mode} searchQuery={effectiveSearchQuery} />
      <section className={styles.mainGrid}><RevenueChart data={data} mode={mode} /><StatusPanel data={data} mode={mode} /><QuickActions mode={mode} profile={profile} /></section>
      <section className={styles.lowerGrid}><InvoiceTable data={data} mode={mode} searchQuery={effectiveSearchQuery} /><BarPanel data={data} mode={mode} /><ActivityFeed data={data} mode={mode} /></section>
      <section className={styles.bottomGrid}><UsersPanel data={data} mode={mode} /><LicensePanel data={data} mode={mode} /></section>
      <IntegrationsPanel mode={mode} />
    </>
  )
}

function moduleRows(view: Exclude<PremiumView, "dashboard">, data: PremiumData): ModuleRow[] {
  const customersSource = data.customers.length ? data.customers : fallbackApiCustomers
  const projectsSource = data.projects.length ? data.projects : fallbackProjects
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const usersSource = data.appUsers.length ? data.appUsers : fallbackAppUsers
  const notificationsSource = data.notifications.length ? data.notifications : fallbackNotifications
  const rangesSource = data.numberRanges.length ? data.numberRanges : fallbackNumberRanges

  if (view === "customers") {
    return customersSource.slice(0, 5).map((customer) => [
      customer.name,
      customer.email || customer.contact || customer.number || "Kundenprofil",
      customerStatusLabel(customer.status),
      data.customers.length ? "Live" : "Demo"
    ])
  }

  if (view === "invoices" || view === "offers") {
    const source = data.invoices.length ? data.invoices : fallbackApiInvoices
    return source
      .filter((invoice) => view === "offers" ? invoiceType(invoice) === "offer" : invoiceType(invoice) === "invoice")
      .slice(0, 5)
      .map((invoice) => [
        invoice.number,
        invoice.customer || "Unbekannt",
        formatEuro(Number(invoice.grossTotal) || 0),
        statusLabel(invoice.status)
      ])
  }

  if (view === "projects") {
    return projectsSource.slice(0, 5).map((project) => [
      project.name,
      project.customer,
      project.progress,
      project.status
    ])
  }

  if (view === "time") {
    return projectsSource.slice(0, 5).map((project) => [
      project.name,
      `${project.customer} · ${project.budget}`,
      `${Math.max(1, Math.round((parsePercent(project.progress) / 100) * 12))} h`,
      project.status
    ])
  }

  if (view === "expenses") {
    return articlesSource.slice(0, 5).map((article) => [
      article.name,
      article.category || "Leistung",
      formatEuro(Number(article.price) || 0),
      article.active === false ? "Inaktiv" : "Aktiv"
    ])
  }

  if (view === "articles") {
    return articlesSource.slice(0, 5).map((article) => [
      article.name,
      article.code || "Ohne Nummer",
      formatEuro(Number(article.price) || 0),
      article.active === false ? "Inaktiv" : "Aktiv"
    ])
  }

  if (view === "reports") {
    const source = data.invoices.length ? data.invoices : fallbackApiInvoices
    const invoiceTotal = source.filter((invoice) => invoiceType(invoice) === "invoice").reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    const offerTotal = source.filter((invoice) => invoiceType(invoice) === "offer").reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    const paidTotal = source.filter((invoice) => isStatus(invoice.status, "paid")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)

    return [
      ["Rechnungsumsatz", "Alle Rechnungen", formatEuro(invoiceTotal), "Live"],
      ["Angebotspipeline", "Offene Angebote und Entwuerfe", formatEuro(offerTotal), "Live"],
      ["Zahlungseingang", "Bezahlt markierte Rechnungen", formatEuro(paidTotal), "Live"]
    ]
  }

  if (view === "integrations") {
    return integrations.slice(0, 5).map(([name, meta]) => [
      name,
      meta,
      "Verbunden",
      "Aktiv"
    ])
  }

  if (view === "settings") {
    const company = data.companySettings ?? fallbackCompanySettings
    const primaryRange = rangesSource[0]
    return [
      ["Unternehmen", company.company || "Nicht gesetzt", company.email || "E-Mail offen", data.loaded ? "Synchron" : "Lokal"],
      ["Standort", [company.city, company.country].filter(Boolean).join(", ") || "Nicht gesetzt", "Firmendaten", company.company ? "Aktiv" : "Pruefen"],
      ["Nummernkreise", `${rangesSource.length} Bereiche`, primaryRange ? `${numberRangeLabel(primaryRange.type)} ab ${primaryRange.nextValue}` : "Nicht gesetzt", rangesSource.length ? "Synchron" : "Pruefen"]
    ]
  }

  if (view === "users") {
    return usersSource.slice(0, 5).map((user) => [
      user.name || user.email || "Benutzer",
      user.email || user.role || "Teammitglied",
      user.role || "member",
      userStatusLabel(user.status)
    ])
  }

  if (view === "license") {
    const limit = userLimitFromData(data)
    const documentCount = (data.invoices.length ? data.invoices : fallbackApiInvoices).length
    return [
      ["Benutzerlimit", `${limit.currentUsers} von ${limit.maxUsers} verwendet`, limit.plan, limit.isFull ? "Limit" : "OK"],
      ["Lizenz-Key", "Aktivierungsformular und Upload", "API bereit", "Aktiv"],
      ["Upgrade", "Tarif und Benutzerplaetze pruefen", limit.isFull ? "Empfohlen" : "Optional", limit.isFull ? "Noetig" : "Bereit"],
      ["Dokumente im Workspace", `${documentCount} geladen`, dataSourceLabel(data), "Aktiv"],
      ["Lizenzablauf", limit.validUntil ? limit.validUntil.slice(0, 10) : "Kein Ablaufdatum", "Status", limit.isFull ? "Upgrade" : "Aktiv"]
    ]
  }

  if (view === "notifications") {
    return notificationsSource.slice(0, 5).map((item) => [
      item.title,
      item.message || item.category || "Systemmeldung",
      item.category || "Info",
      notificationStatus(item)
    ])
  }

  if (view === "automation") {
    const rows: ModuleRow[] = rangesSource.slice(0, 5).map((range) => [
      `${numberRangeLabel(range.type)} Nummernkreis`,
      `Prefix ${range.prefix}`,
      `Naechste ${String(range.nextValue).padStart(range.padding, "0")}`,
      "Aktiv"
    ])
    return rows.length ? rows : [["Benachrichtigungsregeln", "Systemmeldungen", `${notificationsSource.length} Ereignisse`, notificationsSource.length ? "Bereit" : "Pruefen"]]
  }

  if (view === "audit") {
    return notificationsSource.slice(0, 5).map((item) => [
      item.title,
      item.message || item.category || "Ereignis",
      isNotificationRead(item) ? "Gelesen" : "Offen",
      notificationStatus(item)
    ])
  }

  if (view === "api") {
    const apiRows: ModuleRow[] = [
      ["GET /api/invoice/list", "Rechnungsdaten", data.invoices.length ? `${data.invoices.length} Datensaetze` : dataSourceLabel(data), data.loaded ? "Aktiv" : "Lokal"],
      ["GET /api/customers/list", "Kundendaten", data.customers.length ? `${data.customers.length} Datensaetze` : dataSourceLabel(data), data.loaded ? "Aktiv" : "Lokal"],
      ["GET /api/articles/list", "Artikel und Leistungen", articlesSource.length ? `${articlesSource.length} Datensaetze` : dataSourceLabel(data), "Aktiv"],
      ["GET /api/settings/users", "Benutzer und Lizenz", `${usersSource.length} Benutzer`, "Aktiv"],
      ["GET /api/settings/number-ranges", "Automatisierung", `${rangesSource.length} Nummernkreise`, "Aktiv"]
    ]

    return apiRows
  }

  return []
}

function moduleStats(view: Exclude<PremiumView, "dashboard">, data: PremiumData): ModuleConfig["stats"] {
  const source = data.invoices.length ? data.invoices : fallbackApiInvoices
  const projectsSource = data.projects.length ? data.projects : fallbackProjects
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const usersSource = data.appUsers.length ? data.appUsers : fallbackAppUsers
  const notificationsSource = data.notifications.length ? data.notifications : fallbackNotifications
  const rangesSource = data.numberRanges.length ? data.numberRanges : fallbackNumberRanges

  if (view === "customers") {
    const activeCustomers = data.customers.filter((customer) => String(customer.status || "").toLowerCase() === "active").length
    return [[String(data.customers.length || 8), "Kunden"], [String(data.customers.length ? activeCustomers : 6), "Aktiv"], [dataSourceLabel(data), "Datenquelle"]]
  }

  if (view === "projects") {
    const avgProgress = Math.round(projectsSource.reduce((sum, project) => sum + parsePercent(project.progress), 0) / Math.max(projectsSource.length, 1))
    return [[String(projectsSource.length), "Projekte"], [String(projectsSource.filter((project) => project.status === "Aktiv").length), "Aktiv"], [formatEuro(projectBudgetTotal(projectsSource)), "Budget"]]
  }

  if (view === "time") {
    const billableHours = estimatedBillableHours(projectsSource)
    const avgProgress = Math.round(projectsSource.reduce((sum, project) => sum + parsePercent(project.progress), 0) / Math.max(projectsSource.length, 1))
    return [[`${billableHours} h`, "Abrechenbar"], [String(projectsSource.length), "Projekte"], [`${avgProgress}%`, "Freigabe"]]
  }

  if (view === "invoices") {
    const invoiceSource = source.filter((invoice) => invoiceType(invoice) === "invoice")
    return [[String(invoiceSource.length), "Rechnungen"], [String(invoiceSource.filter((invoice) => isStatus(invoice.status, "overdue")).length), "Ueberfaellig"], [formatEuro(invoiceSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)), "Volumen"]]
  }

  if (view === "offers") {
    const offerSource = source.filter((invoice) => invoiceType(invoice) === "offer")
    return [[String(offerSource.length), "Angebote"], [formatEuro(offerSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)), "Pipeline"], [dataSourceLabel(data), "Datenquelle"]]
  }

  if (view === "expenses") {
    const activeArticles = articlesSource.filter((article) => article.active !== false)
    return [[String(articlesSource.length), "Positionen"], [String(activeArticles.length), "Aktiv"], [formatEuro(activeArticles.reduce((sum, article) => sum + Number(article.price || 0), 0)), "Kostenbasis"]]
  }

  if (view === "articles") {
    const activeArticles = articlesSource.filter((article) => article.active !== false)
    return [[String(articlesSource.length), "Artikel"], [String(activeArticles.length), "Aktiv"], [formatEuro(activeArticles.reduce((sum, article) => sum + Number(article.price || 0), 0)), "Preisvolumen"]]
  }

  if (view === "reports") {
    const total = source.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    const paid = source.filter((invoice) => isStatus(invoice.status, "paid")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    const paidShare = Math.round((paid / Math.max(total, 1)) * 100)
    return [[formatEuro(total), "Gesamtvolumen"], [`${paidShare}%`, "Bezahlt"], [String(source.length), "Dokumente"]]
  }

  if (view === "integrations") {
    return [[String(integrations.length), "Integrationen"], [String(new Set(integrations.map(([, meta]) => meta)).size), "Bereiche"], ["Bereit", "Status"]]
  }

  if (view === "settings") {
    const company = data.companySettings ?? fallbackCompanySettings
    return [[String(rangesSource.length), "Nummernkreise"], [company.company ? "OK" : "Pruefen", "Firmendaten"], [dataSourceLabel(data), "Datenquelle"]]
  }

  if (view === "users") {
    const activeUsers = usersSource.filter((user) => String(user.status || "").toLowerCase() === "active").length
    const limit = userLimitFromData(data)
    return [[String(usersSource.length), "Benutzer"], [String(activeUsers), "Aktiv"], [`${limit.currentUsers}/${limit.maxUsers}`, "Lizenz"]]
  }

  if (view === "license") {
    const limit = userLimitFromData(data)
    return [[limit.plan, "Tarif"], [`${limit.currentUsers}/${limit.maxUsers}`, "Benutzer"], [limit.isFull ? "Upgrade" : "OK", "Status"]]
  }

  if (view === "notifications") {
    const unread = notificationsSource.filter((item) => !isNotificationRead(item)).length
    const important = notificationsSource.filter((item) => item.tone === "warning").length
    return [[String(unread), "Neu"], [String(important), "Wichtig"], [String(notificationsSource.length), "Gesamt"]]
  }

  if (view === "automation") {
    const activeRules = rangesSource.filter((range) => range.nextValue > 0).length
    const nextValueTotal = rangesSource.reduce((sum, range) => sum + range.nextValue, 0)
    return [[String(rangesSource.length), "Regeln"], [String(activeRules), "Aktiv"], [String(nextValueTotal), "Naechste Werte"]]
  }

  if (view === "audit") {
    const openEvents = notificationsSource.filter((item) => !isNotificationRead(item)).length
    const readEvents = notificationsSource.length - openEvents
    return [[String(notificationsSource.length), "Events"], [String(openEvents), "Offen"], [String(readEvents), "Gelesen"]]
  }

  if (view === "api") {
    return [
      ["5", "Endpoints"],
      [data.loaded ? "Bereit" : "Lokal", "Status"],
      [dataSourceLabel(data), "Datenquelle"]
    ]
  }

  return []
}

function moduleFocus(view: Exclude<PremiumView, "dashboard">, data: PremiumData): ModuleConfig["focus"] {
  const source = data.invoices.length ? data.invoices : fallbackApiInvoices
  const projectsSource = data.projects.length ? data.projects : fallbackProjects
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const usersSource = data.appUsers.length ? data.appUsers : fallbackAppUsers
  const notificationsSource = data.notifications.length ? data.notifications : fallbackNotifications
  const rangesSource = data.numberRanges.length ? data.numberRanges : fallbackNumberRanges
  const invoiceSource = source.filter((invoice) => invoiceType(invoice) === "invoice")
  const offerSource = source.filter((invoice) => invoiceType(invoice) === "offer")
  const paidTotal = invoiceSource.filter((invoice) => isStatus(invoice.status, "paid")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const openTotal = invoiceSource.filter((invoice) => isStatus(invoice.status, "open") || isStatus(invoice.status, "overdue")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)

  if (view === "customers") {
    const firstCustomer = data.customers[0]
    return [["Kunden gesamt", String(data.customers.length || 4)], ["Top Kontakt", firstCustomer?.name || fallbackCompanySettings.company || "Acme GmbH"], ["Datenquelle", dataSourceLabel(data)]]
  }

  if (view === "projects") {
    const avgProgress = Math.round(projectsSource.reduce((sum, project) => sum + parsePercent(project.progress), 0) / Math.max(projectsSource.length, 1))
    const nextProject = projectsSource.find((project) => project.status !== "Aktiv") ?? projectsSource[0]
    return [["Gesamtbudget", formatEuro(projectBudgetTotal(projectsSource))], ["Durchschnitt", `${avgProgress}%`], ["Naechstes Projekt", nextProject?.name || "Projekt anlegen"]]
  }

  if (view === "time") {
    const billableHours = estimatedBillableHours(projectsSource)
    const topProject = [...projectsSource].sort((left, right) => parsePercent(right.progress) - parsePercent(left.progress))[0]
    return [["Abrechenbar", `${billableHours} h`], ["Aktive Projekte", String(projectsSource.filter((project) => project.status === "Aktiv").length)], ["Top Projekt", topProject?.name || "Zeit buchen"]]
  }

  if (view === "invoices") {
    return [["Offene Forderungen", formatEuro(openTotal)], ["Zahlungseingang", formatEuro(paidTotal)], ["Dokumente", String(invoiceSource.length)]]
  }

  if (view === "offers") {
    const offerTotal = offerSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    return [["Pipeline", formatEuro(offerTotal)], ["Angebote", String(offerSource.length)], ["Naechster Schritt", offerSource[0]?.customer || "Angebot erstellen"]]
  }

  if (view === "expenses") {
    const activeArticles = articlesSource.filter((article) => article.active !== false)
    const categories = Array.from(new Set(activeArticles.map((article) => article.category || "Leistung")))
    const topArticle = [...activeArticles].sort((left, right) => Number(right.price || 0) - Number(left.price || 0))[0]
    return [["Aktive Positionen", String(activeArticles.length)], ["Kostenbasis", formatEuro(activeArticles.reduce((sum, article) => sum + Number(article.price || 0), 0))], ["Top Position", topArticle?.name || categories[0] || "Leistung"]]
  }

  if (view === "articles") {
    const activeArticles = articlesSource.filter((article) => article.active !== false)
    const categories = Array.from(new Set(activeArticles.map((article) => article.category || "Leistung")))
    const topArticle = [...activeArticles].sort((left, right) => Number(right.price || 0) - Number(left.price || 0))[0]
    return [["Aktive Artikel", String(activeArticles.length)], ["Kategorien", String(categories.length)], ["Top Artikel", topArticle?.name || "Artikel importieren"]]
  }

  if (view === "reports") {
    const total = source.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    const paidShare = Math.round((paidTotal / Math.max(total, 1)) * 100)
    return [["Gesamtvolumen", formatEuro(total)], ["Bezahlt", `${paidShare}%`], ["Dokumente", String(source.length)]]
  }

  if (view === "integrations") {
    const categories = Array.from(new Set(integrations.map(([, meta]) => meta)))
    const categorySummary = categories.length > 2 ? `${categories.slice(0, 2).join(", ")} +${categories.length - 2}` : categories.join(", ")
    return [["Verbunden", String(integrations.length)], ["Bereiche", categorySummary], ["Status", "Bereit"]]
  }

  if (view === "settings") {
    const company = data.companySettings ?? fallbackCompanySettings
    const primaryRange = rangesSource[0]
    return [["Firma", company.company || "Nicht gesetzt"], ["Nummernkreise", String(rangesSource.length)], ["Naechster Bereich", primaryRange ? numberRangeLabel(primaryRange.type) : "Nicht gesetzt"]]
  }

  if (view === "users") {
    const limit = userLimitFromData(data)
    const firstAdmin = usersSource.find((user) => String(user.role || "").toLowerCase().includes("admin")) ?? usersSource[0]
    return [["Benutzer", `${limit.currentUsers}/${limit.maxUsers}`], ["Admin", firstAdmin?.name || firstAdmin?.email || "Team"], ["Status", limit.isFull ? "Limit erreicht" : "Aktiv"]]
  }

  if (view === "license") {
    const limit = userLimitFromData(data)
    return [["Tarif", limit.plan], ["Benutzer", `${limit.currentUsers}/${limit.maxUsers}`], ["Status", limit.isFull ? "Upgrade sinnvoll" : "Aktiv"]]
  }

  if (view === "notifications") {
    const unread = notificationsSource.filter((item) => !isNotificationRead(item)).length
    const read = notificationsSource.length - unread
    return [["Neue Meldungen", String(unread)], ["Gelesen", String(read)], ["Letzte Meldung", notificationsSource[0]?.title || "Keine Meldung"]]
  }

  if (view === "audit") {
    const openEvents = notificationsSource.filter((item) => !isNotificationRead(item)).length
    return [["Sicherheitsstatus", "Bereit"], ["Offene Events", String(openEvents)], ["Letztes Ereignis", notificationsSource[0]?.title || "Keine Ereignisse"]]
  }

  if (view === "automation") {
    const activeRules = rangesSource.filter((range) => range.nextValue > 0).length
    const primaryRange = rangesSource[0]
    return [["Regeln", String(rangesSource.length)], ["Aktiv", String(activeRules)], ["Naechster Lauf", primaryRange ? `${numberRangeLabel(primaryRange.type)} ${String(primaryRange.nextValue).padStart(primaryRange.padding, "0")}` : "Bereit"]]
  }

  if (view === "api") {
    return [["Endpoints", "5"], ["Status", data.loaded ? "Bereit" : "Lokal"], ["Datenquelle", dataSourceLabel(data)]]
  }

  return []
}

function moduleTimeline(view: Exclude<PremiumView, "dashboard">, data: PremiumData) {
  const notificationsSource = data.notifications.length ? data.notifications : fallbackNotifications
  const rows = moduleRows(view, data)
  const liveItems = notificationsSource.slice(0, 3).map((item) => [
    item.title,
    item.message || item.category || "Systemmeldung"
  ] as [string, string])

  if (view === "notifications" || view === "audit") return liveItems.length ? liveItems : moduleContent[view].timeline

  if (rows.length) {
    return rows.slice(0, 3).map(([title, subtitle, value, status]) => [
      title,
      `${subtitle} · ${value} · ${status}`
    ] as [string, string])
  }

  return moduleContent[view].timeline
}

function moduleSelectionLabel(searchQuery: string) {
  return searchQuery.trim()
}

const premiumActionQueryTerms = [
  "zeit gebucht",
  "timer gestartet",
  "freigabe vorbereitet",
  "kunde vorbereitet",
  "kunde neu vorbereitet",
  "kundenliste geoeffnet",
  "segment geprueft",
  "projekt vorbereitet",
  "projekt neu vorbereitet",
  "projektliste geoeffnet",
  "budget geprueft",
  "rechnung vorbereitet",
  "rechnung neu vorbereitet",
  "dokument geoeffnet",
  "zahlung geprueft",
  "angebot vorbereitet",
  "angebot neu vorbereitet",
  "pipeline geprueft",
  "ausgabe erfasst",
  "beleg hochgeladen",
  "datev vorbereitet",
  "artikel importiert",
  "artikel exportiert",
  "artikel vorlage",
  "artikel geprueft",
  "report exportiert",
  "vergleich geoeffnet",
  "firma geprueft",
  "firma gespeichert",
  "branding geprueft",
  "kategorie vorbereitet",
  "kategorie geloescht",
  "bankdaten geprueft",
  "steuerdaten geprueft",
  "nummernkreis geprueft",
  "nummernkreis gespeichert",
  "email provider geprueft",
  "email test vorbereitet",
  "smtp geprueft",
  "mahnlauf geprueft",
  "mahnautomatik vorbereitet",
  "rechtliches geprueft",
  "standardtexte geprueft",
  "portal geoeffnet",
  "archiv export vorbereitet",
  "portal verbindung geprueft",
  "system geprueft",
  "backup erstellt",
  "lizenz geprueft",
  "benutzer eingeladen",
  "rolle vorbereitet",
  "2fa geprueft",
  "regeln aktualisiert",
  "alle gelesen",
  "audit filter aktiv",
  "filter aktiv",
  "integration verbunden",
  "sync geprueft",
  "token vorbereitet",
  "workflow erstellt",
  "workflow getestet",
  "audit exportiert",
  "ereignis gefunden",
  "webhook logs",
  "api-key rotiert",
  "api geprueft",
  "webhook erstellt"
]

function isPremiumActionQuery(searchQuery: string) {
  const selection = moduleSelectionLabel(searchQuery).toLowerCase()
  return selection.startsWith("fokus ") || selection.startsWith("aktuell ") || premiumActionQueryTerms.some((term) => selection.includes(term))
}

function premiumSearchQuery(searchQuery: string) {
  return isPremiumActionQuery(searchQuery) ? "" : searchQuery
}

function isModuleRowActive(row: ModuleRow, searchQuery: string) {
  const selection = moduleSelectionLabel(searchQuery).toLowerCase()
  if (!selection) return false

  return row.some((value) => value.toLowerCase() === selection || value.toLowerCase().includes(selection))
}

function moduleSelectedRow(rows: ModuleRow[], searchQuery: string) {
  const selection = moduleSelectionLabel(searchQuery)
  if (!selection) return null

  return rows.find((row) => isModuleRowActive(row, selection)) ?? null
}

function moduleRowHref(view: Exclude<PremiumView, "dashboard">, data: PremiumData, row: ModuleRow) {
  if (view === "customers") {
    const customersSource = data.customers.length ? data.customers : fallbackApiCustomers
    const customer = customersSource.find((item) => item.name === row[0])
    return customer ? `/dashboard-v2/customers?q=${encodeURIComponent(customer.name)}` : "/dashboard-v2/customers"
  }

  if (view === "projects") {
    const projectsSource = data.projects.length ? data.projects : fallbackProjects
    const project = projectsSource.find((item) => item.name === row[0])
    return project ? `/dashboard-v2/projects?q=${encodeURIComponent(project.name)}` : "/dashboard-v2/projects"
  }

  if (view === "invoices" || view === "offers") {
    return `/dashboard-v2/${view}?q=${encodeURIComponent(row[0])}`
  }

  if (view === "time") {
    const projectsSource = data.projects.length ? data.projects : fallbackProjects
    const project = projectsSource.find((item) => item.name === row[0])
    return project ? `/dashboard-v2/time?q=${encodeURIComponent(project.name)}` : "/dashboard-v2/time"
  }

  if (view === "expenses") {
    const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
    const article = articlesSource.find((item) => item.name === row[0])
    return article ? `/dashboard-v2/expenses?q=${encodeURIComponent(article.name)}` : "/dashboard-v2/expenses"
  }

  if (view === "articles") {
    const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
    const article = articlesSource.find((item) => item.name === row[0])
    return article ? `/dashboard-v2/articles?q=${encodeURIComponent(article.name)}` : "/dashboard-v2/articles"
  }

  return `/dashboard-v2/${view}?q=${encodeURIComponent(row[0])}`
}

function moduleSignalHref(view: Exclude<PremiumView, "dashboard">, label: string, type: "Fokus" | "Aktuell") {
  return `/dashboard-v2/${view}?q=${encodeURIComponent(`${type} ${label}`)}`
}

function ModuleSelectionPanel({ data, mode, row, searchQuery, view }: { data: PremiumData; mode: ThemeMode; row: ModuleRow | null; searchQuery: string; view: Exclude<PremiumView, "dashboard"> }) {
  const selection = moduleSelectionLabel(searchQuery)
  if (!selection) return null
  if (!row && !isPremiumActionQuery(selection)) return null

  const detailHref = row && (view === "invoices" || view === "offers") ? `/dashboard-v2/${view}?q=Dokument%20geoeffnet` : null

  return (
    <article className={`${styles.panel} ${styles.selectionPanel}`}>
      <div>
        <span>Auswahl aktiv</span>
        <strong>{row?.[0] || selection}</strong>
        <small>{row ? `${row[1]} · ${row[2]} · ${row[3]}` : "Premium Aktion wurde vorbereitet und ist im aktuellen Bereich markiert."}</small>
      </div>
      <div>
        {detailHref ? <Link href={withPremiumTheme(detailHref, mode)}>Dokument oeffnen</Link> : null}
        <Link href={withPremiumTheme(`/dashboard-v2/${view}`, mode)}>Auswahl leeren</Link>
      </div>
    </article>
  )
}

type LicensePanelState =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }
type WorkflowState =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }
type CustomerDraft = {
  number: string
  name: string
  contact: string
  email: string
  phone: string
  status: string
  street: string
  zip: string
  city: string
  country: string
}
type ProjectDraft = {
  name: string
  customer: string
  budget: string
  status: string
  description: string
}
type DocumentDraft = {
  type: "invoice" | "offer"
  customer: string
  project: string
  title: string
  amount: string
  status: string
  note: string
}

function createLocalCustomer(draft: CustomerDraft): ApiCustomer {
  const seed = Date.now()
  return {
    id: `premium-customer-${seed}`,
    number: draft.number || `KD-PREM-${String(seed).slice(-4)}`,
    name: draft.name || "Neuer Premium Kunde",
    contact: draft.contact,
    email: draft.email,
    phone: draft.phone,
    street: draft.street,
    zip: draft.zip,
    city: draft.city,
    country: draft.country,
    status: draft.status || "active"
  }
}

function createLocalProject(draft: ProjectDraft): ProjectData {
  return {
    id: `premium-project-${Date.now()}`,
    name: draft.name || "Neues Premium Projekt",
    customer: draft.customer || "Demo Kunde",
    status: draft.status || "Aktiv",
    progress: draft.status === "Fertig" ? "100%" : "12%",
    budget: formatEuro(parseMoney(draft.budget || "0"))
  }
}

function createLocalDocument(draft: DocumentDraft, kind: "invoice" | "offer"): ApiInvoice {
  const seed = Date.now()
  const netTotal = Number.parseFloat(String(draft.amount || "0").replace(",", "."))
  const grossTotal = (Number.isFinite(netTotal) ? netTotal : 0) * 1.19

  return {
    id: `premium-${kind}-${seed}`,
    number: `${kind === "offer" ? "OF" : "RE"}-PREM-${String(seed).slice(-5)}`,
    type: kind,
    status: draft.status || "draft",
    customer: draft.customer || "Demo Kunde",
    grossTotal,
    date: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  }
}

function createLocalExpenseArticle(draft: ExpenseDraft): ApiArticle {
  const amount = Number.parseFloat(String(draft.amount || "0").replace(",", "."))
  return {
    id: `premium-expense-${Date.now()}`,
    name: draft.title || "Premium Ausgabe",
    category: draft.category || "Ausgabe",
    price: Number.isFinite(amount) ? amount : 0,
    active: true
  }
}
type TimeDraft = {
  project: string
  task: string
  hours: string
  rate: string
  status: string
}
type ExpenseDraft = {
  title: string
  amount: string
  category: string
  project: string
  vendor: string
  status: string
}
type SettingsDraft = {
  company: string
  email: string
  city: string
  country: string
  invoicePrefix: string
  invoiceNextValue: string
  invoicePadding: string
}
type IntegrationDraft = {
  provider: string
  mode: string
  tokenLabel: string
}
type AutomationDraft = {
  rule: string
  trigger: string
  action: string
}
type ApiDraft = {
  event: string
  endpoint: string
  keyLabel: string
}
type UserDraft = {
  email: string
  role: string
}
type ArticleImportDraft = {
  csv: string
}

const premiumSettingsAreas: Array<{
  key: string
  title: string
  description: string
  status: string
  actions: Array<[label: string, query: string]>
}> = [
  { key: "company", title: "Firma", description: "Stammdaten, Adresse, Kontakt, Logo und Bankdaten.", status: "API aktiv", actions: [["Firma pruefen", "Firma geprueft"], ["Stammdaten speichern", "Firma gespeichert"], ["Branding pruefen", "Branding geprueft"]] },
  { key: "categories", title: "Kategorien", description: "Artikel-, Ausgaben- und Leistungsgruppen strukturieren.", status: "Premium vorbereitet", actions: [["Kategorie anlegen", "Kategorie vorbereitet"], ["Kategorie loeschen", "Kategorie geloescht"]] },
  { key: "finance", title: "Finanzen", description: "Bankdaten, Steuerdaten, Zahlungsziele und Buchhaltung.", status: "API teilweise aktiv", actions: [["Bankdaten pruefen", "Bankdaten geprueft"], ["Steuerdaten pruefen", "Steuerdaten geprueft"]] },
  { key: "number-ranges", title: "Nummernkreise", description: "Rechnungen, Angebote, Kunden und Belege nummerieren.", status: "API aktiv", actions: [["Nummernkreis pruefen", "Nummernkreis geprueft"], ["Nummernkreis speichern", "Nummernkreis gespeichert"]] },
  { key: "email", title: "E-Mail", description: "Provider, Absender, SMTP, Mailpit und Testversand.", status: "API aktiv", actions: [["Provider pruefen", "Email Provider geprueft"], ["Testmail senden", "Email Test vorbereitet"], ["SMTP pruefen", "SMTP geprueft"]] },
  { key: "notifications", title: "Benachrichtigungen", description: "Glocke, Kategorien und wichtige Systemmeldungen.", status: "API aktiv", actions: [["Regeln aktualisieren", "Regeln aktualisiert"], ["Alle gelesen", "Alle gelesen"], ["Filter pruefen", "Filter aktiv"]] },
  { key: "reminders", title: "Mahnungen", description: "Mahnlauf, Tageslauf, Wiederholung und Freigabe.", status: "Premium vorbereitet", actions: [["Mahnlauf pruefen", "Mahnlauf geprueft"], ["Automatik vorbereiten", "Mahnautomatik vorbereitet"]] },
  { key: "legal", title: "Rechtliches", description: "Kleinunternehmer, ZUGFeRD, Standardtexte und Steuerbasis.", status: "Premium vorbereitet", actions: [["USt pruefen", "Rechtliches geprueft"], ["Standardtexte pruefen", "Standardtexte geprueft"]] },
  { key: "portal", title: "Portal", description: "Angebotsportal, Archiv, Paperless und Nextcloud.", status: "Premium vorbereitet", actions: [["Portal testen", "Portal geoeffnet"], ["Archiv exportieren", "Archiv Export vorbereitet"], ["Verbindung pruefen", "Portal Verbindung geprueft"]] },
  { key: "users", title: "Benutzer & Lizenz", description: "Rollen, Rechte, Einladungen, Limits und Lizenzstatus.", status: "API aktiv", actions: [["Benutzer verwalten", "Benutzer eingeladen"], ["Rollen pruefen", "Rolle vorbereitet"], ["Lizenz pruefen", "Lizenz geprueft"]] },
  { key: "system", title: "System", description: "Sprache, Audit, Export, Backup und Wiederherstellung.", status: "Premium vorbereitet", actions: [["System pruefen", "System geprueft"], ["Backup erstellen", "Backup erstellt"], ["Audit exportieren", "Audit exportiert"]] }
]

function PremiumLicensePanel({ data, mode, searchQuery }: { data: PremiumData; mode: ThemeMode; searchQuery: string }) {
  const limit = userLimitFromData(data)
  const [licenseKey, setLicenseKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<LicensePanelState>({ type: "idle", message: "" })
  const normalizedQuery = searchQuery.toLowerCase()
  const shouldFocusKey = normalizedQuery.includes("lizenz-key") || normalizedQuery.includes("lizenz aktiviert")
  const shouldFocusUpgrade = normalizedQuery.includes("upgrade") || normalizedQuery.includes("benutzerlimit")
  const routeMessage = normalizedQuery.includes("lizenz aktiviert")
    ? "Demo-Lizenz wurde geprueft. Der Aktivierungsweg ist bereit."
    : normalizedQuery.includes("lizenz-key")
      ? "Lizenzschluessel-Eingabe ist bereit."
      : normalizedQuery.includes("benutzerlimit")
        ? "Benutzerlimit wurde geprueft. Upgrade-Optionen sind vorbereitet."
        : normalizedQuery.includes("upgrade")
          ? "Upgrade-Check ist bereit. Benutzerlimit und Tarif koennen erweitert werden."
          : ""
  const currentState = state.message ? state : routeMessage ? { type: "success" as const, message: routeMessage } : state

  async function handleLicenseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      setLicenseKey(content.trim())
      setState({ type: "success", message: `Lizenzdatei geladen: ${file.name}` })
    } catch {
      setState({ type: "error", message: "Lizenzdatei konnte nicht gelesen werden." })
    } finally {
      event.target.value = ""
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedKey = licenseKey.trim()

    if (!trimmedKey) {
      setState({ type: "error", message: "Bitte Lizenzschluessel eintragen." })
      return
    }

    setIsSubmitting(true)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: trimmedKey })
      })
      const result = await response.json()

      if (!response.ok || !result?.ok) {
        setState({ type: "error", message: result?.error || "Lizenz konnte nicht aktiviert werden." })
        return
      }

      setLicenseKey("")
      setState({ type: "success", message: `Lizenz aktiviert: ${result.license?.plan || "Premium"} / ${result.license?.maxUsers || "unbegrenzt"} Benutzer` })
    } catch {
      setState({ type: "error", message: "Lizenzserver konnte nicht erreicht werden." })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function runLicensePanelAction(action: "demo" | "limit" | "users") {
    setIsSubmitting(true)
    setState({ type: "idle", message: "" })

    try {
      if (action === "users" || action === "limit") {
        const response = await fetch("/api/settings/users", { credentials: "same-origin" })
        const result = await response.json()

        if (!response.ok || !result?.ok) {
          setState({ type: "error", message: result?.error || "Benutzerlimit konnte nicht geprueft werden." })
          return
        }

        const checkedLimit = result.limit || limit
        const checkedUsers = checkedLimit.activeUsers ?? checkedLimit.currentUsers ?? limit.currentUsers
        const checkedMaxUsers = checkedLimit.maxUsers ?? limit.maxUsers
        setState({
          type: "success",
          message: action === "users"
            ? `Benutzer verwaltet: ${result.users?.length || checkedUsers} Benutzer geladen.`
            : `Benutzerlimit geprueft: ${checkedUsers} / ${checkedMaxUsers} Benutzer.`
        })
        return
      }

      const response = await fetch("/api/premium/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: "license",
          action: "license.demo.check",
          label: "Demo-Key geprueft",
          payload: { plan: limit.plan, currentUsers: limit.currentUsers, maxUsers: limit.maxUsers }
        })
      })
      const result = await response.json()

      if (!response.ok || !result?.ok) {
        setState({ type: "error", message: result?.error || "Demo-Key konnte nicht geprueft werden." })
        return
      }

      setState({ type: "success", message: "Demo-Key wurde geprueft. Echte Aktivierung erfolgt mit signiertem Lizenzschluessel." })
    } catch {
      setState({ type: "error", message: "Lizenzaktion konnte nicht erreicht werden." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <article className={`${styles.panel} ${styles.licenseActionPanel}`}>
      <div className={styles.panelHead}>
        <div>
          <h2>Lizenz aktivieren</h2>
          <span>Key eingeben, Datei hochladen und Limit direkt pruefen</span>
        </div>
        <span className={styles.freeBadge}>{limit.plan}</span>
      </div>

      <div className={styles.licenseActionGrid}>
        <form action="/dashboard-v2/license" method="get" onSubmit={handleSubmit} className={styles.licenseKeyForm} data-active={shouldFocusKey}>
          <input type="hidden" name="q" value="Lizenz-Key" />
          <input type="hidden" name="theme" value={mode} />
          <label htmlFor="premium-license-key">Lizenzschluessel</label>
          <textarea
            id="premium-license-key"
            value={licenseKey}
            onChange={(event) => setLicenseKey(event.target.value)}
            rows={1}
            placeholder="INV1-PREM-2026-XXXX-XXXX-XXXX-XXXX"
            spellCheck={false}
          />
          <div className={styles.licenseFormActions}>
            <label>
              Lizenzdatei hochladen
              <input type="file" accept=".lic,.license,.txt,.json,application/json,text/plain" onChange={handleLicenseFile} />
            </label>
            <button type="button" disabled={isSubmitting} onClick={() => void runLicensePanelAction("demo")}>Demo-Key pruefen</button>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Pruefe..." : "Aktivieren"}</button>
          </div>
          {currentState.message ? <p data-state={currentState.type}>{currentState.message}</p> : null}
        </form>

        <div className={styles.licenseUpgradeBox} data-active={shouldFocusUpgrade}>
          <span>Upgrade-Check</span>
          <strong>{limit.currentUsers} / {limit.maxUsers} Benutzer</strong>
          <p>{limit.isFull ? "Limit erreicht. Ein Upgrade ist fuer weitere Benutzer noetig." : `${Math.max(limit.maxUsers - limit.currentUsers, 0)} Benutzerplaetze sind aktuell frei.`}</p>
          <button type="button" disabled={isSubmitting} onClick={() => void runLicensePanelAction("users")}>Benutzer verwalten</button>
        </div>
      </div>
    </article>
  )
}

function PremiumLicenseAdminPage({ mode }: { mode: ThemeMode }) {
  const defaultPlan = licenseAdminPlanByKey("team")
  const [plan, setPlan] = useState<LicenseAdminPlan>("team")
  const [billingCycle, setBillingCycle] = useState(defaultPlan.billing)
  const [maxUsers, setMaxUsers] = useState(String(defaultPlan.users))
  const [days, setDays] = useState("365")
  const [customerName, setCustomerName] = useState("Premium Kunde GmbH")
  const [generated, setGenerated] = useState<LicenseAdminGenerated | null>(null)
  const [issues, setIssues] = useState<LicenseIssueSummary[]>([])
  const [state, setState] = useState<WorkflowState>({ type: "idle", message: "" })
  const [isSaving, setIsSaving] = useState(false)

  async function loadIssues() {
    try {
      const response = await fetch("/api/settings/license/generate", { credentials: "same-origin" })
      const result = await response.json()
      if (!response.ok || !result?.ok) return
      setIssues(Array.isArray(result.issues) ? result.issues : [])
    } catch {
      // The admin page can still generate keys even if the list refresh fails.
    }
  }

  useEffect(() => {
    void loadIssues()
  }, [])

  function handlePlanChange(nextPlan: LicenseAdminPlan) {
    const selected = licenseAdminPlanByKey(nextPlan)
    setPlan(nextPlan)
    setMaxUsers(String(selected.users))
    setBillingCycle(selected.billing)
    if (nextPlan === "free") setDays("365")
    if (nextPlan === "unlimited") setDays("365")
    setState({ type: "idle", message: "" })
  }

  async function generateKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setState({ type: "idle", message: "" })
    setGenerated(null)

    try {
      const response = await fetch("/api/settings/license/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          plan,
          billingCycle,
          days: Number(days),
          maxUsers: Number(maxUsers),
          customerName,
          features: ["apiAccess", "auditLog", "datevExport", "teamUsers"]
        })
      })
      const result = await response.json()
      if (!response.ok || !result?.ok) {
        setState({ type: "error", message: result?.error || "Lizenz-Key konnte nicht erzeugt werden." })
        return
      }

      setGenerated({ licenseKey: result.licenseKey, license: result.license })
      setState({ type: "success", message: `${result.license?.plan || plan} Key erzeugt: ${result.license?.maxUsers || maxUsers} Benutzer.` })
      await loadIssues()
    } catch {
      setState({ type: "error", message: "Lizenz-Key-API konnte nicht erreicht werden." })
    } finally {
      setIsSaving(false)
    }
  }

  async function copyGeneratedKey() {
    if (!generated?.licenseKey) return

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generated.licenseKey)
      } else {
        throw new Error("Clipboard API unavailable")
      }
      setState({ type: "success", message: "Lizenz-Key wurde kopiert und kann an den Kunden gesendet werden." })
    } catch {
      const textarea = document.getElementById("generated-license-key") as HTMLTextAreaElement | null
      textarea?.focus()
      textarea?.select()
      const copied = typeof document.execCommand === "function" ? document.execCommand("copy") : false
      setState({
        type: "success",
        message: copied
          ? "Lizenz-Key wurde kopiert und kann an den Kunden gesendet werden."
          : "Key wurde markiert. Bitte mit Cmd/Ctrl+C kopieren."
      })
    }
  }

  return (
    <section className={styles.modulePage}>
      <article className={`${styles.panel} ${styles.moduleHero}`}>
        <div>
          <span>Intern</span>
          <h1>Lizenz Admin</h1>
          <p>Signierte Premium-Keys erzeugen, Planlimits steuern und Ausgaben nachvollziehen.</p>
        </div>
        <button type="button" disabled={isSaving} onClick={() => document.getElementById("premium-license-admin-form")?.scrollIntoView({ behavior: "smooth", block: "start" })}><Plus size={18} />Key erzeugen</button>
      </article>

      <section className={styles.licensePlanGrid}>
        {licenseAdminPlans.map((item) => (
          <button key={item.key} type="button" data-active={plan === item.key} onClick={() => handlePlanChange(item.key)}>
            <span>{item.label}</span>
            <strong>{item.key === "unlimited" ? "Unlimited" : item.users}</strong>
            <small>{item.key === "unlimited" ? "ohne praktisches Limit" : "Benutzer"}</small>
          </button>
        ))}
      </section>

      <article className={`${styles.panel} ${styles.workflowPanel}`}>
        <div className={styles.panelHead}>
          <div>
            <h2>Lizenz-Key erzeugen</h2>
            <span>Plan auswaehlen, Kunde eintragen und Key kopieren</span>
          </div>
          <Link href={withPremiumTheme("/dashboard-v2/license", mode)}>Zur Aktivierung</Link>
        </div>

        <form id="premium-license-admin-form" className={styles.workflowForm} onSubmit={generateKey}>
          <label>Plan<select value={plan} onChange={(event) => handlePlanChange(event.target.value as LicenseAdminPlan)}>{licenseAdminPlans.map((item) => <option key={item.key} value={item.key}>{item.label} - {item.key === "unlimited" ? "Unlimited" : `${item.users} Benutzer`}</option>)}</select></label>
          <label>Benutzerlimit<input value={maxUsers} inputMode="numeric" onChange={(event) => setMaxUsers(event.target.value)} /></label>
          <label>Laufzeit Tage<input value={days} inputMode="numeric" onChange={(event) => setDays(event.target.value)} /></label>
          <label>Kunde<input value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></label>
          <label>Abrechnung<select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value)}><option value="free">Free</option><option value="monthly">Monatlich</option><option value="yearly">Jaehrlich</option><option value="custom">Custom</option></select></label>
          <button type="submit" disabled={isSaving}>{isSaving ? "Erzeugt..." : "Key erzeugen"}</button>
        </form>

        {generated ? (
          <div className={styles.licenseKeyResult}>
            <div>
              <span>Neuer Lizenz-Key</span>
              <strong>{generated.license.keyPreview}</strong>
              <p>{generated.license.plan} · {generated.license.maxUsers} Benutzer · {generated.license.validUntil ? generated.license.validUntil.slice(0, 10) : "ohne Ablauf"}</p>
            </div>
            <textarea id="generated-license-key" readOnly value={generated.licenseKey} rows={4} spellCheck={false} />
            <button type="button" onClick={() => void copyGeneratedKey()}>Key kopieren</button>
          </div>
        ) : null}

        {state.message ? <p data-state={state.type}>{state.message}</p> : null}
      </article>

      <article className={`${styles.panel} ${styles.moduleTable}`}>
        <div className={styles.panelHead}><h2>Letzte Lizenz-Keys</h2><button type="button" onClick={() => void loadIssues()}>Aktualisieren</button></div>
        <div className={styles.moduleList}>
          {issues.length ? issues.map((issue) => (
            <div key={issue.id} className={styles.moduleListRow}>
              <div><strong>{issue.customerName || "Ohne Kunde"}</strong><span>{issue.keyPreview}</span></div>
              <b>{issue.plan}</b>
              <em>{issue.maxUsers === 1_000_000 ? "Unlimited" : `${issue.maxUsers} Benutzer`}</em>
              <small data-status={issue.status}>{issue.status}</small>
            </div>
          )) : <p className={styles.emptyTableCell}>Noch keine Keys erzeugt.</p>}
        </div>
      </article>
    </section>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}

type ReportAction = "documents" | "datev" | "finance" | "compare"

type ReportTarget = {
  action: ReportAction
  filename: string
  label: string
  successMessage: string
}

function getReportTarget(action: ReportAction): ReportTarget {
  if (action === "documents") {
    return {
      action,
      filename: "dokumente-export.csv",
      label: "Dokumentexport",
      successMessage: "Dokumentexport wurde als CSV vorbereitet."
    }
  }

  if (action === "datev") {
    return {
      action,
      filename: "datev-export.csv",
      label: "DATEV Export",
      successMessage: "DATEV Export wurde als CSV vorbereitet."
    }
  }

  if (action === "finance") {
    return {
      action,
      filename: "finanzbericht.txt",
      label: "Finanzbericht",
      successMessage: "Finanzbericht wurde erstellt und heruntergeladen."
    }
  }

  return {
    action,
    filename: "finanzvergleich.txt",
    label: "Vergleich",
    successMessage: "Vergleich wurde erstellt und fuer den Export vorbereitet."
  }
}

function parseArticleImportRows(csv: string) {
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes(";") ? ";" : ","
      const [code, name, category, price, unit, tax] = line.split(delimiter).map((value) => value.trim())

      return {
        code,
        name,
        category,
        price,
        unit,
        tax
      }
    })
    .filter((row) => row.name)
}

function createPremiumArticlesFromRows(rows: ReturnType<typeof parseArticleImportRows>, seed = Date.now()): ApiArticle[] {
  return rows.map((row, index) => {
    const code = row.code || `AR-PREM-${String(index + 1).padStart(4, "0")}`

    return {
      id: `premium-article-${seed}-${index}`,
      code,
      name: row.name,
      category: row.category || "Dienstleistung",
      price: Number(String(row.price ?? 0).replace(",", ".")) || 0,
      active: true
    }
  })
}

function escapeCsvCell(value: unknown) {
  const text = String(value ?? "")

  if (/[;"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`
  }

  return text
}

function createArticleCsv(articles: ApiArticle[]) {
  const rows = [
    ["Artikelnummer", "Artikel", "Kategorie", "Nettopreis", "Einheit", "MwSt", "Aktiv"],
    ...articles.map((article) => [
      article.code || article.id,
      article.name,
      article.category || "",
      Number(article.price || 0).toFixed(2).replace(".", ","),
      "Stk",
      "19",
      article.active === false ? "Nein" : "Ja"
    ])
  ]

  return rows.map((row) => row.map(escapeCsvCell).join(";")).join("\n")
}

function reportInvoicesFromData(data: PremiumData) {
  return data.invoices.length ? data.invoices : fallbackApiInvoices
}

function reportDate(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10)
  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
  return value.slice(0, 10)
}

function createDocumentExportCsv(data: PremiumData) {
  const rows = [
    ["Nummer", "Typ", "Status", "Kunde", "Datum", "Faelligkeit", "Netto", "MwSt", "Brutto"],
    ...reportInvoicesFromData(data).map((invoice) => {
      const grossTotal = Number(invoice.grossTotal) || 0
      const netTotal = grossTotal / 1.19
      const vatTotal = grossTotal - netTotal

      return [
        invoice.number,
        invoiceType(invoice) === "offer" ? "Angebot" : "Rechnung",
        statusLabel(invoice.status),
        invoice.customer || "",
        reportDate(invoice.date || invoice.createdAt),
        reportDate(invoice.dueDate || invoice.date || invoice.createdAt),
        netTotal.toFixed(2).replace(".", ","),
        vatTotal.toFixed(2).replace(".", ","),
        grossTotal.toFixed(2).replace(".", ",")
      ]
    })
  ]

  return rows.map((row) => row.map(escapeCsvCell).join(";")).join("\n")
}

function createDatevExportCsv(data: PremiumData) {
  const rows = [
    ["Datum", "Belegnummer", "Konto", "Gegenkonto", "Text", "Soll", "Haben", "Steuer"],
    ...reportInvoicesFromData(data).map((invoice) => {
      const grossTotal = Number(invoice.grossTotal) || 0
      const netTotal = grossTotal / 1.19
      const vatTotal = grossTotal - netTotal
      const isOffer = invoiceType(invoice) === "offer"

      return [
        reportDate(invoice.date || invoice.createdAt),
        invoice.number,
        isOffer ? "8000" : "8400",
        "1200",
        `${isOffer ? "Angebot" : "Ausgangsrechnung"} ${invoice.customer || "Ohne Kunde"}`,
        "",
        netTotal.toFixed(2).replace(".", ","),
        vatTotal.toFixed(2).replace(".", ",")
      ]
    })
  ]

  return rows.map((row) => row.map(escapeCsvCell).join(";")).join("\n")
}

function createFinanceReport(data: PremiumData, title = "DreamInvoice Premium Finanzbericht") {
  const source = reportInvoicesFromData(data)
  const invoiceSource = source.filter((invoice) => invoiceType(invoice) === "invoice")
  const offerSource = source.filter((invoice) => invoiceType(invoice) === "offer")
  const grossTotal = invoiceSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const paidTotal = invoiceSource.filter((invoice) => isStatus(invoice.status, "paid")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const openTotal = invoiceSource.filter((invoice) => isStatus(invoice.status, "open") || isStatus(invoice.status, "overdue")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const offerTotal = offerSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const expenseEstimate = articlesSource.reduce((sum, article) => sum + Number(article.price || 0), 0)

  return [
    title,
    `Erstellt: ${new Date().toLocaleString("de-DE")}`,
    "",
    "Rechnungen",
    `Anzahl: ${invoiceSource.length}`,
    `Brutto: ${formatEuro(grossTotal)}`,
    `Bezahlt: ${formatEuro(paidTotal)}`,
    `Offen: ${formatEuro(openTotal)}`,
    "",
    "Angebote",
    `Anzahl: ${offerSource.length}`,
    `Pipeline: ${formatEuro(offerTotal)}`,
    "",
    "Premium Workflows",
    `Artikel/Kostenbasis: ${formatEuro(expenseEstimate)}`,
    `Datenquelle: ${dataSourceLabel(data)}`,
    "",
    "Ergebnis",
    `Liquiditaetsblick: ${formatEuro(paidTotal - expenseEstimate)}`,
    `Forecast inkl. offene Rechnungen und Angebote: ${formatEuro(paidTotal + openTotal + offerTotal - expenseEstimate)}`
  ].join("\n")
}

function downloadLocalReportTarget(action: ReportAction, data: PremiumData) {
  const target = getReportTarget(action)

  if (action === "documents") {
    downloadTextFile(createDocumentExportCsv(data), target.filename)
  } else if (action === "datev") {
    downloadTextFile(createDatevExportCsv(data), target.filename)
  } else {
    const title = action === "compare" ? "DreamInvoice Premium Finanzvergleich" : "DreamInvoice Premium Finanzbericht"
    downloadTextFile(createFinanceReport(data, title), target.filename, "text/plain;charset=utf-8")
  }

  return target
}

function downloadTextFile(content: string, filename: string, type = "text/csv;charset=utf-8") {
  downloadBlob(new Blob([content], { type }), filename)
}

function mergePremiumArticles(importedArticles: ApiArticle[], currentArticles: ApiArticle[]) {
  const source = currentArticles.length ? currentArticles : fallbackApiArticles
  const importedCodes = new Set(importedArticles.map((article) => article.code || article.id))

  return [
    ...importedArticles,
    ...source.filter((article) => !importedCodes.has(article.code || article.id))
  ].slice(0, 50)
}

function PremiumWorkflowPanel({ data, mode, searchQuery, view, onDataChange }: { view: Exclude<PremiumView, "dashboard">; data: PremiumData; mode: ThemeMode; searchQuery: string; onDataChange: (updater: (current: PremiumData) => PremiumData) => void }) {
  const router = useRouter()
  const customersSource = data.customers.length ? data.customers : fallbackApiCustomers
  const projectsSource = data.projects.length ? data.projects : fallbackProjects
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const integrationsSource = integrations.length ? integrations : [["Stripe", "Zahlungen", "#635bff"]]
  const rangesSource = data.numberRanges.length ? data.numberRanges : fallbackNumberRanges
  const query = searchQuery.toLowerCase()
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>({
    number: "",
    name: customersSource[0]?.name || "Neuer Premium Kunde",
    contact: customersSource[0]?.contact || "Daniel Kontakt",
    email: customersSource[0]?.email || "kontakt@example.test",
    phone: customersSource[0]?.phone || "",
    status: "active",
    street: customersSource[0]?.street || "Lindenallee 12",
    zip: customersSource[0]?.zip || "10115",
    city: customersSource[0]?.city || "Koeln",
    country: customersSource[0]?.country || "Deutschland"
  })
  const [projectDraft, setProjectDraft] = useState<ProjectDraft>({
    name: projectsSource[0]?.name || "Neues Premium Projekt",
    customer: projectsSource[0]?.customer || customersSource[0]?.name || "Demo Kunde",
    budget: "12000",
    status: "Aktiv",
    description: "Premium Projektentwurf mit Budget, Kunde und Abrechnungsfluss."
  })
  const [invoiceDraft, setInvoiceDraft] = useState<DocumentDraft>({
    type: "invoice",
    customer: customersSource[0]?.name || "Demo Kunde",
    project: projectsSource[0]?.name || "Allgemein",
    title: articlesSource[0]?.name || "Premium Leistung",
    amount: String(Number(articlesSource[0]?.price || 680).toFixed(2)),
    status: "draft",
    note: "Premium-Rechnung mit Kunde, Projekt und Position vorbereitet."
  })
  const [offerDraft, setOfferDraft] = useState<DocumentDraft>({
    type: "offer",
    customer: customersSource[0]?.name || "Demo Kunde",
    project: projectsSource[0]?.name || "Allgemein",
    title: projectsSource[0]?.name || "Premium Angebot",
    amount: "1320.00",
    status: "draft",
    note: "Premium-Angebot fuer Pipeline und Freigabe vorbereitet."
  })
  const [timeDraft, setTimeDraft] = useState<TimeDraft>({
    project: projectsSource[0]?.name || "Website Redesign",
    task: "Premium Arbeitszeit",
    hours: "1.5",
    rate: "95",
    status: "billable"
  })
  const [expenseDraft, setExpenseDraft] = useState<ExpenseDraft>({
    title: articlesSource[0]?.name || "Software Lizenz",
    amount: String(Number(articlesSource[0]?.price || 128).toFixed(2)),
    category: articlesSource[0]?.category || "Software",
    project: projectsSource[0]?.name || "Allgemein",
    vendor: "Premium Lieferant",
    status: "recorded"
  })
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft>({
    company: (data.companySettings ?? fallbackCompanySettings).company || "Acme GmbH",
    email: (data.companySettings ?? fallbackCompanySettings).email || "office@acme.example",
    city: (data.companySettings ?? fallbackCompanySettings).city || "Koeln",
    country: (data.companySettings ?? fallbackCompanySettings).country || "Deutschland",
    invoicePrefix: rangesSource.find((range) => range.type === "invoice")?.prefix || "RE-%Y-",
    invoiceNextValue: String(rangesSource.find((range) => range.type === "invoice")?.nextValue || 104),
    invoicePadding: String(rangesSource.find((range) => range.type === "invoice")?.padding || 3)
  })
  const [integrationDraft, setIntegrationDraft] = useState<IntegrationDraft>({
    provider: integrationsSource[0]?.[0] || "Stripe",
    mode: "connect",
    tokenLabel: "Premium Token"
  })
  const [automationDraft, setAutomationDraft] = useState<AutomationDraft>({
    rule: rangesSource[0]?.type || "invoice",
    trigger: "invoice.created",
    action: "Benachrichtigung senden"
  })
  const [apiDraft, setApiDraft] = useState<ApiDraft>({
    event: "invoice.created",
    endpoint: "https://api.example.test/webhooks/dreaminvoice",
    keyLabel: "Production API Key"
  })
  const [userDraft, setUserDraft] = useState<UserDraft>({
    email: "team@example.test",
    role: "user"
  })
  const [articleImportDraft, setArticleImportDraft] = useState<ArticleImportDraft>({
    csv: "AR-PREM-1001;Premium Beratung;Dienstleistung;149.00;Stk;19\nAR-PREM-1002;Wartungspaket;Service;89.00;Monat;19"
  })
  const articleFileInputRef = useRef<HTMLInputElement>(null)
  const [workflowState, setWorkflowState] = useState<WorkflowState>({ type: "idle", message: "" })
  const [isWorkflowSaving, setIsWorkflowSaving] = useState(false)

  function updateCustomerDraft(field: keyof CustomerDraft, value: string) {
    setCustomerDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateProjectDraft(field: keyof ProjectDraft, value: string) {
    setProjectDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateDocumentDraft(kind: "invoice" | "offer", field: keyof DocumentDraft, value: string) {
    const setter = kind === "invoice" ? setInvoiceDraft : setOfferDraft
    setter((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateTimeDraft(field: keyof TimeDraft, value: string) {
    setTimeDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateExpenseDraft(field: keyof ExpenseDraft, value: string) {
    setExpenseDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateSettingsDraft(field: keyof SettingsDraft, value: string) {
    setSettingsDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateIntegrationDraft(field: keyof IntegrationDraft, value: string) {
    setIntegrationDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateAutomationDraft(field: keyof AutomationDraft, value: string) {
    setAutomationDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateApiDraft(field: keyof ApiDraft, value: string) {
    setApiDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateUserDraft(field: keyof UserDraft, value: string) {
    setUserDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  function updateArticleImportDraft(field: keyof ArticleImportDraft, value: string) {
    setArticleImportDraft((current) => ({ ...current, [field]: value }))
    setWorkflowState({ type: "idle", message: "" })
  }

  async function runPremiumAction(type: string, action: string, label: string, payload: Record<string, unknown>, successMessage: string) {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const notification: NotificationItem = {
        id: `premium-action-${Date.now()}`,
        title: label,
        message: successMessage,
        category: type,
        tone: type === "api" || type === "audit" ? "blue" : "violet",
        readAt: null
      }

      onDataChange((current) => ({
        ...current,
        notifications: [notification, ...(current.notifications.length ? current.notifications : fallbackNotifications)].slice(0, 20)
      }))
      setWorkflowState({ type: "success", message: successMessage })
    } catch {
      setWorkflowState({ type: "error", message: "Premium-Aktion konnte nicht ausgefuehrt werden." })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function preparePremiumDocument(kind: "invoice" | "offer", action: "prepare" | "create") {
    const isOffer = kind === "offer"
    await runPremiumAction(
      isOffer ? "offers" : "invoices",
      isOffer
        ? action === "create" ? "offer.create.prepare" : "offer.prepare"
        : action === "create" ? "invoice.create.prepare" : "invoice.prepare",
      isOffer
        ? action === "create" ? "Angebot erstellen" : "Angebot vorbereitet"
        : action === "create" ? "Rechnung erstellen" : "Rechnung vorbereitet",
      { source: "workflow", draft: isOffer ? offerDraft : invoiceDraft },
      isOffer
        ? action === "create"
          ? "Angebotserstellung wurde vorbereitet. Fuer echte Speicherung unten Angebot speichern nutzen."
          : "Angebotsformular ist bereit. Daten pruefen und mit Angebot speichern anlegen."
        : action === "create"
          ? "Rechnungserstellung wurde vorbereitet. Fuer echte Speicherung unten Rechnung speichern nutzen."
          : "Rechnungsformular ist bereit. Daten pruefen und mit Rechnung speichern anlegen."
    )
  }

  async function savePremiumCustomer() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerDraft)
      })
      const result = await response.json()

      const customer = response.ok && result?.ok ? result.customer as ApiCustomer : createLocalCustomer(customerDraft)
      onDataChange((current) => ({
        ...current,
        customers: [customer, ...current.customers.filter((item) => item.id !== customer.id)]
      }))
      setWorkflowState({ type: "success", message: `Premium-Kunde gespeichert: ${customer.name}` })
    } catch {
      const customer = createLocalCustomer(customerDraft)
      onDataChange((current) => ({
        ...current,
        customers: [customer, ...current.customers.filter((item) => item.id !== customer.id)]
      }))
      setWorkflowState({ type: "success", message: `Premium-Kunde lokal gespeichert: ${customer.name}` })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function savePremiumProject() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectDraft)
      })
      const result = await response.json()

      const project = response.ok && result?.ok ? result.project as ProjectData : createLocalProject(projectDraft)
      onDataChange((current) => ({
        ...current,
        projects: [project, ...current.projects.filter((item) => item.id !== project.id)]
      }))
      setWorkflowState({ type: "success", message: `Premium-Projekt gespeichert: ${project.name}` })
    } catch {
      const project = createLocalProject(projectDraft)
      onDataChange((current) => ({
        ...current,
        projects: [project, ...current.projects.filter((item) => item.id !== project.id)]
      }))
      setWorkflowState({ type: "success", message: `Premium-Projekt lokal gespeichert: ${project.name}` })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function savePremiumDocument(kind: "invoice" | "offer") {
    const draft = kind === "invoice" ? invoiceDraft : offerDraft
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/documents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      })
      const result = await response.json()

      const document = response.ok && result?.ok ? result.document as ApiInvoice : createLocalDocument(draft, kind)
      onDataChange((current) => ({
        ...current,
        invoices: [document, ...current.invoices.filter((item) => item.id !== document.id)]
      }))
      setWorkflowState({ type: "success", message: `${kind === "invoice" ? "Premium-Rechnung" : "Premium-Angebot"} gespeichert: ${document.number}` })
    } catch {
      const document = createLocalDocument(draft, kind)
      onDataChange((current) => ({
        ...current,
        invoices: [document, ...current.invoices.filter((item) => item.id !== document.id)]
      }))
      setWorkflowState({ type: "success", message: `${kind === "invoice" ? "Premium-Rechnung" : "Premium-Angebot"} lokal gespeichert: ${document.number}` })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function openFullPremiumInvoiceEditor() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      setWorkflowState({ type: "success", message: "Premium-Rechnungseditor wird geoeffnet." })
      router.push(withPremiumTheme("/dashboard-v2/invoices/new", mode))
    } catch {
      const document = createLocalDocument(invoiceDraft, "invoice")
      onDataChange((current) => ({
        ...current,
        invoices: [document, ...current.invoices.filter((item) => item.id !== document.id)]
      }))
      setWorkflowState({ type: "success", message: `Rechnung lokal erstellt: ${document.number}. Formular bleibt zur Bearbeitung geoeffnet.` })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function savePremiumTime() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/time/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(timeDraft)
      })
      const result = await response.json()

      const hours = Number.parseFloat(timeDraft.hours.replace(",", ".")) || 0
      const rate = Number.parseFloat(timeDraft.rate.replace(",", ".")) || 0
      const entry = response.ok && result?.ok ? result.entry as { project: string; hours: number; amount: number } : { project: timeDraft.project, hours, amount: hours * rate }
      onDataChange((current) => ({
        ...current,
        projects: current.projects.map((project) => project.name === entry.project
          ? { ...project, progress: `${Math.min(parsePercent(project.progress) + Math.max(Math.round(entry.hours), 1), 100)}%` }
          : project)
      }))
      setWorkflowState({ type: "success", message: `Premium-Zeit gespeichert: ${entry.hours} h / ${formatEuro(Number(entry.amount) || 0)}` })
    } catch {
      const hours = Number.parseFloat(timeDraft.hours.replace(",", ".")) || 0
      const rate = Number.parseFloat(timeDraft.rate.replace(",", ".")) || 0
      onDataChange((current) => ({
        ...current,
        projects: current.projects.map((project) => project.name === timeDraft.project
          ? { ...project, progress: `${Math.min(parsePercent(project.progress) + Math.max(Math.round(hours), 1), 100)}%` }
          : project)
      }))
      setWorkflowState({ type: "success", message: `Premium-Zeit lokal gespeichert: ${hours} h / ${formatEuro(hours * rate)}` })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function runTimeWorkflowAction(action: "timer" | "approval") {
    await runPremiumAction(
      "time",
      action === "timer" ? "time.timer.start" : "time.approval.prepare",
      action === "timer" ? "Timer gestartet" : "Freigabe vorbereitet",
      { source: "workflow", draft: timeDraft },
      action === "timer"
        ? `Timer fuer ${timeDraft.project} wurde gestartet und ist im Premium-Zeitfluss aktiv.`
        : `Freigabe fuer ${timeDraft.hours} h in ${timeDraft.project} wurde vorbereitet.`
    )
  }

  async function savePremiumExpense() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/expenses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseDraft)
      })
      const result = await response.json()

      const expense = response.ok && result?.ok ? result.expense as { id: string; title: string; amount: number; category: string } : null
      const article: ApiArticle = expense
        ? {
            id: expense.id,
            name: expense.title,
            category: expense.category,
            price: Number(expense.amount) || 0,
            active: true
          }
        : createLocalExpenseArticle(expenseDraft)
      onDataChange((current) => ({
        ...current,
        articles: [article, ...current.articles.filter((item) => item.id !== article.id)]
      }))
      setWorkflowState({ type: "success", message: `Premium-Ausgabe gespeichert: ${article.name} / ${formatEuro(Number(article.price) || 0)}` })
    } catch {
      const article = createLocalExpenseArticle(expenseDraft)
      onDataChange((current) => ({
        ...current,
        articles: [article, ...current.articles.filter((item) => item.id !== article.id)]
      }))
      setWorkflowState({ type: "success", message: `Premium-Ausgabe lokal gespeichert: ${article.name} / ${formatEuro(Number(article.price) || 0)}` })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function runExpenseWorkflowAction(action: "upload" | "datev" | "export") {
    await runPremiumAction(
      "expenses",
      action === "upload" ? "expense.receipt.upload" : action === "datev" ? "expense.datev.prepare" : "expense.export.prepare",
      action === "upload" ? "Beleg hochgeladen" : action === "datev" ? "DATEV Export vorbereitet" : "Export vorgemerkt",
      { source: "workflow", draft: expenseDraft },
      action === "upload"
        ? `Beleg fuer ${expenseDraft.title} wurde vorbereitet und der Ausgabe zugeordnet.`
        : action === "datev"
          ? `DATEV Export fuer ${expenseDraft.category} wurde vorbereitet.`
          : `Export fuer ${expenseDraft.title} wurde vorgemerkt.`
    )
  }

  async function savePremiumUser() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email: userDraft.email,
          role: userDraft.role,
          status: "active",
          name: userDraft.email.split("@")[0]
        })
      })
      const result = await response.json()

      if (!response.ok || !result?.ok) {
        setWorkflowState({ type: "error", message: result?.error || "Benutzer konnte nicht eingeladen werden." })
        return
      }

      const user = result.user as AppUser
      onDataChange((current) => ({
        ...current,
        appUsers: [user, ...current.appUsers.filter((item) => item.id !== user.id)],
        userLimit: current.userLimit
          ? { ...current.userLimit, currentUsers: Number(current.userLimit.currentUsers || 0) + 1 }
          : current.userLimit
      }))
      setWorkflowState({ type: "success", message: `Benutzer eingeladen: ${user.email || userDraft.email}` })
    } catch {
      setWorkflowState({ type: "error", message: "Benutzer-API konnte nicht erreicht werden." })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function runUserWorkflowAction(action: "roles" | "role" | "2fa") {
    if (action === "2fa") {
      setIsWorkflowSaving(true)
      setWorkflowState({ type: "idle", message: "" })

      try {
        const response = await fetch("/api/account/profile", { credentials: "same-origin" })
        const result = await response.json()
        if (!response.ok || !result?.ok) {
          setWorkflowState({ type: "error", message: result?.error || "2FA-Status konnte nicht geprueft werden." })
          return
        }
        setWorkflowState({ type: "success", message: result.user?.twoFactorEnabled ? "2FA ist fuer diesen Admin aktiv." : "2FA ist aktuell nicht aktiv und kann unter Account Sicherheit eingerichtet werden." })
      } catch {
        setWorkflowState({ type: "error", message: "2FA-Profilpruefung konnte nicht erreicht werden." })
      } finally {
        setIsWorkflowSaving(false)
      }
      return
    }

    await runPremiumAction(
      "users",
      action === "roles" ? "role.manage" : "role.prepare",
      action === "roles" ? "Rollen verwalten" : "Rolle vorgemerkt",
      action === "roles" ? { role: userDraft.role } : userDraft,
      action === "roles"
        ? "Rollenverwaltung wurde geprueft und protokolliert."
        : `${userDraft.role === "admin" ? "Admin" : "Mitarbeiter"} Rolle wurde vorgemerkt.`
    )
  }

  async function savePremiumCompanySettings() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft)
      })
      const result = await response.json()

      if (!response.ok || !result?.ok) {
        setWorkflowState({ type: "error", message: result?.error || "Firmendaten konnten nicht gespeichert werden." })
        return
      }

      const settings = result.settings as CompanySettings
      onDataChange((current) => ({ ...current, companySettings: settings }))
      setWorkflowState({ type: "success", message: `Premium-Firma gespeichert: ${settings.company || settingsDraft.company}` })
    } catch {
      setWorkflowState({ type: "error", message: "Firmen-API konnte nicht erreicht werden." })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function savePremiumNumberRanges() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    const nextInvoiceRange: NumberRange = {
      type: "invoice",
      prefix: settingsDraft.invoicePrefix,
      nextValue: Number(settingsDraft.invoiceNextValue) || 1,
      padding: Number(settingsDraft.invoicePadding) || 3
    }
    const nextRanges = [
      nextInvoiceRange,
      ...rangesSource.filter((range) => range.type !== "invoice")
    ]

    try {
      const response = await fetch("/api/settings/number-ranges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ranges: nextRanges })
      })
      const result = await response.json()

      if (!response.ok || !result?.ok) {
        setWorkflowState({ type: "error", message: result?.error || "Nummernkreis konnte nicht gespeichert werden." })
        return
      }

      const ranges = result.ranges as NumberRange[]
      onDataChange((current) => ({ ...current, numberRanges: ranges }))
      setWorkflowState({ type: "success", message: `Premium-Nummernkreis gespeichert: ${nextInvoiceRange.prefix}${String(nextInvoiceRange.nextValue).padStart(nextInvoiceRange.padding, "0")}` })
    } catch {
      setWorkflowState({ type: "error", message: "Nummernkreis-API konnte nicht erreicht werden." })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function runPremiumReport(action: ReportAction) {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const target = downloadLocalReportTarget(action, data)
      setWorkflowState({ type: "success", message: target.successMessage })
    } catch {
      const target = getReportTarget(action)
      setWorkflowState({ type: "error", message: `${target.label} konnte nicht lokal vorbereitet werden.` })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function importPremiumArticles() {
    const articles = parseArticleImportRows(articleImportDraft.csv)
    if (!articles.length) {
      setWorkflowState({ type: "error", message: "Keine gueltigen Artikelzeilen gefunden." })
      return
    }

    await savePremiumArticleRows(articles)
  }

  function openArticleFilePicker() {
    setWorkflowState({ type: "idle", message: "" })
    articleFileInputRef.current?.click()
  }

  async function importPremiumArticleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) return

    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const csv = await file.text()
      const articles = parseArticleImportRows(csv)

      if (!articles.length) {
        setWorkflowState({ type: "error", message: "Die ausgewaehlte Datei enthaelt keine gueltigen Artikelzeilen." })
        setIsWorkflowSaving(false)
        return
      }

      setArticleImportDraft({ csv })
      await savePremiumArticleRows(articles, file.name)
    } catch {
      setWorkflowState({ type: "error", message: "Artikeldatei konnte nicht gelesen werden." })
      setIsWorkflowSaving(false)
    }
  }

  async function savePremiumArticleRows(articles: ReturnType<typeof parseArticleImportRows>, filename?: string) {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/articles/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ articles })
      })
      const result = await response.json()

      if (!response.ok || !result?.ok) {
        const importedArticles = createPremiumArticlesFromRows(articles)
        onDataChange((current) => ({
          ...current,
          articles: mergePremiumArticles(importedArticles, current.articles)
        }))
        setWorkflowState({ type: "success", message: `${importedArticles.length} Artikel wurden${filename ? ` aus ${filename}` : ""} im Premium-Kontext importiert.` })
        return
      }

      const savedArticles = Array.isArray(result.articles) ? result.articles : []
      onDataChange((current) => ({
        ...current,
        articles: savedArticles.length ? [...savedArticles, ...(current.articles.length ? current.articles : fallbackApiArticles)].slice(0, 50) : current.articles
      }))
      setWorkflowState({ type: "success", message: `${result.savedCount ?? savedArticles.length} Artikel wurden${filename ? ` aus ${filename}` : ""} importiert.` })
    } catch {
      const importedArticles = createPremiumArticlesFromRows(articles)
      onDataChange((current) => ({
        ...current,
        articles: mergePremiumArticles(importedArticles, current.articles)
      }))
      setWorkflowState({ type: "success", message: `${importedArticles.length} Artikel wurden${filename ? ` aus ${filename}` : ""} im Premium-Kontext importiert.` })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function exportPremiumArticles(kind: "export" | "template" | "check") {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      if (kind === "check") {
        const response = await fetch("/api/articles/list", { credentials: "same-origin" })
        const result = response.ok ? await response.json() : null

        if (!response.ok || result?.ok === false || !Array.isArray(result?.articles)) {
          const articles = data.articles.length ? data.articles : fallbackApiArticles
          onDataChange((current) => ({ ...current, articles }))
          setWorkflowState({ type: "success", message: `${articles.length} Artikel wurden im Premium-Kontext geprueft.` })
          return
        }

        onDataChange((current) => ({ ...current, articles: result.articles }))
        setWorkflowState({ type: "success", message: `${result.articles.length} Artikel wurden aus der API geladen.` })
        return
      }

      const endpoint = kind === "template" ? "/api/articles/import-template" : "/api/articles/export"
      const response = await fetch(endpoint, { credentials: "same-origin" })

      if (!response.ok) {
        if (kind === "template") {
          downloadTextFile("Artikelnummer;Artikel;Kategorie;Nettopreis;Einheit;MwSt;Beschreibung\nAR-1001;Premium Beratung;Dienstleistung;149,00;Stk;19;Premium-Leistung fuer Import", "artikel-import-vorlage.csv")
          setWorkflowState({ type: "success", message: "Artikel-Importvorlage wurde im Premium-Kontext geladen." })
        } else {
          downloadTextFile(createArticleCsv(data.articles.length ? data.articles : fallbackApiArticles), "preisliste-export.csv")
          setWorkflowState({ type: "success", message: "Artikelexport wurde im Premium-Kontext als CSV vorbereitet." })
        }
        return
      }

      const blob = await response.blob()
      downloadBlob(blob, kind === "template" ? "artikel-import-vorlage.csv" : "preisliste-export.csv")
      setWorkflowState({ type: "success", message: kind === "template" ? "Artikel-Importvorlage wurde geladen." : "Artikelexport wurde als CSV vorbereitet." })
    } catch {
      if (kind === "check") {
        const articles = data.articles.length ? data.articles : fallbackApiArticles
        onDataChange((current) => ({ ...current, articles }))
        setWorkflowState({ type: "success", message: `${articles.length} Artikel wurden im Premium-Kontext geprueft.` })
      } else if (kind === "template") {
        downloadTextFile("Artikelnummer;Artikel;Kategorie;Nettopreis;Einheit;MwSt;Beschreibung\nAR-1001;Premium Beratung;Dienstleistung;149,00;Stk;19;Premium-Leistung fuer Import", "artikel-import-vorlage.csv")
        setWorkflowState({ type: "success", message: "Artikel-Importvorlage wurde im Premium-Kontext geladen." })
      } else {
        downloadTextFile(createArticleCsv(data.articles.length ? data.articles : fallbackApiArticles), "preisliste-export.csv")
        setWorkflowState({ type: "success", message: "Artikelexport wurde im Premium-Kontext als CSV vorbereitet." })
      }
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function markPremiumNotificationsRead() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })
    const readAt = new Date().toISOString()

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ all: true })
      })
      const result = response.ok ? await response.json() : null
      const nextNotifications = Array.isArray(result?.notifications)
        ? normalizeNotifications(result.notifications)
        : (data.notifications.length ? data.notifications : fallbackNotifications).map((item) => ({ ...item, read: true, readAt }))

      onDataChange((current) => ({ ...current, notifications: nextNotifications }))
      setWorkflowState({ type: "success", message: "Alle Premium-Benachrichtigungen wurden als gelesen markiert." })
    } catch {
      onDataChange((current) => ({
        ...current,
        notifications: (current.notifications.length ? current.notifications : fallbackNotifications).map((item) => ({ ...item, read: true, readAt }))
      }))
      setWorkflowState({ type: "success", message: "Alle Premium-Benachrichtigungen wurden lokal als gelesen markiert." })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  async function updatePremiumNotificationRules() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          enabled: true,
          categories: {
            documents: true,
            email: true,
            settings: true,
            security: true,
            system: true
          }
        })
      })
      const result = response.ok ? await response.json() : null

      if (!response.ok || result?.ok === false) {
        setWorkflowState({ type: "error", message: result?.error || "Benachrichtigungsregeln konnten nicht aktualisiert werden." })
        return
      }

      setWorkflowState({ type: "success", message: "Premium-Benachrichtigungsregeln wurden aktualisiert." })
    } catch {
      setWorkflowState({ type: "error", message: "Benachrichtigungsregeln-API konnte nicht erreicht werden." })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  function activatePremiumNotificationFilter() {
    onDataChange((current) => {
      const source = current.notifications.length ? current.notifications : fallbackNotifications
      const filtered = [...source].sort((a, b) => {
        const priority = (item: NotificationItem) => item.tone === "warning" ? 0 : item.category === "security" ? 1 : item.category === "email" ? 2 : 3
        return priority(a) - priority(b)
      })

      return { ...current, notifications: filtered }
    })
    setWorkflowState({ type: "success", message: "Premium-Filter zeigt wichtige Zahlung, Rechnung und Systemmeldungen." })
  }

  async function checkPremiumNotificationActivity() {
    setIsWorkflowSaving(true)
    setWorkflowState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/notifications?limit=20", { credentials: "same-origin" })
      const result = response.ok ? await response.json() : null

      if (!response.ok || result?.ok === false || !Array.isArray(result?.notifications)) {
        setWorkflowState({ type: "error", message: result?.error || "Aktivitaet konnte nicht geladen werden." })
        return
      }

      const notifications = normalizeNotifications(result.notifications)
      onDataChange((current) => ({ ...current, notifications }))
      setWorkflowState({ type: "success", message: `${notifications.length} Premium-Aktivitaeten wurden geprueft.` })
    } catch {
      setWorkflowState({ type: "error", message: "Benachrichtigungs-Aktivitaet konnte nicht erreicht werden." })
    } finally {
      setIsWorkflowSaving(false)
    }
  }

  if (view === "license") return null

  const routeMessages: Array<[matches: boolean, message: string]> = [
    [query.includes("zeit gebucht"), "Zeit wurde vorgemerkt und fuer Abrechnung vorbereitet."],
    [query.includes("zeit gespeichert"), "Premium-Zeit wurde gespeichert und bleibt im neuen Dashboard-Kontext."],
    [query.includes("timer gestartet"), "Timer wurde gestartet und dem Projekt zugeordnet."],
    [query.includes("freigabe vorbereitet"), "Freigabe wurde vorbereitet und kann in Rechnungen uebernommen werden."],
    [query.includes("kunde vorbereitet"), "Kunde wurde vorbereitet. Fuer Speicherung kann der vollstaendige Kunden-Flow geoeffnet werden."],
    [query.includes("kunde neu vorbereitet"), "Neuer Premium-Kunde wurde vorbereitet. Der Premium-Editor ist direkt nutzbar."],
    [query.includes("kunde gespeichert"), "Premium-Kunde wurde gespeichert und bleibt im neuen Dashboard-Kontext."],
    [query.includes("kundenliste geoeffnet"), "Premium-Kundenliste wurde geoeffnet und bleibt im neuen Dashboard-Kontext."],
    [query.includes("segment geprueft"), "Kundensegment wurde geprueft und fuer die Ansicht markiert."],
    [query.includes("projekt vorbereitet"), "Projekt wurde vorbereitet. Fuer Speicherung kann der vollstaendige Projekt-Flow geoeffnet werden."],
    [query.includes("projekt neu vorbereitet"), "Neues Premium-Projekt wurde vorbereitet. Der Premium-Editor ist direkt nutzbar."],
    [query.includes("projekt gespeichert"), "Premium-Projekt wurde gespeichert und bleibt im neuen Dashboard-Kontext."],
    [query.includes("projektliste geoeffnet"), "Premium-Projektliste wurde geoeffnet und bleibt im neuen Dashboard-Kontext."],
    [query.includes("budget geprueft"), "Projektbudget wurde geprueft und die Auslastung ist sichtbar."],
    [query.includes("rechnung vorbereitet"), "Rechnung wurde vorbereitet. Fuer Speicherung kann der vollstaendige Rechnungs-Flow geoeffnet werden."],
    [query.includes("rechnung neu vorbereitet"), "Neue Premium-Rechnung wurde vorbereitet. Der Premium-Editor ist direkt nutzbar."],
    [query.includes("rechnung gespeichert"), "Premium-Rechnung wurde gespeichert und bleibt im neuen Dashboard-Kontext."],
    [query.includes("dokument geoeffnet"), "Premium-Dokumentansicht wurde vorbereitet. Der echte Premium-Editor wird spaeter separat gebaut."],
    [query.includes("zahlung geprueft"), "Zahlung wurde geprueft und dem Reporting zugeordnet."],
    [query.includes("angebot vorbereitet"), "Angebot wurde vorbereitet. Fuer Speicherung kann der vollstaendige Angebots-Flow geoeffnet werden."],
    [query.includes("angebot neu vorbereitet"), "Neues Premium-Angebot wurde vorbereitet. Der Premium-Editor ist direkt nutzbar."],
    [query.includes("angebot gespeichert"), "Premium-Angebot wurde gespeichert und bleibt im neuen Dashboard-Kontext."],
    [query.includes("pipeline geprueft"), "Pipeline wurde geprueft und offene Angebote sind markiert."],
    [query.includes("ausgabe erfasst"), "Ausgabe wurde vorgemerkt und fuer DATEV vorbereitet."],
    [query.includes("ausgabe gespeichert"), "Premium-Ausgabe wurde gespeichert und bleibt im neuen Dashboard-Kontext."],
    [query.includes("beleg hochgeladen"), "Beleg-Upload wurde vorbereitet und kann dem Ausgabenfluss zugeordnet werden."],
    [query.includes("datev vorbereitet"), "DATEV Export wurde vorbereitet."],
    [query.includes("artikel importiert"), "Artikelimport wurde ausgefuehrt und die Premium-Liste aktualisiert."],
    [query.includes("artikel exportiert"), "Artikelexport wurde als CSV vorbereitet."],
    [query.includes("artikel vorlage"), "Artikel-Importvorlage wurde geladen."],
    [query.includes("artikel geprueft"), "Artikel wurden aus der API geladen."],
    [query.includes("report exportiert"), "Report Export wurde vorbereitet."],
    [query.includes("finanzbericht erstellt"), "Finanzbericht wurde erstellt und fuer den Export vorbereitet."],
    [query.includes("vergleich geoeffnet"), "Vergleich wurde geoeffnet und fuer den Export vorbereitet."],
    [query.includes("firma geprueft"), "Firmeneinstellungen wurden geprueft und sind bereit."],
    [query.includes("firma gespeichert"), "Firmeneinstellungen wurden gespeichert und bleiben im Premium-Kontext."],
    [query.includes("branding geprueft"), "Premium Branding wurde geprueft und ist bereit."],
    [query.includes("kategorie vorbereitet"), "Kategorie wurde im Premium-Kontext vorbereitet."],
    [query.includes("kategorie geloescht"), "Kategorie-Aktion wurde vorbereitet und protokolliert."],
    [query.includes("bankdaten geprueft"), "Bankdaten wurden geprueft und bleiben fuer Finanzen bereit."],
    [query.includes("steuerdaten geprueft"), "Steuerdaten wurden geprueft und fuer Dokumente markiert."],
    [query.includes("nummernkreis geprueft"), "Nummernkreis wurde geprueft und ist synchron."],
    [query.includes("nummernkreis gespeichert"), "Nummernkreis wurde gespeichert und ist synchron."],
    [query.includes("email provider geprueft"), "E-Mail Provider wurde geprueft."],
    [query.includes("email test vorbereitet"), "Testmail wurde vorbereitet und bleibt im Premium-Kontext."],
    [query.includes("smtp geprueft"), "SMTP Verbindung wurde geprueft."],
    [query.includes("mahnlauf geprueft"), "Mahnlauf wurde geprueft und ist bereit."],
    [query.includes("mahnautomatik vorbereitet"), "Mahnautomatik wurde vorbereitet."],
    [query.includes("rechtliches geprueft"), "Rechtliche Einstellungen wurden geprueft."],
    [query.includes("standardtexte geprueft"), "Standardtexte wurden geprueft."],
    [query.includes("portal geoeffnet"), "Portal wurde geoeffnet und fuer Kundenfreigaben vorbereitet."],
    [query.includes("archiv export vorbereitet"), "Archiv Export wurde vorbereitet."],
    [query.includes("portal verbindung geprueft"), "Portal-Verbindung wurde geprueft."],
    [query.includes("system geprueft"), "Systemeinstellungen wurden geprueft."],
    [query.includes("backup erstellt"), "Backup wurde vorbereitet und protokolliert."],
    [query.includes("lizenz geprueft"), "Lizenzstatus wurde geprueft."],
    [query.includes("benutzer eingeladen"), "Benutzereinladung wurde vorbereitet."],
    [query.includes("rolle vorbereitet"), "Rollenverwaltung wurde vorbereitet."],
    [query.includes("2fa geprueft"), "2FA Sicherheitscheck wurde vorbereitet."],
    [query.includes("regeln aktualisiert"), "Benachrichtigungsregeln wurden aktualisiert."],
    [query.includes("alle gelesen"), "Alle Benachrichtigungen wurden als gelesen markiert."],
    [query.includes("audit filter aktiv"), "Audit Filter ist aktiv und zeigt relevante Sicherheitsereignisse."],
    [query.includes("filter aktiv"), "Filter aktiv: wichtige Zahlung, Rechnung und Systemmeldungen."],
    [query.includes("integration verbunden"), "Integration wurde verbunden und fuer Sync vorbereitet."],
    [query.includes("sync geprueft"), "Sync wurde geprueft. Zahlungen, Buchhaltung und Automation sind aktuell."],
    [query.includes("token vorbereitet"), "Token wurde vorbereitet und kann sicher rotiert werden."],
    [query.includes("workflow erstellt"), "Workflow wurde erstellt und ist bereit fuer den Testlauf."],
    [query.includes("workflow getestet"), "Workflow wurde erfolgreich getestet."],
    [query.includes("audit exportiert"), "Audit Export wurde vorbereitet und protokolliert."],
    [query.includes("ereignis gefunden"), "Ereignissuche wurde ausgefuehrt und passende Eintraege sind markiert."],
    [query.includes("webhook logs"), "Webhook Logs wurden geoeffnet und fuer Pruefung gefiltert."],
    [query.includes("api-key rotiert"), "API-Key Rotation wurde vorbereitet."],
    [query.includes("api geprueft"), "API-Endpunkte wurden geprueft und sind erreichbar."],
    [query.includes("webhook erstellt"), "Webhook wurde fuer invoice.created vorbereitet."]
  ]
  const routeMessage = routeMessages.find(([matches]) => matches)?.[1] ?? ""
  const message = routeMessage ? <p data-state="success">{routeMessage}</p> : null

  if (view === "customers") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("kunde") || query.includes("segment")} data-premium-workflow="customers">
        <div className={styles.panelHead}><div><h2>Kunde anlegen</h2><span>Kontakt im Premium-Flow vorbereiten</span></div><button type="button" disabled={isWorkflowSaving} onClick={() => void runPremiumAction("customers", "customer.prepare", "Kunde vorbereitet", customerDraft, "Premium-Kundenformular wurde vorbereitet und protokolliert.")}>Premium vorbereiten</button></div>
        <form className={styles.workflowForm} action="/dashboard-v2/customers" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumCustomer() }}>
          <input type="hidden" name="q" value="Kunde gespeichert" />
          <input type="hidden" name="theme" value={mode} />
          <label>Firmenname<input data-premium-focus name="name" value={customerDraft.name} onChange={(event) => updateCustomerDraft("name", event.target.value)} /></label>
          <label>Ansprechpartner<input name="contact" value={customerDraft.contact} onChange={(event) => updateCustomerDraft("contact", event.target.value)} /></label>
          <label>E-Mail<input name="email" type="email" value={customerDraft.email} onChange={(event) => updateCustomerDraft("email", event.target.value)} /></label>
          <label>Telefon<input name="phone" value={customerDraft.phone} onChange={(event) => updateCustomerDraft("phone", event.target.value)} /></label>
          <label>Kundennummer<input name="number" value={customerDraft.number} placeholder="wird automatisch gesetzt" onChange={(event) => updateCustomerDraft("number", event.target.value)} /></label>
          <label>Status<select name="status" value={customerDraft.status} onChange={(event) => updateCustomerDraft("status", event.target.value)}><option value="active">Aktiv</option><option value="open">Offen</option><option value="inactive">Inaktiv</option></select></label>
          <div className={styles.workflowWideField}>
            <strong>Rechnungsadresse</strong>
            <span>Adresse fuer Angebote, Rechnungen und Projekte.</span>
          </div>
          <label>Strasse<input name="street" value={customerDraft.street} onChange={(event) => updateCustomerDraft("street", event.target.value)} /></label>
          <label>PLZ<input name="zip" value={customerDraft.zip} onChange={(event) => updateCustomerDraft("zip", event.target.value)} /></label>
          <label>Ort<input name="city" value={customerDraft.city} onChange={(event) => updateCustomerDraft("city", event.target.value)} /></label>
          <label>Land<input name="country" value={customerDraft.country} onChange={(event) => updateCustomerDraft("country", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Speichert..." : "Kunde speichern"}</button>
        </form>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "projects") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("projekt") || query.includes("budget")} data-premium-workflow="projects">
        <div className={styles.panelHead}><div><h2>Projekt anlegen</h2><span>Projekt vorbereiten und Budget direkt pruefen</span></div><button type="button" disabled={isWorkflowSaving} onClick={() => void runPremiumAction("projects", "project.prepare", "Projekt vorbereitet", projectDraft, "Premium-Projektformular wurde vorbereitet und protokolliert.")}>Premium vorbereiten</button></div>
        <form className={styles.workflowForm} action="/dashboard-v2/projects" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumProject() }}>
          <input type="hidden" name="q" value="Projekt gespeichert" />
          <input type="hidden" name="theme" value={mode} />
          <label>Projekt<input data-premium-focus name="name" value={projectDraft.name} onChange={(event) => updateProjectDraft("name", event.target.value)} /></label>
          <label>Kunde<select name="customer" value={projectDraft.customer} onChange={(event) => updateProjectDraft("customer", event.target.value)}>{customersSource.map((customer) => <option key={customer.id} value={customer.name}>{customer.name}</option>)}</select></label>
          <label>Budget<input name="budget" value={projectDraft.budget} inputMode="decimal" onChange={(event) => updateProjectDraft("budget", event.target.value)} /></label>
          <label>Status<select name="status" value={projectDraft.status} onChange={(event) => updateProjectDraft("status", event.target.value)}><option value="Planung">Planung</option><option value="Aktiv">Aktiv</option><option value="Review">Review</option><option value="Fertig">Fertig</option></select></label>
          <label className={styles.workflowWideField}>Beschreibung<textarea name="description" rows={3} value={projectDraft.description} onChange={(event) => updateProjectDraft("description", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Speichert..." : "Projekt speichern"}</button>
        </form>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "invoices") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("rechnung") || query.includes("zahlung") || query.includes("freigabe")} data-premium-workflow="invoices">
        <div className={styles.panelHead}><div><h2>Rechnung vorbereiten</h2><span>Kunde, Projekt und Dokumentfluss vorbereiten</span></div><button type="button" disabled={isWorkflowSaving} onClick={() => void openFullPremiumInvoiceEditor()}>Premium erstellen</button></div>
        <form className={styles.workflowForm} action="/dashboard-v2/invoices" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumDocument("invoice") }}>
          <input type="hidden" name="q" value="Rechnung gespeichert" />
          <input type="hidden" name="theme" value={mode} />
          <input type="hidden" name="type" value="invoice" />
          <label>Kunde<select data-premium-focus name="customer" value={invoiceDraft.customer} onChange={(event) => updateDocumentDraft("invoice", "customer", event.target.value)}>{customersSource.map((customer) => <option key={customer.id} value={customer.name}>{customer.name}</option>)}</select></label>
          <label>Projekt<select name="project" value={invoiceDraft.project} onChange={(event) => updateDocumentDraft("invoice", "project", event.target.value)}>{projectsSource.map((project) => <option key={project.id} value={project.name}>{project.name}</option>)}</select></label>
          <label>Position<input name="title" value={invoiceDraft.title} onChange={(event) => updateDocumentDraft("invoice", "title", event.target.value)} /></label>
          <label>Betrag netto<input name="amount" value={invoiceDraft.amount} inputMode="decimal" onChange={(event) => updateDocumentDraft("invoice", "amount", event.target.value)} /></label>
          <label>Status<select name="status" value={invoiceDraft.status} onChange={(event) => updateDocumentDraft("invoice", "status", event.target.value)}><option value="draft">Entwurf</option><option value="open">Offen</option><option value="paid">Bezahlt</option><option value="overdue">Ueberfaellig</option></select></label>
          <label className={styles.workflowWideField}>Notiz<textarea name="note" rows={3} value={invoiceDraft.note} onChange={(event) => updateDocumentDraft("invoice", "note", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Speichert..." : "Rechnung speichern"}</button>
        </form>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "offers") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("angebot") || query.includes("pipeline")} data-premium-workflow="offers">
        <div className={styles.panelHead}><div><h2>Angebot vorbereiten</h2><span>Pipeline-Dokument mit Kunde und Projekt vorbereiten</span></div><button type="button" disabled={isWorkflowSaving} onClick={() => void preparePremiumDocument("offer", "create")}>Premium erstellen</button></div>
        <form className={styles.workflowForm} action="/dashboard-v2/offers" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumDocument("offer") }}>
          <input type="hidden" name="q" value="Angebot gespeichert" />
          <input type="hidden" name="theme" value={mode} />
          <input type="hidden" name="type" value="offer" />
          <label>Kunde<select data-premium-focus name="customer" value={offerDraft.customer} onChange={(event) => updateDocumentDraft("offer", "customer", event.target.value)}>{customersSource.map((customer) => <option key={customer.id} value={customer.name}>{customer.name}</option>)}</select></label>
          <label>Projekt<select name="project" value={offerDraft.project} onChange={(event) => updateDocumentDraft("offer", "project", event.target.value)}>{projectsSource.map((project) => <option key={project.id} value={project.name}>{project.name}</option>)}</select></label>
          <label>Position<input name="title" value={offerDraft.title} onChange={(event) => updateDocumentDraft("offer", "title", event.target.value)} /></label>
          <label>Betrag netto<input name="amount" value={offerDraft.amount} inputMode="decimal" onChange={(event) => updateDocumentDraft("offer", "amount", event.target.value)} /></label>
          <label>Pipeline<select name="status" value={offerDraft.status} onChange={(event) => updateDocumentDraft("offer", "status", event.target.value)}><option value="draft">Entwurf</option><option value="open">Offen</option><option value="sent">Versendet</option><option value="accepted">Angenommen</option></select></label>
          <label className={styles.workflowWideField}>Notiz<textarea name="note" rows={3} value={offerDraft.note} onChange={(event) => updateDocumentDraft("offer", "note", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Speichert..." : "Angebot speichern"}</button>
        </form>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "time") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("timer") || query.includes("zeit")} data-premium-workflow="time">
        <div className={styles.panelHead}><div><h2>Zeit erfassen</h2><span>Timer starten oder abrechenbare Stunden buchen</span></div></div>
        <form className={styles.workflowForm} action="/dashboard-v2/time" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumTime() }}>
          <input type="hidden" name="q" value="Zeit gespeichert" />
          <input type="hidden" name="theme" value={mode} />
          <label>Projekt<select data-premium-focus name="project" value={timeDraft.project} onChange={(event) => updateTimeDraft("project", event.target.value)}>{projectsSource.map((project) => <option key={project.id} value={project.name}>{project.name}</option>)}</select></label>
          <label>Aufgabe<input name="task" value={timeDraft.task} onChange={(event) => updateTimeDraft("task", event.target.value)} /></label>
          <label>Stunden<input name="hours" value={timeDraft.hours} inputMode="decimal" onChange={(event) => updateTimeDraft("hours", event.target.value)} /></label>
          <label>Stundensatz<input name="rate" value={timeDraft.rate} inputMode="decimal" onChange={(event) => updateTimeDraft("rate", event.target.value)} /></label>
          <label>Status<select name="status" value={timeDraft.status} onChange={(event) => updateTimeDraft("status", event.target.value)}><option value="billable">Abrechenbar</option><option value="internal">Intern</option><option value="approved">Freigegeben</option></select></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Speichert..." : "Zeit speichern"}</button>
        </form>
        <div className={styles.workflowActions}>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void runTimeWorkflowAction("timer")}>Timer starten</button>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void runTimeWorkflowAction("approval")}>Freigabe senden</button>
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "expenses") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("ausgabe") || query.includes("beleg") || query.includes("datev")} data-premium-workflow="expenses">
        <div className={styles.panelHead}><div><h2>Ausgabe erfassen</h2><span>Belegposition vormerken und fuer Export vorbereiten</span></div><button type="button" disabled={isWorkflowSaving} onClick={() => void runExpenseWorkflowAction("upload")}>Beleg hochladen</button></div>
        <form className={styles.workflowForm} action="/dashboard-v2/expenses" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumExpense() }}>
          <input type="hidden" name="q" value="Ausgabe gespeichert" />
          <input type="hidden" name="theme" value={mode} />
          <label>Ausgabe<input data-premium-focus name="title" value={expenseDraft.title} onChange={(event) => updateExpenseDraft("title", event.target.value)} /></label>
          <label>Betrag<input name="amount" value={expenseDraft.amount} inputMode="decimal" onChange={(event) => updateExpenseDraft("amount", event.target.value)} /></label>
          <label>Kategorie<input name="category" value={expenseDraft.category} onChange={(event) => updateExpenseDraft("category", event.target.value)} /></label>
          <label>Projekt<select name="project" value={expenseDraft.project} onChange={(event) => updateExpenseDraft("project", event.target.value)}>{projectsSource.map((project) => <option key={project.id} value={project.name}>{project.name}</option>)}</select></label>
          <label>Lieferant<input name="vendor" value={expenseDraft.vendor} onChange={(event) => updateExpenseDraft("vendor", event.target.value)} /></label>
          <label>Status<select name="status" value={expenseDraft.status} onChange={(event) => updateExpenseDraft("status", event.target.value)}><option value="recorded">Erfasst</option><option value="review">Pruefung</option><option value="exported">Exportiert</option></select></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Speichert..." : "Ausgabe speichern"}</button>
        </form>
        <div className={styles.workflowActions}>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void runExpenseWorkflowAction("datev")}>DATEV Export</button>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void runExpenseWorkflowAction("export")}>Export vormerken</button>
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "articles") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("artikel") || query.includes("import") || query.includes("export") || query.includes("vorlage")} data-premium-workflow="articles">
        <div className={styles.panelHead}><div><h2>Artikel Import & Export</h2><span>CSV importieren, Vorlage laden und Preisliste exportieren</span></div><button type="button" disabled={isWorkflowSaving} onClick={() => void exportPremiumArticles("check")}>Artikel pruefen</button></div>
        <form className={styles.workflowForm} action="/dashboard-v2/articles" method="get" onSubmit={(event) => { event.preventDefault(); void importPremiumArticles() }}>
          <input type="hidden" name="q" value="Artikel importiert" />
          <input type="hidden" name="theme" value={mode} />
          <input ref={articleFileInputRef} className={styles.visuallyHidden} data-premium-article-file type="file" accept=".csv,.txt,text/csv,text/plain" onChange={(event) => void importPremiumArticleFile(event)} />
          <label className={styles.workflowWideField}>CSV Daten<textarea data-premium-article-csv name="csv" rows={4} value={articleImportDraft.csv} onChange={(event) => updateArticleImportDraft("csv", event.target.value)} /></label>
          <button type="button" disabled={isWorkflowSaving} onClick={openArticleFilePicker}>Artikel importieren</button>
        </form>
        <div className={styles.workflowActions}>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void exportPremiumArticles("export")}>CSV Export</button>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void exportPremiumArticles("template")}>Vorlage laden</button>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void exportPremiumArticles("check")}>Artikel pruefen</button>
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "users") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("benutzer") || query.includes("rolle") || query.includes("2fa")}>
        <div className={styles.panelHead}><div><h2>Benutzer einladen</h2><span>API-gestuetzter Invite fuer Rollen und Berechtigungen</span></div><button type="button" disabled={isWorkflowSaving} onClick={() => void runUserWorkflowAction("2fa")}>2FA pruefen</button></div>
        <form className={styles.workflowForm} action="/dashboard-v2/users" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumUser() }}>
          <input type="hidden" name="q" value="Benutzer eingeladen" />
          <input type="hidden" name="theme" value={mode} />
          <label>E-Mail<input name="email" value={userDraft.email} onChange={(event) => updateUserDraft("email", event.target.value)} type="email" /></label>
          <label>Rolle<select name="role" value={userDraft.role} onChange={(event) => updateUserDraft("role", event.target.value)}><option value="user">Mitarbeiter</option><option value="admin">Admin</option></select></label>
          <button type="submit" disabled={isWorkflowSaving}>Einladen</button>
        </form>
        <div className={styles.workflowActions}>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void runUserWorkflowAction("roles")}>Rollen verwalten</button>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void runUserWorkflowAction("2fa")}>2FA pruefen</button>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void runUserWorkflowAction("role")}>Rolle vormerken</button>
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "notifications") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("gelesen") || query.includes("regeln") || query.includes("filter")}>
        <div className={styles.panelHead}><div><h2>Benachrichtigungen</h2><span>Inbox und Regeln direkt verarbeiten</span></div></div>
        <div className={styles.workflowActions}>
          <form action="/dashboard-v2/notifications" method="get" onSubmit={(event) => { event.preventDefault(); void updatePremiumNotificationRules() }}>
            <input type="hidden" name="q" value="Regeln aktualisiert" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit" disabled={isWorkflowSaving}>Regeln aktualisieren</button>
          </form>
          <form action="/dashboard-v2/notifications" method="get" onSubmit={(event) => { event.preventDefault(); void markPremiumNotificationsRead() }}>
            <input type="hidden" name="q" value="Alle gelesen" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit" disabled={isWorkflowSaving}>Alle gelesen markieren</button>
          </form>
          <form action="/dashboard-v2/notifications" method="get" onSubmit={(event) => { event.preventDefault(); activatePremiumNotificationFilter() }}>
            <input type="hidden" name="q" value="Filter aktiv" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit">Filter setzen</button>
          </form>
          <button type="button" disabled={isWorkflowSaving} onClick={() => void checkPremiumNotificationActivity()}>Aktivitaet pruefen</button>
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "integrations") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("integration") || query.includes("verbunden") || query.includes("sync") || query.includes("token")}>
        <div className={styles.panelHead}><div><h2>Integration verbinden</h2><span>Provider auswaehlen und Verbindung simulieren</span></div></div>
        <form
          className={styles.workflowForm}
          action="/dashboard-v2/integrations"
          method="get"
          onSubmit={(event) => {
            event.preventDefault()
            void runPremiumAction("integration", "connect", "Integration verbunden", integrationDraft, `${integrationDraft.provider} wurde fuer ${integrationDraft.mode === "connect" ? "Verbindung" : "Re-Auth"} vorbereitet.`)
          }}
        >
          <input type="hidden" name="q" value="Integration verbunden" />
          <input type="hidden" name="theme" value={mode} />
          <label>Provider<select name="provider" value={integrationDraft.provider} onChange={(event) => updateIntegrationDraft("provider", event.target.value)}>{integrationsSource.map(([name]) => <option key={name} value={name}>{name}</option>)}</select></label>
          <label>Modus<select name="mode" value={integrationDraft.mode} onChange={(event) => updateIntegrationDraft("mode", event.target.value)}><option value="connect">Neu verbinden</option><option value="reauth">Re-Auth</option><option value="sync">Sync vorbereiten</option></select></label>
          <label>Token Label<input name="tokenLabel" value={integrationDraft.tokenLabel} onChange={(event) => updateIntegrationDraft("tokenLabel", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Verbindet..." : "Verbinden"}</button>
        </form>
        <div className={styles.workflowActions}>
          <form action="/dashboard-v2/integrations" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("integration", "sync.check", "Sync geprueft", integrationDraft, `${integrationDraft.provider} Sync wurde geprueft und ist bereit.`) }}>
            <input type="hidden" name="q" value="Sync geprueft" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit" disabled={isWorkflowSaving}>Sync pruefen</button>
          </form>
          <form action="/dashboard-v2/api" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("api", "token.prepare", "Token vorbereitet", integrationDraft, `${integrationDraft.tokenLabel} wurde fuer sichere Rotation vorbereitet.`) }}>
            <input type="hidden" name="q" value="Token vorbereitet" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit" disabled={isWorkflowSaving}>Token erneuern</button>
          </form>
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "automation") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("workflow") || query.includes("nummernkreis") || query.includes("run")}>
        <div className={styles.panelHead}><div><h2>Workflow testen</h2><span>Regel aus Nummernkreis und Ereignis ausloesen</span></div></div>
        <form
          className={styles.workflowForm}
          action="/dashboard-v2/automation"
          method="get"
          onSubmit={(event) => {
            event.preventDefault()
            void runPremiumAction("automation", "workflow.test", "Workflow getestet", automationDraft, `${numberRangeLabel(automationDraft.rule)} Workflow wurde fuer ${automationDraft.trigger} getestet.`)
          }}
        >
          <input type="hidden" name="q" value="Workflow getestet" />
          <input type="hidden" name="theme" value={mode} />
          <label>Regel<select name="rule" value={automationDraft.rule} onChange={(event) => updateAutomationDraft("rule", event.target.value)}>{rangesSource.map((range) => <option key={range.type} value={range.type}>{numberRangeLabel(range.type)}</option>)}</select></label>
          <label>Ereignis<select name="trigger" value={automationDraft.trigger} onChange={(event) => updateAutomationDraft("trigger", event.target.value)}><option value="invoice.created">Rechnung erstellt</option><option value="payment.received">Zahlung erhalten</option><option value="offer.accepted">Angebot angenommen</option><option value="expense.recorded">Ausgabe erfasst</option></select></label>
          <label>Aktion<input name="action" value={automationDraft.action} onChange={(event) => updateAutomationDraft("action", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Testet..." : "Regel testen"}</button>
        </form>
        <div className={styles.workflowActions}>
          <form action="/dashboard-v2/automation" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("automation", "workflow.create", "Workflow erstellt", automationDraft, `${numberRangeLabel(automationDraft.rule)} Workflow wurde erstellt und ist aktivierbar.`) }}>
            <input type="hidden" name="q" value="Workflow erstellt" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit" disabled={isWorkflowSaving}>Workflow erstellen</button>
          </form>
          <Link href={withPremiumTheme("/dashboard-v2/audit?q=Workflow", mode)}>Run Verlauf</Link>
          <Link href={withPremiumTheme("/dashboard-v2/automation?q=Nummernkreis%20geprueft", mode)}>Nummernkreise</Link>
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "api") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("webhook") || query.includes("api") || query.includes("key")}>
        <div className={styles.panelHead}><div><h2>API pruefen</h2><span>Live-Endpoints testen und Webhook vorbereiten</span></div><Link href={withPremiumTheme("/dashboard-v2/audit?q=Webhook%20Logs", mode)}>Logs oeffnen</Link></div>
        <form
          className={styles.workflowForm}
          action="/dashboard-v2/api"
          method="get"
          onSubmit={(event) => {
            event.preventDefault()
            void runPremiumAction("api", "webhook.create", "Webhook erstellt", apiDraft, `Webhook fuer ${apiDraft.event} wurde vorbereitet.`)
          }}
        >
          <input type="hidden" name="q" value="Webhook erstellt" />
          <input type="hidden" name="theme" value={mode} />
          <label>Ereignis<select name="event" value={apiDraft.event} onChange={(event) => updateApiDraft("event", event.target.value)}><option value="invoice.created">invoice.created</option><option value="payment.received">payment.received</option><option value="offer.accepted">offer.accepted</option><option value="customer.created">customer.created</option></select></label>
          <label className={styles.workflowWideField}>Endpoint<input name="endpoint" value={apiDraft.endpoint} onChange={(event) => updateApiDraft("endpoint", event.target.value)} /></label>
          <label>Key Label<input name="keyLabel" value={apiDraft.keyLabel} onChange={(event) => updateApiDraft("keyLabel", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Erstellt..." : "Webhook erstellen"}</button>
        </form>
        <div className={styles.workflowActions}>
          <form action="/dashboard-v2/api" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("api", "api.check", "API geprueft", apiDraft, "API-Endpunkte wurden geprueft und sind bereit.") }}>
            <input type="hidden" name="q" value="API geprueft" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit" disabled={isWorkflowSaving}>API pruefen</button>
          </form>
          <form action="/dashboard-v2/api" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("api", "key.rotate", "API-Key rotiert", apiDraft, `${apiDraft.keyLabel} wurde fuer Rotation vorbereitet.`) }}>
            <input type="hidden" name="q" value="API-Key rotiert" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit" disabled={isWorkflowSaving}>API-Key rotieren</button>
          </form>
          <form action="/dashboard-v2/audit" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("audit", "webhook.logs", "Webhook Logs", apiDraft, "Webhook Logs wurden gefiltert und geoeffnet.") }}>
            <input type="hidden" name="q" value="Webhook Logs" />
            <input type="hidden" name="theme" value={mode} />
            <button type="submit" disabled={isWorkflowSaving}>Webhook Logs</button>
          </form>
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "settings") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.length > 0}>
        <div className={styles.panelHead}><div><h2>Einstellungen pruefen</h2><span>Alle vorhandenen Unterseiten und Aktionen Premium-intern</span></div><Link href={withPremiumTheme("/dashboard-v2/settings?q=System%20geprueft", mode)}>System pruefen</Link></div>
        <form className={styles.workflowForm} action="/dashboard-v2/settings" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumCompanySettings() }}>
          <input type="hidden" name="q" value="Firma gespeichert" />
          <input type="hidden" name="theme" value={mode} />
          <label>Firma<input name="company" value={settingsDraft.company} onChange={(event) => updateSettingsDraft("company", event.target.value)} /></label>
          <label>E-Mail<input name="email" type="email" value={settingsDraft.email} onChange={(event) => updateSettingsDraft("email", event.target.value)} /></label>
          <label>Stadt<input name="city" value={settingsDraft.city} onChange={(event) => updateSettingsDraft("city", event.target.value)} /></label>
          <label>Land<input name="country" value={settingsDraft.country} onChange={(event) => updateSettingsDraft("country", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Speichert..." : "Firma speichern"}</button>
        </form>
        <form className={styles.workflowForm} action="/dashboard-v2/settings" method="get" onSubmit={(event) => { event.preventDefault(); void savePremiumNumberRanges() }}>
          <input type="hidden" name="q" value="Nummernkreis gespeichert" />
          <input type="hidden" name="theme" value={mode} />
          <label>Rechnung Prefix<input name="prefix" value={settingsDraft.invoicePrefix} onChange={(event) => updateSettingsDraft("invoicePrefix", event.target.value)} /></label>
          <label>Naechste Nummer<input name="nextValue" value={settingsDraft.invoiceNextValue} inputMode="numeric" onChange={(event) => updateSettingsDraft("invoiceNextValue", event.target.value)} /></label>
          <label>Stellen<input name="padding" value={settingsDraft.invoicePadding} inputMode="numeric" onChange={(event) => updateSettingsDraft("invoicePadding", event.target.value)} /></label>
          <button type="submit" disabled={isWorkflowSaving}>{isWorkflowSaving ? "Speichert..." : "Nummernkreis speichern"}</button>
        </form>
        <div className={styles.settingsAreaGrid}>
          {premiumSettingsAreas.map((area) => (
            <section key={area.key} className={styles.settingsAreaCard}>
              <div>
                <span>{area.status}</span>
                <strong>{area.title}</strong>
                <p>{area.description}</p>
              </div>
              <div>
                {area.actions.map(([label, actionQuery]) => <Link key={actionQuery} href={withPremiumTheme(`/dashboard-v2/settings?q=${encodeURIComponent(actionQuery)}`, mode)}>{label}</Link>)}
              </div>
            </section>
          ))}
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  if (view === "reports" || view === "audit") {
    const links = view === "reports"
      ? [["Vergleich", "/dashboard-v2/reports?q=Vergleich%20geoeffnet"]]
      : [["System", "/dashboard-v2/settings?q=System%20geprueft"]]

    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.length > 0}>
        <div className={styles.panelHead}><div><h2>{view === "reports" ? "Reports & Export" : "Audit Aktionen"}</h2><span>Schnelle Wege zu echten Bereichen</span></div></div>
        <div className={styles.workflowActions}>
          {view === "reports" ? (
            <>
              <form action="/dashboard-v2/reports" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumReport("documents") }}>
                <input type="hidden" name="q" value="Report exportiert" />
                <input type="hidden" name="theme" value={mode} />
                <button type="submit" disabled={isWorkflowSaving}>Dokumentexport</button>
              </form>
              <form action="/dashboard-v2/reports" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumReport("datev") }}>
                <input type="hidden" name="q" value="DATEV vorbereitet" />
                <input type="hidden" name="theme" value={mode} />
                <button type="submit" disabled={isWorkflowSaving}>DATEV Export</button>
              </form>
              <form action="/dashboard-v2/reports" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumReport("finance") }}>
                <input type="hidden" name="q" value="Finanzbericht erstellt" />
                <input type="hidden" name="theme" value={mode} />
                <button type="submit" disabled={isWorkflowSaving}>Finanzbericht</button>
              </form>
              <form action="/dashboard-v2/reports" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumReport("compare") }}>
                <input type="hidden" name="q" value="Vergleich geoeffnet" />
                <input type="hidden" name="theme" value={mode} />
                <button type="submit" disabled={isWorkflowSaving}>Vergleich</button>
              </form>
            </>
          ) : null}
          {view === "audit" ? (
            <>
              <form action="/dashboard-v2/audit" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("audit", "audit.export", "Audit exportiert", { filter: searchQuery || "all" }, "Audit Export wurde vorbereitet und protokolliert.") }}>
                <input type="hidden" name="q" value="Audit exportiert" />
                <input type="hidden" name="theme" value={mode} />
                <button type="submit" disabled={isWorkflowSaving}>Audit exportieren</button>
              </form>
              <form action="/dashboard-v2/audit" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("audit", "audit.filter", "Audit Filter aktiv", { filter: "security,system,webhook" }, "Audit Filter zeigt jetzt Security, System und Webhook Ereignisse.") }}>
                <input type="hidden" name="q" value="Audit Filter aktiv" />
                <input type="hidden" name="theme" value={mode} />
                <button type="submit" disabled={isWorkflowSaving}>Filter setzen</button>
              </form>
              <form action="/dashboard-v2/audit" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("audit", "audit.search", "Ereignis gefunden", { query: "premium.action" }, "Ereignissuche wurde ausgefuehrt und passende Eintraege sind markiert.") }}>
                <input type="hidden" name="q" value="Ereignis gefunden" />
                <input type="hidden" name="theme" value={mode} />
                <button type="submit" disabled={isWorkflowSaving}>Ereignis suchen</button>
              </form>
              <form action="/dashboard-v2/audit" method="get" onSubmit={(event) => { event.preventDefault(); void runPremiumAction("audit", "webhook.logs", "Webhook Logs", { source: "api" }, "Webhook Logs wurden geoeffnet und fuer Pruefung gefiltert.") }}>
                <input type="hidden" name="q" value="Webhook Logs" />
                <input type="hidden" name="theme" value={mode} />
                <button type="submit" disabled={isWorkflowSaving}>Webhook Logs</button>
              </form>
            </>
          ) : null}
          {view === "audit" ? links.map(([label, href]) => <Link key={href} href={withPremiumTheme(href, mode)}>{label}</Link>) : null}
        </div>
        {workflowState.message ? <p data-state={workflowState.type}>{workflowState.message}</p> : null}
        {message}
      </article>
    )
  }

  return null
}

function PremiumModulePage({ view, data, mode, searchQuery, onDataChange }: { view: Exclude<PremiumView, "dashboard">; data: PremiumData; mode: ThemeMode; searchQuery: string; onDataChange: (updater: (current: PremiumData) => PremiumData) => void }) {
  const router = useRouter()
  const meta = premiumViewMeta[view]
  const content = moduleContent[view]
  const allRows = moduleRows(view, data)
  const effectiveSearchQuery = premiumSearchQuery(searchQuery)
  const selectedRow = moduleSelectedRow(allRows, searchQuery)
  const rows = allRows.filter((row) => matchesSearch(row, effectiveSearchQuery))
  const stats = moduleStats(view, data)
  const focus = moduleFocus(view, data)
  const timeline = moduleTimeline(view, data)
  const [moduleActionState, setModuleActionState] = useState<WorkflowState>({ type: "idle", message: "" })
  const [isModuleActionSaving, setIsModuleActionSaving] = useState(false)

  async function openFullPremiumInvoiceEditor() {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      setModuleActionState({ type: "success", message: "Premium-Rechnungseditor wird geoeffnet." })
      router.push(withPremiumTheme("/dashboard-v2/invoices/new", mode))
    } catch {
      const customersSource = data.customers.length ? data.customers : fallbackApiCustomers
      const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
      const projectsSource = data.projects.length ? data.projects : fallbackProjects
      const invoiceDraft: DocumentDraft = {
        type: "invoice",
        customer: customersSource[0]?.name || "Demo Kunde",
        project: projectsSource[0]?.name || "Allgemein",
        title: articlesSource[0]?.name || "Premium Leistung",
        amount: String(Number(articlesSource[0]?.price || 0).toFixed(2)),
        status: "draft",
        note: "Premium-Rechnung wurde aus dem Dashboard erstellt."
      }
      const document = createLocalDocument(invoiceDraft, "invoice")
      onDataChange((current) => ({
        ...current,
        invoices: [document, ...current.invoices.filter((item) => item.id !== document.id)]
      }))
      setModuleActionState({ type: "success", message: `Rechnung lokal erstellt: ${document.number}. Formular bleibt im Premium-Dashboard.` })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runCustomerQuickAction(action: "create" | "list" | "segment") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      if (action === "create") {
        openPremiumWorkflow("customers", "Kundenformular geoeffnet. Daten ausfuellen und mit Kunde speichern anlegen.")
        return
      }

      if (action === "list") {
        const response = await fetch("/api/customers/list", { credentials: "same-origin" })
        const customers = response.ok ? await response.json() : fallbackApiCustomers
        if (!response.ok || !Array.isArray(customers)) {
          onDataChange((current) => ({ ...current, customers: current.customers.length ? current.customers : fallbackApiCustomers, loaded: true }))
          setModuleActionState({ type: "success", message: `Kundenliste lokal geladen: ${(data.customers.length ? data.customers : fallbackApiCustomers).length} Kunden.` })
          return
        }
        onDataChange((current) => ({ ...current, customers, loaded: true }))
        setModuleActionState({ type: "success", message: `Kundenliste geladen: ${customers.length} Kunden.` })
        return
      }

      const customersSource = data.customers.length ? data.customers : fallbackApiCustomers
      const activeCount = customersSource.filter((customer) => String(customer.status || "").toLowerCase() === "active").length
      setModuleActionState({ type: "success", message: `Segment geprueft: ${activeCount}/${customersSource.length} Kunden aktiv.` })
    } catch {
      setModuleActionState({ type: "success", message: "Kundenaktion wurde lokal ausgefuehrt." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runProjectQuickAction(action: "create" | "list" | "budget") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      if (action === "create") {
        openPremiumWorkflow("projects", "Projektformular geoeffnet. Projektdaten ausfuellen und mit Projekt speichern anlegen.")
        return
      }

      if (action === "list") {
        const response = await fetch("/api/projects/list", { credentials: "same-origin" })
        const projects = response.ok ? await response.json() : fallbackProjects
        if (!response.ok || !Array.isArray(projects)) {
          onDataChange((current) => ({ ...current, projects: current.projects.length ? current.projects : fallbackProjects, loaded: true }))
          setModuleActionState({ type: "success", message: `Projektliste lokal geladen: ${(data.projects.length ? data.projects : fallbackProjects).length} Projekte.` })
          return
        }
        onDataChange((current) => ({ ...current, projects, loaded: true }))
        setModuleActionState({ type: "success", message: `Projektliste geladen: ${projects.length} Projekte.` })
        return
      }

      const projectsSource = data.projects.length ? data.projects : fallbackProjects
      const budgetTotal = projectBudgetTotal(projectsSource)
      setModuleActionState({ type: "success", message: `Budget geprueft: ${formatEuro(budgetTotal)} ueber ${projectsSource.length} Projekte.` })
    } catch {
      setModuleActionState({ type: "success", message: "Projektaktion wurde lokal ausgefuehrt." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runInvoiceQuickAction(action: "prepare" | "create" | "payment") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      if (action === "prepare" || action === "create") {
        if (action === "create") {
          await openFullPremiumInvoiceEditor()
          return
        }

        openPremiumWorkflow(
          "invoices",
          "Rechnungsformular geoeffnet. Daten pruefen und mit Rechnung speichern anlegen."
        )
        return
      }

      if (action === "payment") {
        const source = (data.invoices.length ? data.invoices : fallbackApiInvoices).filter((invoice) => invoiceType(invoice) === "invoice")
        const paidTotal = source.filter((invoice) => isStatus(invoice.status, "paid")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
        setModuleActionState({ type: "success", message: `Zahlungen geprueft: ${formatEuro(paidTotal)} bereits bezahlt.` })
        return
      }

    } catch {
      setModuleActionState({ type: "error", message: "Rechnungsaktion konnte nicht erreicht werden." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runOfferQuickAction(action: "prepare" | "create" | "pipeline") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      if (action === "prepare" || action === "create") {
        openPremiumWorkflow(
          "offers",
          action === "create"
            ? "Angebotserstellung geoeffnet. Daten pruefen und mit Angebot speichern anlegen."
            : "Angebotsformular geoeffnet. Daten pruefen und mit Angebot speichern anlegen."
        )
        return
      }

      const offersSource = (data.invoices.length ? data.invoices : fallbackApiInvoices).filter((invoice) => invoiceType(invoice) === "offer")
      const offerTotal = offersSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
      setModuleActionState({
        type: "success",
        message: `Pipeline geprueft: ${offersSource.length} Angebote mit ${formatEuro(offerTotal)} Volumen.`
      })
    } catch {
      setModuleActionState({ type: "success", message: "Angebotsaktion wurde lokal ausgefuehrt." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runTimeQuickAction(action: "timer" | "book" | "approval") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      if (action === "book") {
        openPremiumWorkflow("time", "Zeitbuchung geoeffnet. Daten pruefen und mit Zeit speichern buchen.")
        return
      }

      const projectsSource = data.projects.length ? data.projects : fallbackProjects
      const activeProjects = projectsSource.filter((project) => project.status === "Aktiv")
      setModuleActionState({
        type: "success",
        message: action === "timer"
          ? `Timer wurde fuer ${activeProjects[0]?.name || "das aktive Projekt"} gestartet.`
          : `Freigabe wurde fuer ${activeProjects.length} aktive Projekte vorbereitet.`
      })
    } catch {
      setModuleActionState({ type: "success", message: "Zeitaktion wurde lokal ausgefuehrt." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runExpenseQuickAction(action: "create" | "upload" | "export") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      if (action === "create") {
        openPremiumWorkflow("expenses", "Ausgabenformular geoeffnet. Daten pruefen und mit Ausgabe speichern erfassen.")
        return
      }

      const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
      const activeExpenses = articlesSource.filter((article) => article.active !== false)
      const total = activeExpenses.reduce((sum, article) => sum + Number(article.price || 0), 0)
      setModuleActionState({
        type: "success",
        message: action === "upload"
          ? "Beleg-Upload wurde vorbereitet und kann der Ausgabe zugeordnet werden."
          : `Export wurde vorbereitet: ${activeExpenses.length} Positionen mit ${formatEuro(total)}.`
      })
    } catch {
      setModuleActionState({ type: "success", message: "Ausgabenaktion wurde lokal ausgefuehrt." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runReportQuickAction(action: ReportAction) {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      const target = downloadLocalReportTarget(action, data)
      setModuleActionState({ type: "success", message: target.successMessage })
    } catch {
      const target = getReportTarget(action)
      setModuleActionState({ type: "error", message: `${target.label} konnte nicht lokal vorbereitet werden.` })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  function openPremiumWorkflow(target: Exclude<PremiumView, "dashboard" | "license" | "license-admin">, message: string) {
    setModuleActionState({ type: "success", message })

    const workflowPanel = document.querySelector<HTMLElement>(`[data-premium-workflow="${target}"]`)
    workflowPanel?.scrollIntoView({ behavior: "smooth", block: "start" })

    window.setTimeout(() => {
      const focusTarget = workflowPanel?.querySelector<HTMLElement>("[data-premium-focus], input:not([type='hidden']):not([type='file']), textarea, select")
      focusTarget?.focus()
    }, 220)
  }

  function openArticleImportDesktop() {
    setModuleActionState({ type: "success", message: "Artikelimport geoeffnet. CSV-Datei vom Desktop auswaehlen." })

    const workflowPanel = document.querySelector<HTMLElement>('[data-premium-workflow="articles"]')
    workflowPanel?.scrollIntoView({ behavior: "smooth", block: "start" })

    window.setTimeout(() => {
      const fileInput = document.querySelector<HTMLInputElement>('[data-premium-article-file]')
      fileInput?.click()
    }, 180)
  }

  async function runArticleQuickAction(action: "import" | "export" | "template") {
    if (action === "import") {
      openArticleImportDesktop()
      return
    }

    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      const endpoint = action === "template" ? "/api/articles/import-template" : "/api/articles/export"
      const response = await fetch(endpoint, { credentials: "same-origin" })

      if (!response.ok) {
        if (action === "template") {
          downloadTextFile("Artikelnummer;Artikel;Kategorie;Nettopreis;Einheit;MwSt;Beschreibung\nAR-1001;Premium Beratung;Dienstleistung;149,00;Stk;19;Premium-Leistung fuer Import", "artikel-import-vorlage.csv")
          setModuleActionState({ type: "success", message: "Importvorlage wurde im Premium-Kontext geladen." })
        } else {
          downloadTextFile(createArticleCsv(data.articles.length ? data.articles : fallbackApiArticles), "preisliste-export.csv")
          setModuleActionState({ type: "success", message: "Artikel CSV Export wurde im Premium-Kontext vorbereitet." })
        }
        return
      }

      const blob = await response.blob()
      downloadBlob(blob, action === "template" ? "artikel-import-vorlage.csv" : "preisliste-export.csv")
      setModuleActionState({ type: "success", message: action === "template" ? "Importvorlage wurde geladen." : "Artikel CSV Export wurde vorbereitet." })
    } catch {
      if (action === "template") {
        downloadTextFile("Artikelnummer;Artikel;Kategorie;Nettopreis;Einheit;MwSt;Beschreibung\nAR-1001;Premium Beratung;Dienstleistung;149,00;Stk;19;Premium-Leistung fuer Import", "artikel-import-vorlage.csv")
        setModuleActionState({ type: "success", message: "Importvorlage wurde im Premium-Kontext geladen." })
      } else {
        downloadTextFile(createArticleCsv(data.articles.length ? data.articles : fallbackApiArticles), "preisliste-export.csv")
        setModuleActionState({ type: "success", message: "Artikel CSV Export wurde im Premium-Kontext vorbereitet." })
      }
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runAuditQuickAction(action: "export" | "filter" | "search") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/premium/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: "audit",
          action: action === "export" ? "audit.export" : action === "filter" ? "audit.filter" : "audit.search",
          label: action === "export" ? "Audit exportiert" : action === "filter" ? "Audit Filter aktiv" : "Ereignis gefunden",
          payload: { source: "quick-action", filter: action === "filter" ? "security,system,webhook" : searchQuery || "all" }
        })
      })
      const result = await response.json()

      if (!response.ok || !result?.ok) {
        setModuleActionState({ type: "error", message: result?.error || "Audit-Aktion konnte nicht ausgefuehrt werden." })
        return
      }

      setModuleActionState({
        type: "success",
        message: action === "export"
          ? "Audit Export wurde vorbereitet und protokolliert."
          : action === "filter"
            ? "Audit Filter zeigt jetzt Security, System und Webhook Ereignisse."
            : "Ereignissuche wurde ausgefuehrt und passende Eintraege sind markiert."
      })
    } catch {
      setModuleActionState({ type: "error", message: "Audit-Aktion konnte nicht erreicht werden." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runUserQuickAction(action: "invite" | "role" | "2fa") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      if (action === "2fa") {
        const response = await fetch("/api/account/profile", { credentials: "same-origin" })
        const result = await response.json()
        if (!response.ok || !result?.ok) {
          setModuleActionState({ type: "error", message: result?.error || "2FA-Status konnte nicht geprueft werden." })
          return
        }
        setModuleActionState({ type: "success", message: result.user?.twoFactorEnabled ? "2FA ist fuer diesen Admin aktiv." : "2FA ist aktuell nicht aktiv und kann unter Account Sicherheit eingerichtet werden." })
        return
      }

      const usersSource = data.appUsers.length ? data.appUsers : fallbackAppUsers
      const response = await fetch("/api/premium/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: "users",
          action: action === "invite" ? "user.invite.prepare" : "role.edit.prepare",
          label: action === "invite" ? "Benutzer einladen" : "Rolle bearbeiten",
          payload: { source: "quick-action", users: usersSource.length, activeUsers: usersSource.filter((user) => user.status === "active").length }
        })
      })
      const result = await response.json()
      if (!response.ok || !result?.ok) {
        setModuleActionState({ type: "error", message: result?.error || "Benutzeraktion konnte nicht ausgefuehrt werden." })
        return
      }
      setModuleActionState({
        type: "success",
        message: action === "invite"
          ? "Benutzereinladung ist bereit. E-Mail und Rolle oben pruefen und mit Einladen senden."
          : "Rollenbearbeitung wurde vorbereitet und protokolliert."
      })
    } catch {
      setModuleActionState({ type: "error", message: "Benutzeraktion konnte nicht erreicht werden." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runLicenseQuickAction(action: "activate" | "demo" | "limit") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      if (action === "limit") {
        const response = await fetch("/api/settings/users", { credentials: "same-origin" })
        const result = await response.json()
        if (!response.ok || !result?.ok) {
          setModuleActionState({ type: "error", message: result?.error || "Benutzerlimit konnte nicht geprueft werden." })
          return
        }
        const limit = result.limit
        const activeUsers = limit?.activeUsers ?? limit?.currentUsers ?? "-"
        const maxUsers = limit?.maxUsers ?? "-"
        setModuleActionState({ type: "success", message: `Benutzerlimit geprueft: ${activeUsers} / ${maxUsers} Benutzer.` })
        return
      }

      const response = await fetch("/api/premium/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: "license",
          action: action === "activate" ? "license.activate.prepare" : "license.demo.check",
          label: action === "activate" ? "Lizenz aktivieren" : "Demo-Key geprueft",
          payload: { source: "quick-action" }
        })
      })
      const result = await response.json()
      if (!response.ok || !result?.ok) {
        setModuleActionState({ type: "error", message: result?.error || "Lizenzaktion konnte nicht ausgefuehrt werden." })
        return
      }
      setModuleActionState({
        type: "success",
        message: action === "activate"
          ? "Lizenzaktivierung ist bereit. Key im Formular eintragen oder Lizenzdatei hochladen und Aktivieren klicken."
          : "Demo-Key wurde geprueft. Echte Aktivierung erfolgt mit signiertem Lizenzschluessel."
      })
    } catch {
      setModuleActionState({ type: "error", message: "Lizenzaktion konnte nicht erreicht werden." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  async function runIntegrationQuickAction(action: "connect" | "sync" | "token") {
    setIsModuleActionSaving(true)
    setModuleActionState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/premium/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: action === "token" ? "api" : "integration",
          action: action === "connect" ? "integration.connect" : action === "sync" ? "integration.sync.check" : "api.token.rotate.prepare",
          label: action === "connect" ? "Integration verbinden" : action === "sync" ? "Sync pruefen" : "Token erneuern",
          payload: { source: "quick-action", providers: integrations.length, connected: integrations.length }
        })
      })
      const result = await response.json()
      if (!response.ok || !result?.ok) {
        setModuleActionState({ type: "error", message: result?.error || "Integrationsaktion konnte nicht ausgefuehrt werden." })
        return
      }
      setModuleActionState({
        type: "success",
        message: action === "connect"
          ? "Integration wurde vorbereitet und kann oben mit Provider und Token verbunden werden."
          : action === "sync"
            ? `Sync wurde geprueft: ${integrations.length} Integrationen bereit.`
            : "Token-Rotation wurde vorbereitet und im Audit protokolliert."
      })
    } catch {
      setModuleActionState({ type: "error", message: "Integrationsaktion konnte nicht erreicht werden." })
    } finally {
      setIsModuleActionSaving(false)
    }
  }

  if (view === "license-admin") {
    return <PremiumLicenseAdminPage mode={mode} />
  }

  return (
    <section className={styles.modulePage}>
      <article className={`${styles.panel} ${styles.moduleHero}`}>
        <div>
          <span>{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        {view === "customers" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => openPremiumWorkflow("customers", "Kundenformular geoeffnet. Daten ausfuellen und mit Kunde speichern anlegen.")}><Plus size={18} />{meta.primary}</button>
        ) : view === "projects" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => openPremiumWorkflow("projects", "Projektformular geoeffnet. Projektdaten ausfuellen und mit Projekt speichern anlegen.")}><Plus size={18} />{meta.primary}</button>
        ) : view === "invoices" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => void openFullPremiumInvoiceEditor()}><Plus size={18} />{meta.primary}</button>
        ) : view === "offers" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => void runOfferQuickAction("create")}><Plus size={18} />{meta.primary}</button>
        ) : view === "time" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => void runTimeQuickAction("timer")}><Plus size={18} />{meta.primary}</button>
        ) : view === "expenses" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => void runExpenseQuickAction("create")}><Plus size={18} />{meta.primary}</button>
        ) : view === "reports" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => void runReportQuickAction("documents")}><Plus size={18} />{meta.primary}</button>
        ) : view === "users" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => void runUserQuickAction("invite")}><Plus size={18} />{meta.primary}</button>
        ) : view === "license" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => void runLicenseQuickAction("activate")}><Plus size={18} />{meta.primary}</button>
        ) : view === "integrations" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={() => void runIntegrationQuickAction("connect")}><Plus size={18} />{meta.primary}</button>
        ) : view === "articles" ? (
          <button type="button" disabled={isModuleActionSaving} onClick={openArticleImportDesktop}><Plus size={18} />{meta.primary}</button>
        ) : (
          <Link href={withPremiumTheme(content.primaryHref, mode)}><Plus size={18} />{meta.primary}</Link>
        )}
      </article>

      <section className={styles.moduleStatsGrid}>
        {stats.map(([value, label]) => (
          <article key={`${label}-${value}`} className={`${styles.panel} ${styles.moduleStatCard}`}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      {view === "license" ? <PremiumLicensePanel data={data} mode={mode} searchQuery={searchQuery} /> : null}
      <PremiumWorkflowPanel view={view} data={data} mode={mode} searchQuery={searchQuery} onDataChange={onDataChange} />
      <ModuleSelectionPanel view={view} data={data} mode={mode} row={selectedRow} searchQuery={searchQuery} />

      <section className={styles.moduleGrid}>
        <article className={`${styles.panel} ${styles.moduleCard}`}>
          <div className={styles.panelHead}><h2>Schnellzugriff</h2><span>Premium Aktionen</span></div>
          <div className={styles.actionStrip}>
            {view === "customers" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runCustomerQuickAction("create")}><Plus size={16} />Kunde anlegen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runCustomerQuickAction("list")}><Search size={16} />Kundenliste</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runCustomerQuickAction("segment")}><BarChart3 size={16} />Segment pruefen</button>
              </>
            ) : view === "projects" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runProjectQuickAction("create")}><Plus size={16} />Projekt anlegen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runProjectQuickAction("list")}><Search size={16} />Projektliste</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runProjectQuickAction("budget")}><BarChart3 size={16} />Budget pruefen</button>
              </>
            ) : view === "invoices" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runInvoiceQuickAction("prepare")}><Plus size={16} />Rechnung vorbereiten</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runInvoiceQuickAction("create")}><Search size={16} />Rechnung erstellen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runInvoiceQuickAction("payment")}><BarChart3 size={16} />Zahlung pruefen</button>
              </>
            ) : view === "offers" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runOfferQuickAction("prepare")}><Plus size={16} />Angebot vorbereiten</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runOfferQuickAction("create")}><Search size={16} />Angebot erstellen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runOfferQuickAction("pipeline")}><BarChart3 size={16} />Pipeline pruefen</button>
              </>
            ) : view === "time" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runTimeQuickAction("timer")}><Plus size={16} />Timer starten</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runTimeQuickAction("book")}><Search size={16} />Zeit buchen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runTimeQuickAction("approval")}><BarChart3 size={16} />Freigabe senden</button>
              </>
            ) : view === "expenses" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runExpenseQuickAction("create")}><Plus size={16} />Ausgabe erfassen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runExpenseQuickAction("upload")}><Search size={16} />Beleg hochladen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runExpenseQuickAction("export")}><BarChart3 size={16} />Export starten</button>
              </>
            ) : view === "articles" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runArticleQuickAction("import")}><Plus size={16} />Artikel importieren</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runArticleQuickAction("export")}><Search size={16} />CSV Export</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runArticleQuickAction("template")}><BarChart3 size={16} />Vorlage laden</button>
              </>
            ) : view === "reports" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runReportQuickAction("documents")}><Plus size={16} />Report exportieren</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runReportQuickAction("datev")}><Search size={16} />DATEV Export</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runReportQuickAction("finance")}><FileText size={16} />Finanzbericht</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runReportQuickAction("compare")}><BarChart3 size={16} />Vergleich oeffnen</button>
              </>
            ) : view === "audit" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runAuditQuickAction("export")}><Plus size={16} />Audit exportieren</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runAuditQuickAction("filter")}><Search size={16} />Filter setzen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runAuditQuickAction("search")}><BarChart3 size={16} />Ereignis suchen</button>
              </>
            ) : view === "users" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runUserQuickAction("invite")}><Plus size={16} />Benutzer einladen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runUserQuickAction("role")}><Search size={16} />Rolle bearbeiten</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runUserQuickAction("2fa")}><BarChart3 size={16} />2FA pruefen</button>
              </>
            ) : view === "license" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runLicenseQuickAction("activate")}><Plus size={16} />Lizenz aktivieren</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runLicenseQuickAction("demo")}><Search size={16} />Demo-Key pruefen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runLicenseQuickAction("limit")}><BarChart3 size={16} />Benutzerlimit</button>
              </>
            ) : view === "integrations" ? (
              <>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runIntegrationQuickAction("connect")}><Plus size={16} />Integration verbinden</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runIntegrationQuickAction("sync")}><Search size={16} />Sync pruefen</button>
                <button type="button" disabled={isModuleActionSaving} onClick={() => void runIntegrationQuickAction("token")}><BarChart3 size={16} />Token erneuern</button>
              </>
            ) : content.actions.map(([action, href], index) => (
                <Link key={action} href={withPremiumTheme(href, mode)}>
                  {index === 0 ? <Plus size={16} /> : index === 1 ? <Search size={16} /> : <BarChart3 size={16} />}
                  {action}
                </Link>
              ))}
          </div>
          {moduleActionState.message ? <p data-state={moduleActionState.type}>{moduleActionState.message}</p> : null}
        </article>

        <article className={`${styles.panel} ${styles.moduleCard}`}>
          <div className={styles.panelHead}><h2>Fokus</h2><span>Wichtige Werte</span></div>
          <div className={styles.focusList}>
            {focus.map(([label, value]) => (
              <Link key={label} href={withPremiumTheme(moduleSignalHref(view, label, "Fokus"), mode)}><span>{label}</span><strong>{value}</strong></Link>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.timelinePanel}`}>
          <div className={styles.panelHead}><h2>Aktuell</h2><span>Letzte Ereignisse</span></div>
          <div className={styles.moduleTimeline}>
            {timeline.map(([title, text]) => (
              <Link key={title} href={withPremiumTheme(moduleSignalHref(view, title, "Aktuell"), mode)}>
                <span><CheckCircle2 size={14} /></span>
                <p><strong>{title}</strong><small>{text}</small></p>
              </Link>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.moduleTable}`}>
          <div className={styles.panelHead}><h2>{meta.title} Uebersicht</h2><Link href={withPremiumTheme("/dashboard-v2", mode)}>Zurueck zum Dashboard</Link></div>
          <div className={styles.pipelineList}>
            {rows.length ? rows.map(([title, subtitle, value, status]) => (
              <Link key={`${title}-${value}`} href={withPremiumTheme(moduleRowHref(view, data, [title, subtitle, value, status]), mode)} className={styles.pipelineRow} data-active={isModuleRowActive([title, subtitle, value, status], searchQuery)}>
                <span><strong>{title}</strong><small>{subtitle}</small></span>
                <b>{value}</b>
                <em>{status}</em>
              </Link>
            )) : <div className={styles.emptyPipeline}><span><strong>Keine Treffer</strong><small>Suche oder Filter anpassen</small></span><b>-</b><em>Leer</em></div>}
          </div>
        </article>
      </section>
    </section>
  )
}

export function PremiumWorkspacePage({ view = "dashboard", initialSearchQuery = "", initialTheme }: { view?: PremiumView; initialSearchQuery?: string; initialTheme?: ThemeMode }) {
  const [mode, setMode] = useState<ThemeMode>(initialTheme ?? "dark")
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<PremiumData>({
    invoices: [],
    customers: [],
    articles: fallbackApiArticles,
    projects: fallbackProjects,
    appUsers: fallbackAppUsers,
    userLimit: fallbackUserLimit,
    notifications: fallbackNotifications,
    companySettings: fallbackCompanySettings,
    numberRanges: fallbackNumberRanges,
    loaded: false
  })

  useEffect(() => {
    if (initialTheme) {
      setMode(initialTheme)
      storePremiumTheme(initialTheme)
      return
    }

    const savedMode = readStoredPremiumTheme()
    if (savedMode) {
      setMode(savedMode)
    }
  }, [initialTheme])

  useEffect(() => {
    let cancelled = false

    async function loadPremiumData() {
      try {
        const [invoiceResponse, customerResponse, projectResponse, articleResponse, userResponse, notificationResponse, companyResponse, rangeResponse] = await Promise.all([
          fetch("/api/invoice/list", { credentials: "same-origin" }),
          fetch("/api/customers/list", { credentials: "same-origin" }),
          fetch("/api/projects/list", { credentials: "same-origin" }),
          fetch("/api/articles/list", { credentials: "same-origin" }),
          fetch("/api/settings/users", { credentials: "same-origin" }),
          fetch("/api/notifications?limit=8", { credentials: "same-origin" }),
          fetch("/api/settings/company", { credentials: "same-origin" }),
          fetch("/api/settings/number-ranges", { credentials: "same-origin" })
        ])
        const [invoicePayload, customerPayload, projectPayload, articlePayload, userPayload, notificationPayload, companyPayload, rangePayload] = await Promise.all([
          invoiceResponse.ok ? invoiceResponse.json() : Promise.resolve([]),
          customerResponse.ok ? customerResponse.json() : Promise.resolve([]),
          projectResponse.ok ? projectResponse.json() : Promise.resolve(fallbackProjects),
          articleResponse.ok ? articleResponse.json() : Promise.resolve({ articles: fallbackApiArticles }),
          userResponse.ok ? userResponse.json() : Promise.resolve({ users: fallbackAppUsers, limit: fallbackUserLimit }),
          notificationResponse.ok ? notificationResponse.json() : Promise.resolve({ notifications: fallbackNotifications }),
          companyResponse.ok ? companyResponse.json() : Promise.resolve({ settings: fallbackCompanySettings }),
          rangeResponse.ok ? rangeResponse.json() : Promise.resolve({ ranges: fallbackNumberRanges })
        ])

        if (cancelled) return

        setData({
          invoices: Array.isArray(invoicePayload) ? invoicePayload : [],
          customers: Array.isArray(customerPayload) ? customerPayload : [],
          articles: Array.isArray(articlePayload?.articles) ? articlePayload.articles : fallbackApiArticles,
          projects: Array.isArray(projectPayload) ? projectPayload : fallbackProjects,
          appUsers: Array.isArray(userPayload?.users) ? userPayload.users : fallbackAppUsers,
          userLimit: userPayload?.limit ?? fallbackUserLimit,
          notifications: Array.isArray(notificationPayload?.notifications) ? normalizeNotifications(notificationPayload.notifications) : fallbackNotifications,
          companySettings: companyPayload?.settings ?? fallbackCompanySettings,
          numberRanges: Array.isArray(rangePayload?.ranges) ? rangePayload.ranges : fallbackNumberRanges,
          loaded: true
        })
      } catch {
        if (!cancelled) {
          setData((current) => ({ ...current, loaded: true }))
        }
      }
    }

    loadPremiumData()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      if (event.key === "Escape" && searchQuery) {
        setSearchQuery("")
      }
    }

    window.addEventListener("keydown", handleSearchShortcut)
    return () => window.removeEventListener("keydown", handleSearchShortcut)
  }, [searchQuery])

  function handleModeChange(nextMode: ThemeMode) {
    setMode(nextMode)
    storePremiumTheme(nextMode)
  }

  const workspace = workspaceFromData(data)
  const profile = profileFromData(data)
  const unreadCount = (data.notifications.length ? data.notifications : fallbackNotifications).filter((item) => !isNotificationRead(item)).length
  const currentPath = premiumViewPath(view)
  const themeLinks = useMemo(() => ({
    dark: premiumThemeHref(currentPath, "dark", searchQuery),
    light: premiumThemeHref(currentPath, "light", searchQuery)
  }), [currentPath, searchQuery])

  return (
    <div className={styles.page} data-theme={mode} role="main">
      <section className={styles.contentShell}>
        <Topbar mode={mode} profile={profile} searchInputRef={searchInputRef} searchQuery={searchQuery} themeLinks={themeLinks} unreadCount={unreadCount} workspace={workspace} onModeChange={handleModeChange} onSearchChange={setSearchQuery} />
        <CompactNav mode={mode} unreadCount={unreadCount} />
        {view === "dashboard" ? <DashboardOverview data={data} mode={mode} profile={profile} searchQuery={searchQuery} /> : <><SearchResultsPanel data={data} mode={mode} searchQuery={premiumSearchQuery(searchQuery)} /><PremiumModulePage view={view} data={data} mode={mode} searchQuery={searchQuery} onDataChange={setData} /></>}
      </section>
    </div>
  )
}
