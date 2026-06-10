"use client"

import type { ChangeEvent, ComponentType, FormEvent, RefObject } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { articles as fallbackArticlesData, customers as fallbackCustomersData, documents as fallbackDocumentsData, projects as fallbackProjectsData } from "@/data/invoice-data"
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
  | "reports"
  | "settings"
  | "users"
  | "license"
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

const sideNav = [
  { section: "Hauptmenu", items: mainNav.slice(0, 8) },
  {
    section: "Management",
    items: [
      { label: "Benutzer & Rollen", href: "/dashboard-v2/users", icon: Users },
      { label: "Lizenzen", href: "/dashboard-v2/license", icon: KeyRound },
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
  name: customer.name,
  contact: customer.contact,
  email: customer.email,
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

function documentHrefForInvoice(invoice: ApiInvoice) {
  const type = invoiceType(invoice)
  const amount = Number(invoice.grossTotal) || 0
  const fallbackDocument = fallbackDocumentsData.find((document) => document.number === invoice.number)
    ?? fallbackDocumentsData.find((document) => {
      const documentType = String(document.type || "").toLowerCase().includes("angebot") ? "offer" : "invoice"
      const sameAmount = Math.abs(Number(document.amount || 0) - amount) < 0.01
      return documentType === type && document.customer === invoice.customer && sameAmount
    })

  return `/documents/${fallbackDocument?.id || invoice.id || invoice.number}`
}

function documentHrefForNumber(data: PremiumData, number: string) {
  const source = data.invoices.length ? data.invoices : fallbackApiInvoices
  const invoice = source.find((item) => item.number === number)
  return invoice ? documentHrefForInvoice(invoice) : "/documents"
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
    item.readAt ? "Gelesen" : index === 0 ? "Neu" : "Heute",
    item.tone === "success" ? "green" : item.tone === "warning" ? "rose" : "blue"
  ])
}

function notificationStatus(item: NotificationItem) {
  if (item.readAt) return "Gelesen"
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
    results.push({ title: customer.name, subtitle: customer.email || customer.contact || "Kundenprofil", href: "/dashboard-v2/customers", icon: Users })
  }

  for (const invoice of invoicesSource) {
    if (!matchesSearch([invoice.number, invoice.customer, statusLabel(invoice.status), formatEuro(Number(invoice.grossTotal) || 0)], normalizedQuery)) continue
    results.push({ title: invoice.number, subtitle: `${invoice.customer} · ${formatEuro(Number(invoice.grossTotal) || 0)}`, href: documentHrefForInvoice(invoice), icon: FileText })
  }

  for (const project of projectsSource) {
    if (!matchesSearch([project.name, project.customer, project.status, project.progress, project.budget], normalizedQuery)) continue
    results.push({ title: project.name, subtitle: `${project.customer} · ${project.progress}`, href: "/dashboard-v2/projects", icon: Folder })
  }

  for (const article of articlesSource) {
    if (!matchesSearch([article.name, article.category || "", article.code || "", formatEuro(Number(article.price) || 0)], normalizedQuery)) continue
    results.push({ title: article.name, subtitle: `${article.category || "Leistung"} · ${formatEuro(Number(article.price) || 0)}`, href: "/dashboard-v2/expenses", icon: Wallet })
  }

  for (const user of usersSource) {
    const name = user.name || user.email || "Benutzer"
    if (!matchesSearch([name, user.email || "", user.role || "", userStatusLabel(user.status)], normalizedQuery)) continue
    results.push({ title: name, subtitle: `${user.role || "Team"} · ${userStatusLabel(user.status)}`, href: "/dashboard-v2/users", icon: Users })
  }

  for (const notification of notificationsSource) {
    if (!matchesSearch([notification.title, notification.message || "", notification.category || "", notificationStatus(notification)], normalizedQuery)) continue
    results.push({ title: notification.title, subtitle: notification.message || notification.category || "Systemmeldung", href: "/dashboard-v2/notifications", icon: Bell })
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
    actions: [["Kunde anlegen", "/customers/new"], ["Kundenliste", "/customers"], ["Segment pruefen", "/dashboard-v2/customers?q=Segment"]],
    timeline: [["Kontakt aktualisiert", "Daniel hat Ansprechpartner und Zahlungsziel angepasst."], ["Projekt verknuepft", "Website Redesign wurde Meridian Studio zugeordnet."], ["Bonitaet geprueft", "Kundenrisiko bleibt im gruenen Bereich."]],
    primaryHref: "/customers/new"
  },
  projects: {
    stats: [["18", "Projekte"], ["8", "In Arbeit"], ["74%", "Auslastung"]],
    rows: [["Website Redesign", "Phase 2 aktiv", "78%", "Aktiv"], ["Brand Portal", "Review offen", "42%", "Review"], ["DATEV Export", "Bereit fuer Abnahme", "100%", "Fertig"]],
    focus: [["Abrechenbare Zeit", "126 h"], ["Budget offen", "8.430,00 EUR"], ["Naechster Meilenstein", "Freitag"]],
    actions: [["Projekt anlegen", "/projects/new"], ["Projektliste", "/projects"], ["Budget pruefen", "/dashboard-v2/projects?q=Budget"]],
    timeline: [["Meilenstein bewegt", "Phase 2 wurde in Review verschoben."], ["Budgetwarnung", "Brand Portal liegt bei 82% des geplanten Budgets."], ["Freigabe erhalten", "DATEV Export kann final abgerechnet werden."]],
    primaryHref: "/projects/new"
  },
  invoices: {
    stats: [["42", "Rechnungen"], ["11", "Ueberfaellig"], ["86%", "Zahlungsquote"]],
    rows: invoices.map(([number, customer, status, amount]) => [number, customer, amount, status]) as ModuleRow[],
    focus: [["Faellig diese Woche", "1.676,00 EUR"], ["Automatische Mahnungen", "7 aktiv"], ["Naechster Versand", "Heute 16:00"]],
    actions: [["Rechnung erstellen", "/documents/new"], ["Mahnlauf starten", "/dashboard-v2/automation"], ["Zahlung pruefen", "/dashboard-v2/reports"]],
    timeline: [["Rechnung erstellt", "OF-2026-5001 wurde fuer Meridian Studio vorbereitet."], ["Zahlung erkannt", "719,05 EUR von Aurora Labs wurden zugeordnet."], ["Mahnung geplant", "Pixel Perfect Ltd. erhaelt morgen eine Erinnerung."]],
    primaryHref: "/documents/new"
  },
  offers: {
    stats: [["16", "Angebote"], ["9", "Offen"], ["41%", "Annahmequote"]],
    rows: [["OF-2026-5001", "Meridian Studio GmbH", "1.320,00 EUR", "Entwurf"], ["OF-2026-4997", "Pixel Perfect Ltd.", "1.147,00 EUR", "Offen"], ["OF-2026-4992", "Urban Commerce Inc.", "2.840,00 EUR", "Review"]],
    focus: [["Pipeline", "12.640,00 EUR"], ["Entwuerfe", "5"], ["Ablauf in 7 Tagen", "3"]],
    actions: [["Angebot erstellen", "/documents/templates/new/offer"], ["Pipeline pruefen", "/dashboard-v2/offers"], ["Dokumente oeffnen", "/dashboard-v2/invoices"]],
    timeline: [["Angebot versendet", "Pixel Perfect Ltd. hat Version 3 erhalten."], ["Preisposition geaendert", "Hosting wurde als optionale Position markiert."], ["Annahme erwartet", "Meridian Studio will bis Freitag entscheiden."]],
    primaryHref: "/documents/templates/new/offer"
  },
  time: {
    stats: [["126 h", "Erfasst"], ["34 h", "Abrechenbar"], ["91%", "Freigegeben"]],
    rows: [["Website Redesign", "Daniel und Sarah", "18:40 h", "Laeuft"], ["Brand Portal", "Julia", "07:15 h", "Pruefung"], ["Support Retainer", "Thomas", "04:30 h", "Bereit"]],
    focus: [["Aktiver Timer", "01:24:18"], ["Heute erfasst", "6:45 h"], ["Nicht abgerechnet", "34 h"]],
    actions: [["Timer starten", "/dashboard-v2/time?q=Timer%20starten"], ["Zeit buchen", "/dashboard-v2/time?q=Zeit%20buchen"], ["Freigabe senden", "/dashboard-v2/invoices?q=Freigabe"]],
    timeline: [["Timer gestartet", "Daniel arbeitet an Website Redesign."], ["Zeit freigegeben", "Sarahs Eintrag wurde fuer Abrechnung markiert."], ["Monatsabschluss", "Mai-Zeiten sind bereit fuer Rechnungen."]],
    primaryHref: "/dashboard-v2/time?q=Timer%20starten"
  },
  expenses: {
    stats: [["528,99", "Ausgaben"], ["12", "Belege"], ["100%", "Zuordnung"]],
    rows: [["Adobe Creative Cloud", "Software", "71,39 EUR", "Bezahlt"], ["Hetzner Cloud", "Hosting", "43,20 EUR", "Verbucht"], ["DB Reise", "Projektkosten", "128,40 EUR", "Pruefung"]],
    focus: [["Monatliches Budget", "2.000,00 EUR"], ["Erstattungen offen", "214,20 EUR"], ["DATEV bereit", "10 Belege"]],
    actions: [["Ausgabe erfassen", "/dashboard-v2/expenses?q=Ausgabe%20erfassen"], ["Beleg hochladen", "/finance/accounts/import"], ["Export starten", "/api/finance/datev-export"]],
    timeline: [["Beleg erkannt", "OCR hat Kategorie und Betrag automatisch gesetzt."], ["Kostenstelle gesetzt", "Hosting wurde Projekt Website Redesign zugeordnet."], ["Export vorbereitet", "10 Belege sind DATEV-kompatibel."]],
    primaryHref: "/dashboard-v2/expenses?q=Ausgabe%20erfassen"
  },
  reports: {
    stats: [["18%", "Wachstum"], ["34%", "Marge"], ["12", "Reports"]],
    rows: [["Cashflow Juni", "Umsatz und Ausgaben", "+1.860,00 EUR", "Bereit"], ["Kundenwert", "Top 10 Kunden", "8.420,00 EUR", "Aktuell"], ["Steuerreport", "USt-Voranmeldung", "Pruefen", "Offen"]],
    focus: [["Umsatz YTD", "48.920,00 EUR"], ["Kosten YTD", "18.110,00 EUR"], ["Prognose", "+22%"]],
    actions: [["Report exportieren", "/api/documents/export"], ["DATEV Export", "/api/finance/datev-export"], ["Vergleich oeffnen", "/dashboard-v2/reports?q=Vergleich"]],
    timeline: [["Report erstellt", "Cashflow Juni wurde aktualisiert."], ["Abweichung erkannt", "Ausgaben liegen 8% unter Prognose."], ["Export geplant", "Steuerreport wird Freitag vorbereitet."]],
    primaryHref: "/dashboard-v2/reports"
  },
  settings: {
    stats: [["9", "Bereiche"], ["3", "Pruefen"], ["100%", "Gesichert"]],
    rows: [["Unternehmen", "Acme GmbH", "Vollstaendig", "Aktiv"], ["Nummernkreise", "RE-2026 und OF-2026", "Synchron", "Aktiv"], ["E-Mail Versand", "SMTP verbunden", "OK", "Aktiv"]],
    focus: [["Portal", "Aktiv"], ["Sprache", "Deutsch"], ["Sicherheit", "2FA empfohlen"]],
    actions: [["Firma bearbeiten", "/dashboard-v2/settings"], ["Nummernkreis pruefen", "/dashboard-v2/settings"], ["Portal oeffnen", "/dashboard-v2/settings"]],
    timeline: [["SMTP getestet", "Versandadresse ist erreichbar."], ["Logo aktualisiert", "Premium Branding wurde gespeichert."], ["Backup gesetzt", "Systemeinstellungen wurden versioniert."]],
    primaryHref: "/dashboard-v2/settings"
  },
  users: {
    stats: [["5/5", "Benutzer"], ["3", "Rollen"], ["2FA", "Empfohlen"]],
    rows: users.map(([name, role]) => [name, role, "Aktiv", role === "Administrator" ? "Owner" : "Team"]) as ModuleRow[],
    focus: [["Admin", "Daniel"], ["Lizenzlimit", "5 Benutzer"], ["Letzter Login", "Heute"]],
    actions: [["Benutzer einladen", "/dashboard-v2/users?q=Benutzer%20einladen"], ["Rolle bearbeiten", "/dashboard-v2/users?q=Rolle"], ["2FA pruefen", "/account/security"]],
    timeline: [["Einladung vorbereitet", "Neuer Benutzer kann per E-Mail eingeladen werden."], ["Rolle geaendert", "Sarah ist Manager mit Projektfreigaben."], ["Sicherheitshinweis", "2FA fuer Buchhaltung empfohlen."]],
    primaryHref: "/dashboard-v2/users?q=Benutzer%20einladen"
  },
  license: {
    stats: [["Free", "Tarif"], ["100", "Rechnungen"], ["1 GB", "Speicher"]],
    rows: [["Benutzerlimit", "5 von 5 verwendet", "Voll", "Limit"], ["Dokumente im Workspace", "Geladene Dokumente", "Lokal", "Aktiv"], ["Speicher", "Nicht gemessen", "Lokal", "Info"]],
    focus: [["Upgrade Vorteil", "Unbegrenzt"], ["Premium Support", "Enthalten"], ["Aktivierung", "Lizenz-Key"]],
    actions: [["Lizenz aktivieren", "/dashboard-v2/license?q=Lizenz-Key"], ["Upgrade pruefen", "/dashboard-v2/license?q=Upgrade"], ["Key eingeben", "/dashboard-v2/license?q=Lizenz-Key"]],
    timeline: [["Limit erreicht", "Kostenloser Plan ist vollstaendig ausgereizt."], ["Upgrade vorbereitet", "Premium schaltet unbegrenzte Benutzer frei."], ["Abrechnung bereit", "Lizenzdaten koennen hinterlegt werden."]],
    primaryHref: "/dashboard-v2/license?q=Lizenz-Key"
  },
  integrations: {
    stats: [["6", "Verbunden"], ["2", "Aktion noetig"], ["99%", "Sync"]],
    rows: integrations.slice(0, 4).map(([name, meta]) => [name, meta, "Verbunden", "Aktiv"]) as ModuleRow[],
    focus: [["Zahlungen", "Stripe, PayPal"], ["Buchhaltung", "DATEV"], ["Automation", "Zapier"]],
    actions: [["Integration verbinden", "/dashboard-v2/integrations?q=Stripe"], ["Sync pruefen", "/dashboard-v2/integrations?q=Verbunden"], ["Token erneuern", "/dashboard-v2/api?q=Rechnungsdaten"]],
    timeline: [["Stripe synchronisiert", "Neue Zahlung wurde automatisch zugeordnet."], ["DATEV Export bereit", "Buchhaltungsdaten sind vorbereitet."], ["Zapier aktiv", "Webhook fuer neue Rechnung feuert korrekt."]],
    primaryHref: "/dashboard-v2/integrations?q=Stripe"
  },
  automation: {
    stats: [["14", "Workflows"], ["9", "Aktiv"], ["312", "Runs"]],
    rows: [["Mahnung nach 7 Tagen", "Rechnungen", "9 Runs", "Aktiv"], ["Monatsreport senden", "Berichte", "1 Run", "Geplant"], ["Beleg automatisch taggen", "Ausgaben", "42 Runs", "Aktiv"]],
    focus: [["Gesparte Zeit", "18 h"], ["Fehlerquote", "0,8%"], ["Naechster Run", "Morgen 08:00"]],
    actions: [["Workflow erstellen", "/dashboard-v2/automation?q=Rechnungen%20Nummernkreis"], ["Regel testen", "/dashboard-v2/notifications?q=Neue%20Rechnung%20erstellt"], ["Run Verlauf", "/dashboard-v2/audit?q=Neue%20Rechnung%20erstellt"]],
    timeline: [["Mahnlauf ausgefuehrt", "3 Kunden wurden automatisch erinnert."], ["Regel getestet", "Belegtagging erkennt Softwarekosten."], ["Workflow pausiert", "Alter Export wurde deaktiviert."]],
    primaryHref: "/dashboard-v2/automation?q=Rechnungen%20Nummernkreis"
  },
  notifications: {
    stats: [["12", "Neu"], ["4", "Wichtig"], ["0", "Kritisch"]],
    rows: [["Zahlung erhalten", "Aurora Labs GmbH", "719,05 EUR", "Neu"], ["Rechnung ueberfaellig", "Pixel Perfect Ltd.", "1.147,00 EUR", "Wichtig"], ["Projekt aktualisiert", "Website Redesign", "Phase 2", "Info"]],
    focus: [["Inbox", "12 Meldungen"], ["Heute", "6 Ereignisse"], ["Regeln", "8 aktiv"]],
    actions: [["Regeln bearbeiten", "/dashboard-v2/notifications?q=Regeln"], ["Alle gelesen", "/dashboard-v2/notifications?q=Alle%20gelesen"], ["Filter setzen", "/dashboard-v2/notifications?q=Filter"]],
    timeline: [["Push gesendet", "Daniel wurde ueber Zahlung informiert."], ["Regel angewendet", "Ueberfaellige Rechnung markiert."], ["Benachrichtigung geplant", "Tagesbericht wird um 18:00 gesendet."]],
    primaryHref: "/dashboard-v2/notifications?q=Alle%20gelesen"
  },
  audit: {
    stats: [["248", "Events"], ["0", "Risiken"], ["30 T", "Aufbewahrung"]],
    rows: [["Daniel", "Rechnung exportiert", "OF-2026-5001", "Heute"], ["Sarah", "Kunde bearbeitet", "Aurora Labs", "Heute"], ["System", "Webhook ausgeliefert", "invoice.created", "Gestern"]],
    focus: [["Sicherheitsstatus", "Gruen"], ["Letzter Export", "Heute"], ["Admin Aktionen", "14"]],
    actions: [["Audit exportieren", "/dashboard-v2/audit?q=Export"], ["Filter setzen", "/dashboard-v2/audit?q=Filter"], ["Ereignis suchen", "/dashboard-v2/audit?q=Suche"]],
    timeline: [["Export protokolliert", "PDF-Download wurde im Audit gespeichert."], ["Zugriff erlaubt", "Sarah hat Kundenprofil geoeffnet."], ["Webhook signiert", "Event wurde erfolgreich ausgeliefert."]],
    primaryHref: "/dashboard-v2/audit?q=Export"
  },
  api: {
    stats: [["3", "Keys"], ["8", "Webhooks"], ["99.9%", "Uptime"]],
    rows: [["invoice.created", "Webhook", "200 OK", "Aktiv"], ["payment.received", "Webhook", "200 OK", "Aktiv"], ["customer.updated", "Webhook", "Retry 1", "Pruefung"]],
    focus: [["Rate Limit", "18% genutzt"], ["Letzter Fehler", "Gestern"], ["Signaturen", "Aktiv"]],
    actions: [["Webhook erstellen", "/dashboard-v2/api?q=Webhook"], ["API-Key rotieren", "/dashboard-v2/api?q=API-Key"], ["Logs oeffnen", "/dashboard-v2/audit?q=Webhook"]],
    timeline: [["Webhook ausgeliefert", "invoice.created wurde in 184 ms bestaetigt."], ["Key rotiert", "Alter Schluessel wurde deaktiviert."], ["Retry geplant", "customer.updated wird erneut gesendet."]],
    primaryHref: "/dashboard-v2/api?q=Webhook"
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

function Sidebar({ unreadCount, upgrade, workspace }: { unreadCount: number; upgrade: UpgradeSummary; workspace: ReturnType<typeof workspaceFromData> }) {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}><div className={styles.logoMark}>D</div><div><strong>DreamInvoice</strong><span>Premium Edition</span></div></div>
      <Link className={styles.workspaceButton} href="/dashboard-v2/settings"><span className={styles.workspaceAvatar}>{workspace.initial}</span><span><small>Workspace</small><strong>{workspace.name}</strong></span><ChevronDown size={14} /></Link>
      <nav className={styles.sideSections}>{sideNav.map((group) => <div key={group.section} className={styles.sideSection}><p>{group.section}</p>{group.items.map((item) => { const Icon = item.icon; const isActive = pathname === item.href; const badge = item.label === "Benachrichtigungen" ? unreadCount : 0; return <Link key={item.label} href={item.href} aria-current={isActive ? "page" : undefined} className={isActive ? styles.activeSideItem : styles.sideItem}><Icon size={16} /><span>{item.label}</span>{badge > 0 ? <em>{badge}</em> : null}</Link> })}</div>)}</nav>
      <div className={styles.upgradeCard}><Crown size={26} /><strong>{upgrade.title}</strong><span>{upgrade.text}</span><Link href={upgrade.href}>{upgrade.action}</Link></div>
    </aside>
  )
}

function Topbar({ mode, profile, searchInputRef, searchQuery, themeLinks, unreadCount, onModeChange, onSearchChange }: { mode: ThemeMode; profile: ReturnType<typeof profileFromData>; searchInputRef: RefObject<HTMLInputElement | null>; searchQuery: string; themeLinks: ThemeLinks; unreadCount: number; onModeChange: (mode: ThemeMode) => void; onSearchChange: (value: string) => void }) {
  const pathname = usePathname()

  return (
    <header className={styles.topbar}>
      <label className={styles.searchBox}><Search size={16} /><input ref={searchInputRef} value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Suche..." aria-label="Premium Suche" />{searchQuery ? <button type="button" aria-label="Suche leeren" onClick={() => onSearchChange("")}><X size={15} /></button> : null}</label>
      <nav className={styles.desktopNav}>{mainNav.map((item) => { const isActive = pathname === item.href; return <Link key={item.label} className={isActive ? styles.navActive : ""} aria-current={isActive ? "page" : undefined} href={item.href}>{item.label}</Link> })}</nav>
      <div className={styles.topActions}><ThemeToggle links={themeLinks} mode={mode} onChange={onModeChange} /><Link href="/documents/new" aria-label="Neu"><Plus size={18} /></Link><Link href="/dashboard-v2/notifications" aria-label="Benachrichtigungen" className={styles.bellButton}><Bell size={18} />{unreadCount > 0 ? <span>{unreadCount}</span> : null}</Link><Link href="/dashboard-v2/settings" aria-label="Hilfe"><HelpCircle size={18} /></Link><div className={styles.profile}><span>{profile.initials}</span><div><strong>{profile.name}</strong><small>{profile.role}</small></div></div></div>
    </header>
  )
}

function CompactNav({ unreadCount }: { unreadCount: number }) {
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

        return <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined} className={isActive ? styles.compactNavActive : ""}><Icon size={16} /><span>{item.label}</span>{badge > 0 ? <em>{badge}</em> : null}</Link>
      })}
    </nav>
  )
}

function KpiGrid({ data }: { data: PremiumData }) {
  const source = data.invoices.length ? data.invoices : fallbackApiInvoices
  const invoiceSource = source.filter((invoice) => invoiceType(invoice) === "invoice")
  const offerSource = source.filter((invoice) => invoiceType(invoice) === "offer")
  const openAmount = invoiceSource.filter((invoice) => isStatus(invoice.status, "open")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const paidAmount = invoiceSource.filter((invoice) => isStatus(invoice.status, "paid")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const overdueAmount = invoiceSource.filter((invoice) => isStatus(invoice.status, "overdue")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const offerAmount = offerSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
  const liveKpis = source.length ? [
    { label: "Offene Rechnungen", value: formatEuro(openAmount), detail: `${invoiceSource.filter((invoice) => isStatus(invoice.status, "open")).length} Dokumente`, tone: "violet" as Tone, icon: Receipt, href: "/dashboard-v2/invoices" },
    { label: "Bezahlt", value: formatEuro(paidAmount), detail: data.loaded ? "Live synchronisiert" : "+18% vs. Vormonat", tone: "green" as Tone, icon: Briefcase, href: "/dashboard-v2/reports" },
    { label: "Ueberfaellig", value: formatEuro(overdueAmount), detail: `${invoiceSource.filter((invoice) => isStatus(invoice.status, "overdue")).length} Dokumente`, tone: "rose" as Tone, icon: AlertCircle, href: "/dashboard-v2/invoices" },
    { label: "Angebote", value: formatEuro(offerAmount), detail: `${offerSource.length} Dokumente`, tone: "blue" as Tone, icon: Tag, href: "/dashboard-v2/offers" },
    { label: "Kunden", value: String(data.customers.length || 4), detail: data.loaded ? "Live synchronisiert" : "Lokale Daten", tone: "amber" as Tone, icon: Users, href: "/dashboard-v2/customers" }
  ] : kpis.map((item) => ({ ...item, href: item.label === "Angebote" ? "/dashboard-v2/offers" : item.label === "Ausgaben" ? "/dashboard-v2/expenses" : "/dashboard-v2/invoices" }))

  return <section className={styles.kpiGrid}>{liveKpis.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className={`${styles.panel} ${styles.kpiCard}`} data-tone={item.tone}><div className={styles.kpiIcon}><Icon size={22} /></div><div><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div><MoreVertical size={17} className={styles.moreIcon} /></Link> })}</section>
}

function RevenueChart({ data }: { data: PremiumData }) {
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
      <div className={styles.panelHead}><div><h2>Umsatzuebersicht</h2><span>Umsaetze, Zahlungen und Ausgaben</span></div><Link href="/dashboard-v2/reports">Letzte 12 Monate <ChevronDown size={14} /></Link></div>
      <div className={styles.legend}><span data-color="violet">Umsatz</span><span data-color="green">Zahlungen</span><span data-color="amber">Ausgaben</span></div>
      <div className={styles.chartArea}><svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" aria-label="Umsatzdiagramm"><polyline points={revenuePoints} className={styles.revenueLine} /><polyline points={paymentPoints} className={styles.paymentLine} /><polyline points={expensePoints} className={styles.expenseLine} />{chartMarkers.map(({ tone, point }) => point ? <circle key={tone} cx={point.x} cy={point.y} r="1.8" className={styles.chartDot} data-tone={tone} /> : null)}</svg><div className={styles.chartTooltip}><strong>{series.labels[latestIndex]} {series.years[latestIndex]}</strong><span><i />Umsatz <b>{formatEuro(series.revenue[latestIndex] || 0)}</b></span><span><i />Zahlungen <b>{formatEuro(series.payments[latestIndex] || 0)}</b></span><span><i />Ausgaben <b>{formatEuro(series.expenses[latestIndex] || 0)}</b></span></div><div className={styles.monthLabels}>{series.labels.map((month, index) => <span key={`${month}-${index}`}>{month}</span>)}</div></div>
    </article>
  )
}

function StatusPanel({ data }: { data: PremiumData }) {
  const source = (data.invoices.length ? data.invoices : fallbackApiInvoices).filter((invoice) => invoiceType(invoice) === "invoice")
  const statusItems = [
    ["Bezahlt", "green", source.filter((invoice) => isStatus(invoice.status, "paid")).length],
    ["Offen", "blue", source.filter((invoice) => isStatus(invoice.status, "open")).length],
    ["Ueberfaellig", "rose", source.filter((invoice) => isStatus(invoice.status, "overdue")).length],
    ["Entwurf", "muted", source.filter((invoice) => isStatus(invoice.status, "draft")).length]
  ] as const
  const total = statusItems.reduce((sum, item) => sum + item[2], 0) || source.length || 1

  return <article className={`${styles.panel} ${styles.statusPanel}`}><div className={styles.panelHead}><h2>Rechnungsstatus</h2></div><div className={styles.donutWrap}><div className={styles.donut}><div><strong>{total}</strong><span>Gesamt</span></div></div><div className={styles.statusLegend}>{statusItems.map(([label, tone, count]) => <div key={label}><span data-tone={tone} />{label}<b>{count} ({Math.round((count / total) * 100)}%)</b></div>)}</div></div></article>
}

function QuickActions({ profile }: { profile: ReturnType<typeof profileFromData> }) {
  const actions: Array<{ label: string; icon: IconType; tone: string; href: string }> = [
    { label: "Neue Rechnung", icon: FileText, tone: "violet", href: "/documents/new" },
    { label: "Neuer Kunde", icon: UserPlus, tone: "blue", href: "/customers/new" },
    { label: "Neues Projekt", icon: Folder, tone: "green", href: "/projects/new" },
    { label: "Angebot erstellen", icon: Tag, tone: "amber", href: "/documents/templates/new/offer" },
    { label: "Zeiterfassung starten", icon: Clock3, tone: "rose", href: "/dashboard-v2/time" },
    { label: "Ausgabe erfassen", icon: Wallet, tone: "green", href: "/finance/accounts" }
  ]
  return <article className={`${styles.panel} ${styles.quickPanel}`}><div className={styles.robot}>AI</div><div className={styles.panelHead}><div><h2>Schnellaktionen</h2><span>Hallo {profile.name}. Was moechten Sie heute erledigen?</span></div></div><div className={styles.quickGrid}>{actions.map((action) => { const Icon = action.icon; return <Link key={action.label} href={action.href} data-tone={action.tone}><Icon size={19} /><span>{action.label}</span></Link> })}</div></article>
}

function InvoiceTable({ data, searchQuery }: { data: PremiumData; searchQuery: string }) {
  const rows = invoiceRowsFromData(data).filter((row) => matchesSearch(row, searchQuery))
  return <article className={`${styles.panel} ${styles.tablePanel}`}><div className={styles.panelHead}><h2>Kuerzlich erstellte Rechnungen</h2><Link href="/dashboard-v2/invoices">Alle anzeigen</Link></div><div className={styles.tableScroll}><table><thead><tr><th>Rechnung</th><th>Kunde</th><th>Status</th><th>Betrag</th><th>Datum</th></tr></thead><tbody>{rows.length ? rows.map(([number, customer, status, amount, date]) => <tr key={number}><td><Link href={documentHrefForNumber(data, number)}>{number}</Link></td><td>{customer}</td><td><span data-status={status}>{status}</span></td><td>{amount}</td><td>{date}</td></tr>) : <tr><td colSpan={5} className={styles.emptyTableCell}>Keine Treffer</td></tr>}</tbody></table></div></article>
}

function BarPanel({ data }: { data: PremiumData }) {
  const series = useMemo(() => buildMonthlySeries(data), [data])
  const maxValue = Math.max(...series.revenue, ...series.expenses, 1)

  return <article className={`${styles.panel} ${styles.barPanel}`}><div className={styles.panelHead}><h2>Einnahmen & Ausgaben</h2><Link href="/dashboard-v2/reports">Monatlich <ChevronDown size={14} /></Link></div><div className={styles.barChart}>{series.labels.map((label, index) => <div key={label} className={styles.barGroup}><div><span className={styles.incomeBar} style={{ height: `${Math.max(18, (series.revenue[index] / maxValue) * 122)}px` }} /><span className={styles.spendBar} style={{ height: `${Math.max(12, (series.expenses[index] / maxValue) * 122)}px` }} /></div><small>{label}</small></div>)}</div><div className={styles.legend}><span data-color="violet">Einnahmen</span><span data-color="amber">Ausgaben</span></div></article>
}

function ActivityFeed({ data }: { data: PremiumData }) {
  const rows = notificationRows(data)
  return <article className={`${styles.panel} ${styles.activityPanel}`}><div className={styles.panelHead}><h2>Aktivitaetsfeed</h2><Link href="/dashboard-v2/audit">Alle anzeigen</Link></div><div className={styles.activityList}>{rows.map(([title, text, time, tone]) => <div key={`${title}-${time}`} className={styles.activityItem}><span data-tone={tone}><CheckCircle2 size={14} /></span><div><strong>{title}</strong><p>{text}</p></div><time>{time}</time></div>)}</div></article>
}

function UsersPanel({ data }: { data: PremiumData }) {
  const cards = userCardsFromData(data)
  const limit = userLimitFromData(data)
  const usageWidth = Math.min(100, Math.round((limit.currentUsers / Math.max(limit.maxUsers, 1)) * 100))
  return <article className={`${styles.panel} ${styles.usersPanel}`}><div className={styles.usersMeta}><h2>Benutzer & Rollen</h2><span>{limit.currentUsers}/{limit.maxUsers} Benutzer</span><div><i style={{ width: `${usageWidth}%` }} /></div><Link href="/dashboard-v2/users">Benutzer verwalten</Link></div><div className={styles.userCards}>{cards.map(([name, role, initials, crown]) => <div key={`${name}-${role}`} className={styles.userCard}><div className={styles.avatar}>{initials}</div>{crown ? <Crown size={15} /> : null}<strong>{name}</strong><span>{role}</span><em>Aktiv</em></div>)}<Link href="/dashboard-v2/users" className={styles.addUser}><Plus size={24} /><span>Benutzer hinzufuegen</span></Link></div></article>
}

function LicensePanel({ data }: { data: PremiumData }) {
  const limit = userLimitFromData(data)
  const documentCount = (data.invoices.length ? data.invoices : fallbackApiInvoices).length
  return <article className={`${styles.panel} ${styles.licensePanel}`}><div className={styles.panelHead}><h2>Lizenzstatus</h2><span className={styles.freeBadge}>{limit.plan}</span></div><div className={styles.licenseGrid}><div><span>Benutzer</span><b>{limit.currentUsers} / {limit.maxUsers}</b></div><div><span>Status</span><b>{limit.isFull ? "Limit erreicht" : "Aktiv"}</b></div><div><span>Dokumente</span><b>{documentCount}</b></div><div><span>Ablaufdatum</span><b>{limit.validUntil ? limit.validUntil.slice(0, 10) : "-"}</b></div></div><Link href="/dashboard-v2/license"><span>Lizenz / Upgrade aktivieren</span><KeyRound size={18} /></Link></article>
}

function IntegrationsPanel() {
  return <article className={`${styles.panel} ${styles.integrationsPanel}`}><h2>Integrationen</h2><div className={styles.integrationsGrid}>{integrations.map(([name, meta, color]) => <div key={name}><span style={{ backgroundColor: color }}>{name.charAt(0)}</span><strong>{name}</strong><small>{meta}</small></div>)}<Link href="/dashboard-v2/integrations"><Grid3X3 size={18} />Mehr anzeigen</Link></div></article>
}

function SearchResultsPanel({ data, searchQuery }: { data: PremiumData; searchQuery: string }) {
  const results = globalSearchResults(data, searchQuery)
  if (!searchQuery.trim()) return null

  return (
    <article className={`${styles.panel} ${styles.searchResultsPanel}`}>
      <div className={styles.panelHead}><div><h2>Suchtreffer</h2><span>{results.length ? `${results.length} Treffer fuer "${searchQuery}"` : `Keine Treffer fuer "${searchQuery}"`}</span></div><Link href="/dashboard-v2">Dashboard</Link></div>
      {results.length ? (
        <div className={styles.searchResultsGrid}>
          {results.map((result) => {
            const Icon = result.icon
            return <Link key={`${result.href}-${result.title}`} href={result.href}><span><Icon size={17} /></span><strong>{result.title}</strong><small>{result.subtitle}</small></Link>
          })}
        </div>
      ) : (
        <div className={styles.emptySearchResult}><Search size={18} /><span>Suchbegriff pruefen oder einen anderen Bereich oeffnen.</span></div>
      )}
    </article>
  )
}

function DashboardOverview({ data, profile, searchQuery }: { data: PremiumData; profile: ReturnType<typeof profileFromData>; searchQuery: string }) {
  return (
    <>
      <KpiGrid data={data} />
      <SearchResultsPanel data={data} searchQuery={searchQuery} />
      <section className={styles.mainGrid}><RevenueChart data={data} /><StatusPanel data={data} /><QuickActions profile={profile} /></section>
      <section className={styles.lowerGrid}><InvoiceTable data={data} searchQuery={searchQuery} /><BarPanel data={data} /><ActivityFeed data={data} /></section>
      <section className={styles.bottomGrid}><UsersPanel data={data} /><LicensePanel data={data} /></section>
      <IntegrationsPanel />
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
      item.readAt ? "Gelesen" : "Offen",
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
    const unread = notificationsSource.filter((item) => !item.readAt).length
    const important = notificationsSource.filter((item) => item.tone === "warning").length
    return [[String(unread), "Neu"], [String(important), "Wichtig"], [String(notificationsSource.length), "Gesamt"]]
  }

  if (view === "automation") {
    const activeRules = rangesSource.filter((range) => range.nextValue > 0).length
    const nextValueTotal = rangesSource.reduce((sum, range) => sum + range.nextValue, 0)
    return [[String(rangesSource.length), "Regeln"], [String(activeRules), "Aktiv"], [String(nextValueTotal), "Naechste Werte"]]
  }

  if (view === "audit") {
    const openEvents = notificationsSource.filter((item) => !item.readAt).length
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
    const unread = notificationsSource.filter((item) => !item.readAt).length
    const read = notificationsSource.length - unread
    return [["Neue Meldungen", String(unread)], ["Gelesen", String(read)], ["Letzte Meldung", notificationsSource[0]?.title || "Keine Meldung"]]
  }

  if (view === "audit") {
    const openEvents = notificationsSource.filter((item) => !item.readAt).length
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

function moduleRowHref(view: Exclude<PremiumView, "dashboard">, data: PremiumData, row: ModuleRow) {
  if (view === "customers") {
    const customersSource = data.customers.length ? data.customers : fallbackApiCustomers
    const customer = customersSource.find((item) => item.name === row[0])
    return customer ? `/customers/${customer.id}` : "/dashboard-v2/customers"
  }

  if (view === "projects") {
    const projectsSource = data.projects.length ? data.projects : fallbackProjects
    const project = projectsSource.find((item) => item.name === row[0])
    return project ? `/dashboard-v2/projects?q=${encodeURIComponent(project.name)}` : "/dashboard-v2/projects"
  }

  if (view === "invoices" || view === "offers") {
    return documentHrefForNumber(data, row[0])
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

  return `/dashboard-v2/${view}?q=${encodeURIComponent(row[0])}`
}

type LicensePanelState =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

function PremiumLicensePanel({ data, mode, searchQuery }: { data: PremiumData; mode: ThemeMode; searchQuery: string }) {
  const limit = userLimitFromData(data)
  const [licenseKey, setLicenseKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<LicensePanelState>({ type: "idle", message: "" })
  const normalizedQuery = searchQuery.toLowerCase()
  const shouldFocusKey = normalizedQuery.includes("lizenz-key") || normalizedQuery.includes("lizenz aktiviert")
  const shouldFocusUpgrade = normalizedQuery.includes("upgrade")
  const routeMessage = normalizedQuery.includes("lizenz aktiviert")
    ? "Demo-Lizenz wurde geprueft. Der Aktivierungsweg ist bereit."
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
        <form onSubmit={handleSubmit} className={styles.licenseKeyForm} data-active={shouldFocusKey}>
          <label htmlFor="premium-license-key">Lizenzschluessel</label>
          <textarea
            id="premium-license-key"
            value={licenseKey}
            onChange={(event) => setLicenseKey(event.target.value)}
            rows={3}
            placeholder="INV1..."
            spellCheck={false}
          />
          <div className={styles.licenseFormActions}>
            <label>
              Lizenzdatei hochladen
              <input type="file" accept=".lic,.license,.txt,.json,application/json,text/plain" onChange={handleLicenseFile} />
            </label>
            <Link href={withPremiumTheme("/dashboard-v2/license?q=Lizenz%20aktiviert", mode)}>Demo-Key pruefen</Link>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Pruefe..." : "Aktivieren"}</button>
          </div>
          {currentState.message ? <p data-state={currentState.type}>{currentState.message}</p> : null}
        </form>

        <div className={styles.licenseUpgradeBox} data-active={shouldFocusUpgrade}>
          <span>Upgrade-Check</span>
          <strong>{limit.currentUsers} / {limit.maxUsers} Benutzer</strong>
          <p>{limit.isFull ? "Limit erreicht. Ein Upgrade ist fuer weitere Benutzer noetig." : `${Math.max(limit.maxUsers - limit.currentUsers, 0)} Benutzerplaetze sind aktuell frei.`}</p>
          <Link href={withPremiumTheme("/dashboard-v2/users?q=Benutzer", mode)}>Benutzer verwalten</Link>
        </div>
      </div>
    </article>
  )
}

function PremiumWorkflowPanel({ view, data, mode, searchQuery }: { view: Exclude<PremiumView, "dashboard">; data: PremiumData; mode: ThemeMode; searchQuery: string }) {
  const customersSource = data.customers.length ? data.customers : fallbackApiCustomers
  const projectsSource = data.projects.length ? data.projects : fallbackProjects
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const integrationsSource = integrations.length ? integrations : [["Stripe", "Zahlungen", "#635bff"]]
  const rangesSource = data.numberRanges.length ? data.numberRanges : fallbackNumberRanges
  const query = searchQuery.toLowerCase()

  if (view === "license") return null

  const routeMessage = query.includes("zeit gebucht")
    ? "Zeit wurde vorgemerkt und fuer Abrechnung vorbereitet."
    : query.includes("kunde vorbereitet")
      ? "Kunde wurde vorbereitet. Fuer Speicherung kann der vollstaendige Kunden-Flow geoeffnet werden."
      : query.includes("projekt vorbereitet")
        ? "Projekt wurde vorbereitet. Fuer Speicherung kann der vollstaendige Projekt-Flow geoeffnet werden."
        : query.includes("ausgabe erfasst")
          ? "Ausgabe wurde vorgemerkt und fuer DATEV vorbereitet."
          : query.includes("benutzer eingeladen")
            ? "Benutzereinladung wurde vorbereitet."
            : query.includes("alle gelesen")
              ? "Alle Benachrichtigungen wurden als gelesen markiert."
              : query.includes("filter aktiv")
                ? "Filter aktiv: wichtige Zahlung, Rechnung und Systemmeldungen."
                : query.includes("integration verbunden")
                  ? "Integration wurde verbunden und fuer Sync vorbereitet."
                  : query.includes("workflow getestet")
                    ? "Workflow wurde erfolgreich getestet."
                    : query.includes("webhook erstellt")
                      ? "Webhook wurde fuer invoice.created vorbereitet."
                      : ""
  const message = routeMessage ? <p data-state="success">{routeMessage}</p> : null

  if (view === "customers") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("kunde") || query.includes("segment")}>
        <div className={styles.panelHead}><div><h2>Kunde anlegen</h2><span>Kontakt vorbereiten und in den echten Kunden-Flow wechseln</span></div><Link href="/customers/new">Vollstaendig anlegen</Link></div>
        <form className={styles.workflowForm} action="/dashboard-v2/customers" method="get">
          <input type="hidden" name="q" value="Kunde vorbereitet" />
          <input type="hidden" name="theme" value={mode} />
          <label>Kunde<input name="name" defaultValue={customersSource[0]?.name || "Neuer Kunde"} /></label>
          <label>Status<select name="status" defaultValue="active"><option value="active">Aktiv</option><option value="open">Offen</option><option value="inactive">Inaktiv</option></select></label>
          <button type="submit">Vorbereiten</button>
        </form>
        {message}
      </article>
    )
  }

  if (view === "projects") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("projekt") || query.includes("budget")}>
        <div className={styles.panelHead}><div><h2>Projekt anlegen</h2><span>Projekt vorbereiten und Budget direkt pruefen</span></div><Link href="/projects/new">Vollstaendig anlegen</Link></div>
        <form className={styles.workflowForm} action="/dashboard-v2/projects" method="get">
          <input type="hidden" name="q" value="Projekt vorbereitet" />
          <input type="hidden" name="theme" value={mode} />
          <label>Projekt<input name="name" defaultValue={projectsSource[0]?.name || "Neues Projekt"} /></label>
          <label>Kunde<select name="customer" defaultValue={projectsSource[0]?.customer || customersSource[0]?.name}>{customersSource.map((customer) => <option key={customer.id} value={customer.name}>{customer.name}</option>)}</select></label>
          <button type="submit">Vorbereiten</button>
        </form>
        {message}
      </article>
    )
  }

  if (view === "time") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("timer") || query.includes("zeit")}>
        <div className={styles.panelHead}><div><h2>Zeit erfassen</h2><span>Timer starten oder abrechenbare Stunden buchen</span></div></div>
        <form className={styles.workflowForm} action="/dashboard-v2/time" method="get">
          <input type="hidden" name="q" value="Zeit gebucht" />
          <input type="hidden" name="theme" value={mode} />
          <label>Projekt<select name="project" defaultValue={projectsSource[0]?.name || "Website Redesign"}>{projectsSource.map((project) => <option key={project.id} value={project.name}>{project.name}</option>)}</select></label>
          <label>Stunden<input name="hours" defaultValue="1.5" inputMode="decimal" /></label>
          <button type="submit">Zeit buchen</button>
        </form>
        {message}
      </article>
    )
  }

  if (view === "expenses") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("ausgabe")}>
        <div className={styles.panelHead}><div><h2>Ausgabe erfassen</h2><span>Belegposition vormerken und fuer Export vorbereiten</span></div><Link href="/finance/accounts/import">Beleg hochladen</Link></div>
        <form className={styles.workflowForm} action="/dashboard-v2/expenses" method="get">
          <input type="hidden" name="q" value="Ausgabe erfasst" />
          <input type="hidden" name="theme" value={mode} />
          <label>Ausgabe<input name="title" defaultValue={articlesSource[0]?.name || "Software Lizenz"} /></label>
          <label>Betrag<input name="amount" defaultValue={String(Number(articlesSource[0]?.price || 128).toFixed(2))} inputMode="decimal" /></label>
          <button type="submit">Erfassen</button>
        </form>
        {message}
      </article>
    )
  }

  if (view === "users") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("benutzer")}>
        <div className={styles.panelHead}><div><h2>Benutzer einladen</h2><span>API-gestuetzter Invite fuer Rollen und Berechtigungen</span></div><Link href="/account/security">2FA pruefen</Link></div>
        <form className={styles.workflowForm} action="/dashboard-v2/users" method="get">
          <input type="hidden" name="q" value="Benutzer eingeladen" />
          <input type="hidden" name="theme" value={mode} />
          <label>E-Mail<input name="email" defaultValue="team@example.test" type="email" /></label>
          <label>Rolle<select name="role" defaultValue="user"><option value="user">Mitarbeiter</option><option value="admin">Admin</option></select></label>
          <button type="submit">Einladen</button>
        </form>
        {message}
      </article>
    )
  }

  if (view === "notifications") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("gelesen") || query.includes("regeln")}>
        <div className={styles.panelHead}><div><h2>Benachrichtigungen</h2><span>Inbox und Regeln direkt verarbeiten</span></div></div>
        <div className={styles.workflowActions}>
          <Link href={withPremiumTheme("/dashboard-v2/notifications?q=Alle%20gelesen", mode)}>Alle gelesen markieren</Link>
          <Link href={withPremiumTheme("/dashboard-v2/notifications?q=Filter%20aktiv", mode)}>Filter setzen</Link>
        </div>
        {message}
      </article>
    )
  }

  if (view === "integrations") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("stripe") || query.includes("verbunden")}>
        <div className={styles.panelHead}><div><h2>Integration verbinden</h2><span>Provider auswaehlen und Verbindung simulieren</span></div></div>
        <form className={styles.workflowForm} action="/dashboard-v2/integrations" method="get">
          <input type="hidden" name="q" value="Integration verbunden" />
          <input type="hidden" name="theme" value={mode} />
          <label>Provider<select name="provider" defaultValue={integrationsSource[0]?.[0] || "Stripe"}>{integrationsSource.map(([name]) => <option key={name} value={name}>{name}</option>)}</select></label>
          <button type="submit">Verbinden</button>
          <Link href={withPremiumTheme("/dashboard-v2/api?q=Token", mode)}>Token pruefen</Link>
        </form>
        {message}
      </article>
    )
  }

  if (view === "automation") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("workflow") || query.includes("nummernkreis")}>
        <div className={styles.panelHead}><div><h2>Workflow testen</h2><span>Regel aus Nummernkreis und Ereignis ausloesen</span></div></div>
        <form className={styles.workflowForm} action="/dashboard-v2/automation" method="get">
          <input type="hidden" name="q" value="Workflow getestet" />
          <input type="hidden" name="theme" value={mode} />
          <label>Regel<select name="rule" defaultValue={rangesSource[0]?.type || "invoice"}>{rangesSource.map((range) => <option key={range.type} value={range.type}>{numberRangeLabel(range.type)}</option>)}</select></label>
          <button type="submit">Regel testen</button>
          <Link href={withPremiumTheme("/dashboard-v2/audit?q=Workflow", mode)}>Run Verlauf</Link>
        </form>
        {message}
      </article>
    )
  }

  if (view === "api") {
    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.includes("webhook") || query.includes("api")}>
        <div className={styles.panelHead}><div><h2>API pruefen</h2><span>Live-Endpoints testen und Webhook vorbereiten</span></div><Link href={withPremiumTheme("/dashboard-v2/audit?q=Webhook", mode)}>Logs oeffnen</Link></div>
        <div className={styles.workflowActions}>
          <Link href="/api/invoice/list">Rechnungs-API pruefen</Link>
          <Link href={withPremiumTheme("/dashboard-v2/api?q=Webhook%20erstellt", mode)}>Webhook erstellen</Link>
        </div>
        {message}
      </article>
    )
  }

  if (view === "reports" || view === "audit" || view === "settings") {
    const links = view === "reports"
      ? [["Dokumentexport", "/api/documents/export"], ["DATEV Export", "/api/finance/datev-export"], ["Vergleich", "/dashboard-v2/reports?q=Vergleich"]]
      : view === "settings"
        ? [["Firma", "/settings/company"], ["Nummernkreise", "/settings/number-ranges"], ["Portal", "/settings/portal"]]
        : [["Audit exportieren", "/dashboard-v2/audit?q=Export"], ["Webhook Logs", "/dashboard-v2/audit?q=Webhook"], ["System", "/settings/system"]]

    return (
      <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.length > 0}>
        <div className={styles.panelHead}><div><h2>{view === "reports" ? "Reports & Export" : view === "settings" ? "Einstellungen oeffnen" : "Audit Aktionen"}</h2><span>Schnelle Wege zu echten Bereichen</span></div></div>
        <div className={styles.workflowActions}>{links.map(([label, href]) => <Link key={href} href={withPremiumTheme(href, mode)}>{label}</Link>)}</div>
        {message}
      </article>
    )
  }

  return (
    <article className={`${styles.panel} ${styles.workflowPanel}`} data-active={query.length > 0}>
      <div className={styles.panelHead}><div><h2>{premiumViewMeta[view].title} Flow</h2><span>Bestehende produktive Bereiche fuer diesen Schritt</span></div></div>
      <div className={styles.workflowActions}>{moduleContent[view].actions.map(([label, href]) => <Link key={href} href={withPremiumTheme(href, mode)}>{label}</Link>)}</div>
    </article>
  )
}

function PremiumModulePage({ view, data, mode, searchQuery }: { view: Exclude<PremiumView, "dashboard">; data: PremiumData; mode: ThemeMode; searchQuery: string }) {
  const meta = premiumViewMeta[view]
  const content = moduleContent[view]
  const rows = moduleRows(view, data).filter((row) => matchesSearch(row, searchQuery))
  const stats = moduleStats(view, data)
  const focus = moduleFocus(view, data)
  const timeline = moduleTimeline(view, data)

  return (
    <section className={styles.modulePage}>
      <article className={`${styles.panel} ${styles.moduleHero}`}>
        <div>
          <span>{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        <Link href={content.primaryHref}><Plus size={18} />{meta.primary}</Link>
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
      <PremiumWorkflowPanel view={view} data={data} mode={mode} searchQuery={searchQuery} />

      <section className={styles.moduleGrid}>
        <article className={`${styles.panel} ${styles.moduleCard}`}>
          <div className={styles.panelHead}><h2>Schnellzugriff</h2><span>Premium Aktionen</span></div>
          <div className={styles.actionStrip}>
            {content.actions.map(([action, href], index) => (
              <Link key={action} href={withPremiumTheme(href, mode)}>
                {index === 0 ? <Plus size={16} /> : index === 1 ? <Search size={16} /> : <BarChart3 size={16} />}
                {action}
              </Link>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.moduleCard}`}>
          <div className={styles.panelHead}><h2>Fokus</h2><span>Wichtige Werte</span></div>
          <div className={styles.focusList}>
            {focus.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.timelinePanel}`}>
          <div className={styles.panelHead}><h2>Aktuell</h2><span>Letzte Ereignisse</span></div>
          <div className={styles.moduleTimeline}>
            {timeline.map(([title, text]) => (
              <div key={title}>
                <span><CheckCircle2 size={14} /></span>
                <p><strong>{title}</strong><small>{text}</small></p>
              </div>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.moduleTable}`}>
          <div className={styles.panelHead}><h2>{meta.title} Uebersicht</h2><Link href="/dashboard-v2">Zurueck zum Dashboard</Link></div>
          <div className={styles.pipelineList}>
            {rows.length ? rows.map(([title, subtitle, value, status]) => (
              <Link key={`${title}-${value}`} href={moduleRowHref(view, data, [title, subtitle, value, status])} className={styles.pipelineRow}>
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
        const [invoiceResponse, customerResponse, articleResponse, userResponse, notificationResponse, companyResponse, rangeResponse] = await Promise.all([
          fetch("/api/invoice/list", { credentials: "same-origin" }),
          fetch("/api/customers/list", { credentials: "same-origin" }),
          fetch("/api/articles/list", { credentials: "same-origin" }),
          fetch("/api/settings/users", { credentials: "same-origin" }),
          fetch("/api/notifications?limit=8", { credentials: "same-origin" }),
          fetch("/api/settings/company", { credentials: "same-origin" }),
          fetch("/api/settings/number-ranges", { credentials: "same-origin" })
        ])
        const [invoicePayload, customerPayload, articlePayload, userPayload, notificationPayload, companyPayload, rangePayload] = await Promise.all([
          invoiceResponse.ok ? invoiceResponse.json() : Promise.resolve([]),
          customerResponse.ok ? customerResponse.json() : Promise.resolve([]),
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
          projects: fallbackProjects,
          appUsers: Array.isArray(userPayload?.users) ? userPayload.users : fallbackAppUsers,
          userLimit: userPayload?.limit ?? fallbackUserLimit,
          notifications: Array.isArray(notificationPayload?.notifications) ? notificationPayload.notifications : fallbackNotifications,
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
  const unreadCount = (data.notifications.length ? data.notifications : fallbackNotifications).filter((item) => !item.readAt).length
  const upgrade = upgradeSummaryFromData(data)
  const currentPath = premiumViewPath(view)
  const themeLinks = useMemo(() => ({
    dark: premiumThemeHref(currentPath, "dark", searchQuery),
    light: premiumThemeHref(currentPath, "light", searchQuery)
  }), [currentPath, searchQuery])

  return (
    <div className={styles.page} data-theme={mode} role="main">
      <Sidebar unreadCount={unreadCount} upgrade={upgrade} workspace={workspace} />
      <section className={styles.contentShell}>
        <Topbar mode={mode} profile={profile} searchInputRef={searchInputRef} searchQuery={searchQuery} themeLinks={themeLinks} unreadCount={unreadCount} onModeChange={handleModeChange} onSearchChange={setSearchQuery} />
        <CompactNav unreadCount={unreadCount} />
        {view === "dashboard" ? <DashboardOverview data={data} profile={profile} searchQuery={searchQuery} /> : <><SearchResultsPanel data={data} searchQuery={searchQuery} /><PremiumModulePage view={view} data={data} mode={mode} searchQuery={searchQuery} /></>}
      </section>
    </div>
  )
}
