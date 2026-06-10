"use client"

import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { articles as fallbackArticlesData, projects as fallbackProjectsData } from "@/data/invoice-data"
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
  Zap
} from "lucide-react"
import styles from "./DashboardV2.module.css"

type ThemeMode = "dark" | "light"
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
      { label: "Benachrichtigungen", href: "/dashboard-v2/notifications", icon: Bell, badge: "12" },
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
    item.readAt ? "Gelesen" : index === 0 ? "Neu" : "Heute",
    item.tone === "success" ? "green" : item.tone === "warning" ? "rose" : "blue"
  ])
}

function userCardsFromData(data: PremiumData): UserRow[] {
  const source = data.appUsers.length ? data.appUsers : fallbackAppUsers
  return source.slice(0, 5).map((user, index) => {
    const name = user.name || user.email?.split("@")[0] || "Benutzer"
    const role = user.role || "Team"
    return [name, role, name.charAt(0).toUpperCase(), index === 0 ? "crown" : ""]
  })
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

function matchesSearch(values: readonly string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return values.some((value) => value.toLowerCase().includes(normalizedQuery))
}

function parsePercent(value: string) {
  const parsed = Number(value.replace(/[^\d.,]/g, "").replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
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
    actions: [["Kunde anlegen", "/customers/new"], ["Import starten", "/customers"], ["Segment pruefen", "/customers"]],
    timeline: [["Kontakt aktualisiert", "Daniel hat Ansprechpartner und Zahlungsziel angepasst."], ["Projekt verknuepft", "Website Redesign wurde Meridian Studio zugeordnet."], ["Bonitaet geprueft", "Kundenrisiko bleibt im gruenen Bereich."]],
    primaryHref: "/customers/new"
  },
  projects: {
    stats: [["18", "Projekte"], ["8", "In Arbeit"], ["74%", "Auslastung"]],
    rows: [["Website Redesign", "Phase 2 aktiv", "78%", "Aktiv"], ["Brand Portal", "Review offen", "42%", "Review"], ["DATEV Export", "Bereit fuer Abnahme", "100%", "Fertig"]],
    focus: [["Abrechenbare Zeit", "126 h"], ["Budget offen", "8.430,00 EUR"], ["Naechster Meilenstein", "Freitag"]],
    actions: [["Projekt anlegen", "/projects/new"], ["Aufgabe planen", "/projects"], ["Budget pruefen", "/finance/statistics"]],
    timeline: [["Meilenstein bewegt", "Phase 2 wurde in Review verschoben."], ["Budgetwarnung", "Brand Portal liegt bei 82% des geplanten Budgets."], ["Freigabe erhalten", "DATEV Export kann final abgerechnet werden."]],
    primaryHref: "/projects/new"
  },
  invoices: {
    stats: [["42", "Rechnungen"], ["11", "Ueberfaellig"], ["86%", "Zahlungsquote"]],
    rows: invoices.map(([number, customer, status, amount]) => [number, customer, amount, status]) as ModuleRow[],
    focus: [["Faellig diese Woche", "1.676,00 EUR"], ["Automatische Mahnungen", "7 aktiv"], ["Naechster Versand", "Heute 16:00"]],
    actions: [["Rechnung erstellen", "/documents/new"], ["Mahnlauf starten", "/settings/reminders"], ["Zahlung buchen", "/documents"]],
    timeline: [["Rechnung erstellt", "OF-2026-5001 wurde fuer Meridian Studio vorbereitet."], ["Zahlung erkannt", "719,05 EUR von Aurora Labs wurden zugeordnet."], ["Mahnung geplant", "Pixel Perfect Ltd. erhaelt morgen eine Erinnerung."]],
    primaryHref: "/documents/new"
  },
  offers: {
    stats: [["16", "Angebote"], ["9", "Offen"], ["41%", "Annahmequote"]],
    rows: [["OF-2026-5001", "Meridian Studio GmbH", "1.320,00 EUR", "Entwurf"], ["OF-2026-4997", "Pixel Perfect Ltd.", "1.147,00 EUR", "Offen"], ["OF-2026-4992", "Urban Commerce Inc.", "2.840,00 EUR", "Review"]],
    focus: [["Pipeline", "12.640,00 EUR"], ["Entwuerfe", "5"], ["Ablauf in 7 Tagen", "3"]],
    actions: [["Angebot erstellen", "/documents/templates/new/offer"], ["Version duplizieren", "/documents/templates"], ["PDF senden", "/documents"]],
    timeline: [["Angebot versendet", "Pixel Perfect Ltd. hat Version 3 erhalten."], ["Preisposition geaendert", "Hosting wurde als optionale Position markiert."], ["Annahme erwartet", "Meridian Studio will bis Freitag entscheiden."]],
    primaryHref: "/documents/templates/new/offer"
  },
  time: {
    stats: [["126 h", "Erfasst"], ["34 h", "Abrechenbar"], ["91%", "Freigegeben"]],
    rows: [["Website Redesign", "Daniel und Sarah", "18:40 h", "Laeuft"], ["Brand Portal", "Julia", "07:15 h", "Pruefung"], ["Support Retainer", "Thomas", "04:30 h", "Bereit"]],
    focus: [["Aktiver Timer", "01:24:18"], ["Heute erfasst", "6:45 h"], ["Nicht abgerechnet", "34 h"]],
    actions: [["Timer starten", "/dashboard-v2/time"], ["Zeit buchen", "/projects"], ["Freigabe senden", "/documents"]],
    timeline: [["Timer gestartet", "Daniel arbeitet an Website Redesign."], ["Zeit freigegeben", "Sarahs Eintrag wurde fuer Abrechnung markiert."], ["Monatsabschluss", "Mai-Zeiten sind bereit fuer Rechnungen."]],
    primaryHref: "/dashboard-v2/time"
  },
  expenses: {
    stats: [["528,99", "Ausgaben"], ["12", "Belege"], ["100%", "Zuordnung"]],
    rows: [["Adobe Creative Cloud", "Software", "71,39 EUR", "Bezahlt"], ["Hetzner Cloud", "Hosting", "43,20 EUR", "Verbucht"], ["DB Reise", "Projektkosten", "128,40 EUR", "Pruefung"]],
    focus: [["Monatliches Budget", "2.000,00 EUR"], ["Erstattungen offen", "214,20 EUR"], ["DATEV bereit", "10 Belege"]],
    actions: [["Ausgabe erfassen", "/finance/accounts"], ["Beleg hochladen", "/finance/accounts/import"], ["Export starten", "/finance/eur"]],
    timeline: [["Beleg erkannt", "OCR hat Kategorie und Betrag automatisch gesetzt."], ["Kostenstelle gesetzt", "Hosting wurde Projekt Website Redesign zugeordnet."], ["Export vorbereitet", "10 Belege sind DATEV-kompatibel."]],
    primaryHref: "/finance/accounts"
  },
  reports: {
    stats: [["18%", "Wachstum"], ["34%", "Marge"], ["12", "Reports"]],
    rows: [["Cashflow Juni", "Umsatz und Ausgaben", "+1.860,00 EUR", "Bereit"], ["Kundenwert", "Top 10 Kunden", "8.420,00 EUR", "Aktuell"], ["Steuerreport", "USt-Voranmeldung", "Pruefen", "Offen"]],
    focus: [["Umsatz YTD", "48.920,00 EUR"], ["Kosten YTD", "18.110,00 EUR"], ["Prognose", "+22%"]],
    actions: [["Report exportieren", "/finance/statistics"], ["Filter speichern", "/finance/statistics"], ["Vergleich oeffnen", "/finance/statistics"]],
    timeline: [["Report erstellt", "Cashflow Juni wurde aktualisiert."], ["Abweichung erkannt", "Ausgaben liegen 8% unter Prognose."], ["Export geplant", "Steuerreport wird Freitag vorbereitet."]],
    primaryHref: "/finance/statistics"
  },
  settings: {
    stats: [["9", "Bereiche"], ["3", "Pruefen"], ["100%", "Gesichert"]],
    rows: [["Unternehmen", "Acme GmbH", "Vollstaendig", "Aktiv"], ["Nummernkreise", "RE-2026 und OF-2026", "Synchron", "Aktiv"], ["E-Mail Versand", "SMTP verbunden", "OK", "Aktiv"]],
    focus: [["Portal", "Aktiv"], ["Sprache", "Deutsch"], ["Sicherheit", "2FA empfohlen"]],
    actions: [["Firma bearbeiten", "/settings/company"], ["Nummernkreis pruefen", "/settings/number-ranges"], ["Portal oeffnen", "/settings/portal"]],
    timeline: [["SMTP getestet", "Versandadresse ist erreichbar."], ["Logo aktualisiert", "Premium Branding wurde gespeichert."], ["Backup gesetzt", "Systemeinstellungen wurden versioniert."]],
    primaryHref: "/settings"
  },
  users: {
    stats: [["5/5", "Benutzer"], ["3", "Rollen"], ["2FA", "Empfohlen"]],
    rows: users.map(([name, role]) => [name, role, "Aktiv", role === "Administrator" ? "Owner" : "Team"]) as ModuleRow[],
    focus: [["Admin", "Daniel"], ["Lizenzlimit", "5 Benutzer"], ["Letzter Login", "Heute"]],
    actions: [["Benutzer einladen", "/settings/users"], ["Rolle bearbeiten", "/settings/users"], ["2FA pruefen", "/account/security"]],
    timeline: [["Einladung vorbereitet", "Neuer Benutzer kann per E-Mail eingeladen werden."], ["Rolle geaendert", "Sarah ist Manager mit Projektfreigaben."], ["Sicherheitshinweis", "2FA fuer Buchhaltung empfohlen."]],
    primaryHref: "/settings/users"
  },
  license: {
    stats: [["Free", "Tarif"], ["100", "Rechnungen"], ["1 GB", "Speicher"]],
    rows: [["Benutzerlimit", "5 von 5 verwendet", "Voll", "Limit"], ["Rechnungen pro Monat", "100 von 100", "Voll", "Limit"], ["Speicher", "1 GB von 1 GB", "Voll", "Limit"]],
    focus: [["Upgrade Vorteil", "Unbegrenzt"], ["Premium Support", "Enthalten"], ["Aktivierung", "Lizenz-Key"]],
    actions: [["Lizenz aktivieren", "/settings/users"], ["Upgrade pruefen", "/settings/users"], ["Key eingeben", "/settings/users"]],
    timeline: [["Limit erreicht", "Kostenloser Plan ist vollstaendig ausgereizt."], ["Upgrade vorbereitet", "Premium schaltet unbegrenzte Benutzer frei."], ["Abrechnung bereit", "Lizenzdaten koennen hinterlegt werden."]],
    primaryHref: "/settings/users"
  },
  integrations: {
    stats: [["6", "Verbunden"], ["2", "Aktion noetig"], ["99%", "Sync"]],
    rows: integrations.slice(0, 4).map(([name, meta]) => [name, meta, "Verbunden", "Aktiv"]) as ModuleRow[],
    focus: [["Zahlungen", "Stripe, PayPal"], ["Buchhaltung", "DATEV"], ["Automation", "Zapier"]],
    actions: [["Integration verbinden", "/dashboard-v2/integrations"], ["Sync pruefen", "/finance/accounts"], ["Token erneuern", "/settings/system"]],
    timeline: [["Stripe synchronisiert", "Neue Zahlung wurde automatisch zugeordnet."], ["DATEV Export bereit", "Buchhaltungsdaten sind vorbereitet."], ["Zapier aktiv", "Webhook fuer neue Rechnung feuert korrekt."]],
    primaryHref: "/dashboard-v2/integrations"
  },
  automation: {
    stats: [["14", "Workflows"], ["9", "Aktiv"], ["312", "Runs"]],
    rows: [["Mahnung nach 7 Tagen", "Rechnungen", "9 Runs", "Aktiv"], ["Monatsreport senden", "Berichte", "1 Run", "Geplant"], ["Beleg automatisch taggen", "Ausgaben", "42 Runs", "Aktiv"]],
    focus: [["Gesparte Zeit", "18 h"], ["Fehlerquote", "0,8%"], ["Naechster Run", "Morgen 08:00"]],
    actions: [["Workflow erstellen", "/settings/reminders"], ["Regel testen", "/settings/notifications"], ["Run Verlauf", "/dashboard-v2/audit"]],
    timeline: [["Mahnlauf ausgefuehrt", "3 Kunden wurden automatisch erinnert."], ["Regel getestet", "Belegtagging erkennt Softwarekosten."], ["Workflow pausiert", "Alter Export wurde deaktiviert."]],
    primaryHref: "/settings/reminders"
  },
  notifications: {
    stats: [["12", "Neu"], ["4", "Wichtig"], ["0", "Kritisch"]],
    rows: [["Zahlung erhalten", "Aurora Labs GmbH", "719,05 EUR", "Neu"], ["Rechnung ueberfaellig", "Pixel Perfect Ltd.", "1.147,00 EUR", "Wichtig"], ["Projekt aktualisiert", "Website Redesign", "Phase 2", "Info"]],
    focus: [["Inbox", "12 Meldungen"], ["Heute", "6 Ereignisse"], ["Regeln", "8 aktiv"]],
    actions: [["Regeln bearbeiten", "/settings/notifications"], ["Alle gelesen", "/dashboard-v2/notifications"], ["Filter setzen", "/settings/notifications"]],
    timeline: [["Push gesendet", "Daniel wurde ueber Zahlung informiert."], ["Regel angewendet", "Ueberfaellige Rechnung markiert."], ["Benachrichtigung geplant", "Tagesbericht wird um 18:00 gesendet."]],
    primaryHref: "/settings/notifications"
  },
  audit: {
    stats: [["248", "Events"], ["0", "Risiken"], ["30 T", "Aufbewahrung"]],
    rows: [["Daniel", "Rechnung exportiert", "OF-2026-5001", "Heute"], ["Sarah", "Kunde bearbeitet", "Aurora Labs", "Heute"], ["System", "Webhook ausgeliefert", "invoice.created", "Gestern"]],
    focus: [["Sicherheitsstatus", "Gruen"], ["Letzter Export", "Heute"], ["Admin Aktionen", "14"]],
    actions: [["Audit exportieren", "/dashboard-v2/audit"], ["Filter setzen", "/dashboard-v2/audit"], ["Ereignis suchen", "/dashboard-v2/audit"]],
    timeline: [["Export protokolliert", "PDF-Download wurde im Audit gespeichert."], ["Zugriff erlaubt", "Sarah hat Kundenprofil geoeffnet."], ["Webhook signiert", "Event wurde erfolgreich ausgeliefert."]],
    primaryHref: "/dashboard-v2/audit"
  },
  api: {
    stats: [["3", "Keys"], ["8", "Webhooks"], ["99.9%", "Uptime"]],
    rows: [["invoice.created", "Webhook", "200 OK", "Aktiv"], ["payment.received", "Webhook", "200 OK", "Aktiv"], ["customer.updated", "Webhook", "Retry 1", "Pruefung"]],
    focus: [["Rate Limit", "18% genutzt"], ["Letzter Fehler", "Gestern"], ["Signaturen", "Aktiv"]],
    actions: [["Webhook erstellen", "/dashboard-v2/api"], ["API-Key rotieren", "/account/security"], ["Logs oeffnen", "/dashboard-v2/audit"]],
    timeline: [["Webhook ausgeliefert", "invoice.created wurde in 184 ms bestaetigt."], ["Key rotiert", "Alter Schluessel wurde deaktiviert."], ["Retry geplant", "customer.updated wird erneut gesendet."]],
    primaryHref: "/dashboard-v2/api"
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

function ThemeToggle({ mode, onChange }: { mode: ThemeMode; onChange: (mode: ThemeMode) => void }) {
  return (
    <div className={styles.themeToggle} aria-label="Theme wechseln">
      <button type="button" className={mode === "light" ? styles.activeToggle : ""} onClick={() => onChange("light")}>Hell</button>
      <button type="button" className={mode === "dark" ? styles.activeToggle : ""} onClick={() => onChange("dark")}>Dark</button>
    </div>
  )
}

function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}><div className={styles.logoMark}>D</div><div><strong>DreamInvoice</strong><span>Premium Edition</span></div></div>
      <button className={styles.workspaceButton} type="button"><span className={styles.workspaceAvatar}>A</span><span><small>Workspace</small><strong>Acme GmbH</strong></span><ChevronDown size={14} /></button>
      <nav className={styles.sideSections}>{sideNav.map((group) => <div key={group.section} className={styles.sideSection}><p>{group.section}</p>{group.items.map((item) => { const Icon = item.icon; const isActive = pathname === item.href; return <Link key={item.label} href={item.href} className={isActive ? styles.activeSideItem : styles.sideItem}><Icon size={16} /><span>{item.label}</span>{item.badge ? <em>{item.badge}</em> : null}</Link> })}</div>)}</nav>
      <div className={styles.upgradeCard}><Crown size={26} /><strong>Upgrade & Skalieren</strong><span>Erweiterte Funktionen und unbegrenzte Benutzer</span><Link href="/settings/users">Lizenz aktivieren</Link></div>
    </aside>
  )
}

function Topbar({ mode, searchQuery, unreadCount, onModeChange, onSearchChange }: { mode: ThemeMode; searchQuery: string; unreadCount: number; onModeChange: (mode: ThemeMode) => void; onSearchChange: (value: string) => void }) {
  const pathname = usePathname()

  return (
    <header className={styles.topbar}>
      <label className={styles.searchBox}><Search size={16} /><input value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} placeholder="Suche..." aria-label="Premium Suche" /></label>
      <nav className={styles.desktopNav}>{mainNav.map((item) => <Link key={item.label} className={pathname === item.href ? styles.navActive : ""} href={item.href}>{item.label}</Link>)}</nav>
      <div className={styles.topActions}><ThemeToggle mode={mode} onChange={onModeChange} /><Link href="/documents/new" aria-label="Neu"><Plus size={18} /></Link><Link href="/dashboard-v2/notifications" aria-label="Benachrichtigungen" className={styles.bellButton}><Bell size={18} />{unreadCount > 0 ? <span>{unreadCount}</span> : null}</Link><Link href="/settings/system" aria-label="Hilfe"><HelpCircle size={18} /></Link><div className={styles.profile}><span>D</span><div><strong>Daniel</strong><small>Administrator</small></div></div></div>
    </header>
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
    { label: "Offene Rechnungen", value: formatEuro(openAmount), detail: `${invoiceSource.filter((invoice) => isStatus(invoice.status, "open")).length} Dokumente`, tone: "violet" as Tone, icon: Receipt },
    { label: "Bezahlt", value: formatEuro(paidAmount), detail: data.loaded ? "Live aus API" : "+18% vs. Vormonat", tone: "green" as Tone, icon: Briefcase },
    { label: "Ueberfaellig", value: formatEuro(overdueAmount), detail: `${invoiceSource.filter((invoice) => isStatus(invoice.status, "overdue")).length} Dokumente`, tone: "rose" as Tone, icon: AlertCircle },
    { label: "Angebote", value: formatEuro(offerAmount), detail: `${offerSource.length} Dokumente`, tone: "blue" as Tone, icon: Tag },
    { label: "Kunden", value: String(data.customers.length || 4), detail: data.loaded ? "Live aus API" : "Fallback-Daten", tone: "amber" as Tone, icon: Users }
  ] : kpis

  return <section className={styles.kpiGrid}>{liveKpis.map((item) => { const Icon = item.icon; return <article key={item.label} className={`${styles.panel} ${styles.kpiCard}`} data-tone={item.tone}><div className={styles.kpiIcon}><Icon size={22} /></div><div><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div><MoreVertical size={17} className={styles.moreIcon} /></article> })}</section>
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
      <div className={styles.panelHead}><div><h2>Umsatzuebersicht</h2><span>Umsaetze, Zahlungen und Ausgaben</span></div><button type="button">Letzte 12 Monate <ChevronDown size={14} /></button></div>
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

function QuickActions() {
  const actions: Array<{ label: string; icon: IconType; tone: string; href: string }> = [
    { label: "Neue Rechnung", icon: FileText, tone: "violet", href: "/documents/new" },
    { label: "Neuer Kunde", icon: UserPlus, tone: "blue", href: "/customers/new" },
    { label: "Neues Projekt", icon: Folder, tone: "green", href: "/projects/new" },
    { label: "Angebot erstellen", icon: Tag, tone: "amber", href: "/documents/templates/new/offer" },
    { label: "Zeiterfassung starten", icon: Clock3, tone: "rose", href: "/dashboard-v2/time" },
    { label: "Ausgabe erfassen", icon: Wallet, tone: "green", href: "/finance/accounts" }
  ]
  return <article className={`${styles.panel} ${styles.quickPanel}`}><div className={styles.robot}>AI</div><div className={styles.panelHead}><div><h2>Schnellaktionen</h2><span>Hallo Daniel. Was moechten Sie heute erledigen?</span></div></div><div className={styles.quickGrid}>{actions.map((action) => { const Icon = action.icon; return <Link key={action.label} href={action.href} data-tone={action.tone}><Icon size={19} /><span>{action.label}</span></Link> })}</div></article>
}

function InvoiceTable({ data, searchQuery }: { data: PremiumData; searchQuery: string }) {
  const rows = invoiceRowsFromData(data).filter((row) => matchesSearch(row, searchQuery))
  return <article className={`${styles.panel} ${styles.tablePanel}`}><div className={styles.panelHead}><h2>Kuerzlich erstellte Rechnungen</h2><Link href="/documents">Alle anzeigen</Link></div><div className={styles.tableScroll}><table><thead><tr><th>Rechnung</th><th>Kunde</th><th>Status</th><th>Betrag</th><th>Datum</th></tr></thead><tbody>{rows.length ? rows.map(([number, customer, status, amount, date]) => <tr key={number}><td><Link href="/documents">{number}</Link></td><td>{customer}</td><td><span data-status={status}>{status}</span></td><td>{amount}</td><td>{date}</td></tr>) : <tr><td colSpan={5} className={styles.emptyTableCell}>Keine Treffer</td></tr>}</tbody></table></div></article>
}

function BarPanel({ data }: { data: PremiumData }) {
  const series = useMemo(() => buildMonthlySeries(data), [data])
  const maxValue = Math.max(...series.revenue, ...series.expenses, 1)

  return <article className={`${styles.panel} ${styles.barPanel}`}><div className={styles.panelHead}><h2>Einnahmen & Ausgaben</h2><button type="button">Monatlich <ChevronDown size={14} /></button></div><div className={styles.barChart}>{series.labels.map((label, index) => <div key={label} className={styles.barGroup}><div><span className={styles.incomeBar} style={{ height: `${Math.max(18, (series.revenue[index] / maxValue) * 122)}px` }} /><span className={styles.spendBar} style={{ height: `${Math.max(12, (series.expenses[index] / maxValue) * 122)}px` }} /></div><small>{label}</small></div>)}</div><div className={styles.legend}><span data-color="violet">Einnahmen</span><span data-color="amber">Ausgaben</span></div></article>
}

function ActivityFeed({ data }: { data: PremiumData }) {
  const rows = notificationRows(data)
  return <article className={`${styles.panel} ${styles.activityPanel}`}><div className={styles.panelHead}><h2>Aktivitaetsfeed</h2><Link href="/dashboard-v2/audit">Alle anzeigen</Link></div><div className={styles.activityList}>{rows.map(([title, text, time, tone]) => <div key={`${title}-${time}`} className={styles.activityItem}><span data-tone={tone}><CheckCircle2 size={14} /></span><div><strong>{title}</strong><p>{text}</p></div><time>{time}</time></div>)}</div></article>
}

function UsersPanel({ data }: { data: PremiumData }) {
  const cards = userCardsFromData(data)
  const limit = userLimitFromData(data)
  const usageWidth = Math.min(100, Math.round((limit.currentUsers / Math.max(limit.maxUsers, 1)) * 100))
  return <article className={`${styles.panel} ${styles.usersPanel}`}><div className={styles.usersMeta}><h2>Benutzer & Rollen</h2><span>{limit.currentUsers}/{limit.maxUsers} Benutzer</span><div><i style={{ width: `${usageWidth}%` }} /></div><Link href="/settings/users">Benutzer verwalten</Link></div><div className={styles.userCards}>{cards.map(([name, role, initials, crown]) => <div key={`${name}-${role}`} className={styles.userCard}><div className={styles.avatar}>{initials}</div>{crown ? <Crown size={15} /> : null}<strong>{name}</strong><span>{role}</span><em>Aktiv</em></div>)}<Link href="/settings/users" className={styles.addUser}><Plus size={24} /><span>Benutzer hinzufuegen</span></Link></div></article>
}

function LicensePanel({ data }: { data: PremiumData }) {
  const limit = userLimitFromData(data)
  return <article className={`${styles.panel} ${styles.licensePanel}`}><div className={styles.panelHead}><h2>Lizenzstatus</h2><span className={styles.freeBadge}>{limit.plan}</span></div><div className={styles.licenseGrid}><div><span>Benutzer</span><b>{limit.currentUsers} / {limit.maxUsers}</b></div><div><span>Status</span><b>{limit.isFull ? "Limit erreicht" : "Aktiv"}</b></div><div><span>Speicher</span><b>1 GB / 1 GB</b></div><div><span>Ablaufdatum</span><b>{limit.validUntil ? limit.validUntil.slice(0, 10) : "-"}</b></div></div><Link href="/settings/users"><span>Lizenz / Upgrade aktivieren</span><KeyRound size={18} /></Link></article>
}

function IntegrationsPanel() {
  return <article className={`${styles.panel} ${styles.integrationsPanel}`}><h2>Integrationen</h2><div className={styles.integrationsGrid}>{integrations.map(([name, meta, color]) => <div key={name}><span style={{ backgroundColor: color }}>{name.charAt(0)}</span><strong>{name}</strong><small>{meta}</small></div>)}<Link href="/dashboard-v2/integrations"><Grid3X3 size={18} />Mehr anzeigen</Link></div></article>
}

function DashboardOverview({ data, searchQuery }: { data: PremiumData; searchQuery: string }) {
  return (
    <>
      <KpiGrid data={data} />
      <section className={styles.mainGrid}><RevenueChart data={data} /><StatusPanel data={data} /><QuickActions /></section>
      <section className={styles.lowerGrid}><InvoiceTable data={data} searchQuery={searchQuery} /><BarPanel data={data} /><ActivityFeed data={data} /></section>
      <section className={styles.bottomGrid}><UsersPanel data={data} /><LicensePanel data={data} /></section>
      <IntegrationsPanel />
    </>
  )
}

function moduleRows(view: Exclude<PremiumView, "dashboard">, data: PremiumData): ModuleRow[] {
  const projectsSource = data.projects.length ? data.projects : fallbackProjects
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const usersSource = data.appUsers.length ? data.appUsers : fallbackAppUsers
  const notificationsSource = data.notifications.length ? data.notifications : fallbackNotifications
  const rangesSource = data.numberRanges.length ? data.numberRanges : fallbackNumberRanges

  if (view === "customers" && data.customers.length) {
    return data.customers.slice(0, 5).map((customer) => [
      customer.name,
      customer.email || customer.contact || customer.number || "Kundenprofil",
      customer.status || "Aktiv",
      "Live"
    ])
  }

  if ((view === "invoices" || view === "offers") && data.invoices.length) {
    return data.invoices
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
      project.progress,
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

  if (view === "settings") {
    const company = data.companySettings ?? fallbackCompanySettings
    return [
      ["Unternehmen", company.company || "Nicht gesetzt", company.email || "E-Mail offen", "Profil"],
      ["Standort", [company.city, company.country].filter(Boolean).join(", ") || "Nicht gesetzt", "Firmendaten", "Aktiv"],
      ["Nummernkreise", `${rangesSource.length} Bereiche`, rangesSource.map((range) => range.prefix).slice(0, 2).join(" · "), "Synchron"]
    ]
  }

  if (view === "users") {
    return usersSource.slice(0, 5).map((user) => [
      user.name || user.email || "Benutzer",
      user.email || user.role || "Teammitglied",
      user.role || "member",
      user.status || "active"
    ])
  }

  if (view === "license") {
    const limit = data.userLimit ?? fallbackUserLimit
    const currentUsers = limit.currentUsers ?? usersSource.length
    const maxUsers = limit.maxUsers ?? fallbackUserLimit.maxUsers ?? 5
    return [
      ["Benutzerlimit", `${currentUsers} von ${maxUsers} verwendet`, limit.plan || "Free", currentUsers >= maxUsers ? "Limit" : "OK"],
      ["Rechnungen pro Monat", "100 von 100", "Free Plan", "Limit"],
      ["Lizenzablauf", limit.validUntil ? limit.validUntil.slice(0, 10) : "Kein Ablaufdatum", "Status", "Aktiv"]
    ]
  }

  if (view === "notifications") {
    return notificationsSource.slice(0, 5).map((item) => [
      item.title,
      item.message || item.category || "Systemmeldung",
      item.category || "Info",
      item.readAt ? "Gelesen" : "Neu"
    ])
  }

  if (view === "automation") {
    return rangesSource.slice(0, 5).map((range) => [
      `${range.type} Nummernkreis`,
      `Prefix ${range.prefix}`,
      `Naechste ${range.nextValue}`,
      "Aktiv"
    ])
  }

  if (view === "audit") {
    return notificationsSource.slice(0, 5).map((item) => [
      item.title,
      item.message || item.category || "Ereignis",
      item.readAt ? "Gelesen" : "Neu",
      item.tone || "Info"
    ])
  }

  if (view === "api") {
    return [
      ["GET /api/invoice/list", "Rechnungsdaten", data.invoices.length ? "200 OK" : "Auth/Fallback", "Aktiv"],
      ["GET /api/customers/list", "Kundendaten", data.customers.length ? "200 OK" : "Auth/Fallback", "Aktiv"],
      ["GET /api/articles/list", "Artikel und Leistungen", data.articles.length ? "200 OK" : "Demo", "Aktiv"]
    ]
  }

  return moduleContent[view].rows
}

function moduleStats(view: Exclude<PremiumView, "dashboard">, data: PremiumData) {
  const source = data.invoices.length ? data.invoices : fallbackApiInvoices
  const projectsSource = data.projects.length ? data.projects : fallbackProjects
  const articlesSource = data.articles.length ? data.articles : fallbackApiArticles
  const usersSource = data.appUsers.length ? data.appUsers : fallbackAppUsers
  const notificationsSource = data.notifications.length ? data.notifications : fallbackNotifications
  const rangesSource = data.numberRanges.length ? data.numberRanges : fallbackNumberRanges

  if (view === "customers") {
    const activeCustomers = data.customers.filter((customer) => String(customer.status || "").toLowerCase() === "active").length
    return [[String(data.customers.length || 8), "Kunden"], [String(activeCustomers || 6), "Aktiv"], [data.loaded ? "API" : "Demo", "Datenquelle"]]
  }

  if (view === "projects" || view === "time") {
    const avgProgress = Math.round(projectsSource.reduce((sum, project) => sum + parsePercent(project.progress), 0) / Math.max(projectsSource.length, 1))
    return [[String(projectsSource.length), "Projekte"], [String(projectsSource.filter((project) => project.status === "Aktiv").length), "Aktiv"], [`${avgProgress}%`, "Fortschritt"]]
  }

  if (view === "invoices") {
    const invoiceSource = source.filter((invoice) => invoiceType(invoice) === "invoice")
    return [[String(invoiceSource.length), "Rechnungen"], [String(invoiceSource.filter((invoice) => isStatus(invoice.status, "overdue")).length), "Ueberfaellig"], [formatEuro(invoiceSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)), "Volumen"]]
  }

  if (view === "offers") {
    const offerSource = source.filter((invoice) => invoiceType(invoice) === "offer")
    return [[String(offerSource.length), "Angebote"], [formatEuro(offerSource.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)), "Pipeline"], [data.loaded ? "API" : "Demo", "Datenquelle"]]
  }

  if (view === "expenses") {
    return [[String(articlesSource.length), "Artikel"], [String(articlesSource.filter((article) => article.active !== false).length), "Aktiv"], [formatEuro(articlesSource.reduce((sum, article) => sum + Number(article.price || 0), 0)), "Listenwert"]]
  }

  if (view === "reports") {
    const total = source.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    const paid = source.filter((invoice) => isStatus(invoice.status, "paid")).reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    const paidShare = Math.round((paid / Math.max(total, 1)) * 100)
    return [[formatEuro(total), "Gesamtvolumen"], [`${paidShare}%`, "Bezahlt"], [String(source.length), "Dokumente"]]
  }

  if (view === "settings") {
    return [[String(rangesSource.length), "Nummernkreise"], [data.companySettings?.company ? "OK" : "Demo", "Firmendaten"], [data.loaded ? "API" : "Demo", "Datenquelle"]]
  }

  if (view === "users") {
    const activeUsers = usersSource.filter((user) => String(user.status || "").toLowerCase() === "active").length
    return [[String(usersSource.length), "Benutzer"], [String(activeUsers), "Aktiv"], [String(new Set(usersSource.map((user) => user.role || "member")).size), "Rollen"]]
  }

  if (view === "license") {
    const limit = data.userLimit ?? fallbackUserLimit
    const currentUsers = limit.currentUsers ?? usersSource.length
    const maxUsers = limit.maxUsers ?? fallbackUserLimit.maxUsers ?? 5
    return [[limit.plan || "Free", "Tarif"], [`${currentUsers}/${maxUsers}`, "Benutzer"], [limit.validUntil ? limit.validUntil.slice(0, 10) : "-", "Ablauf"]]
  }

  if (view === "notifications") {
    const unread = notificationsSource.filter((item) => !item.readAt).length
    return [[String(unread), "Neu"], [String(notificationsSource.length), "Gesamt"], [data.loaded ? "API" : "Demo", "Quelle"]]
  }

  if (view === "automation") {
    return [[String(rangesSource.length), "Regeln"], [String(rangesSource.filter((range) => range.nextValue > 0).length), "Aktiv"], ["0", "Fehler"]]
  }

  if (view === "audit") {
    return [[String(notificationsSource.length), "Events"], [String(notificationsSource.filter((item) => !item.readAt).length), "Offen"], ["30 T", "Aufbewahrung"]]
  }

  if (view === "api") {
    const connected = Number(data.invoices.length > 0) + Number(data.customers.length > 0) + Number(data.articles.length > 0)
    return [[String(connected), "Endpoints"], [data.loaded ? "Bereit" : "Laedt", "Status"], ["V2", "Preview"]]
  }

  return moduleContent[view].stats
}

function moduleFocus(view: Exclude<PremiumView, "dashboard">, data: PremiumData) {
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
    return [["Kunden gesamt", String(data.customers.length || 4)], ["Top Kontakt", firstCustomer?.name || fallbackCompanySettings.company || "Acme GmbH"], ["Datenquelle", data.loaded ? "API" : "Demo"]]
  }

  if (view === "projects" || view === "time") {
    const avgProgress = Math.round(projectsSource.reduce((sum, project) => sum + parsePercent(project.progress), 0) / Math.max(projectsSource.length, 1))
    return [["Aktive Projekte", String(projectsSource.filter((project) => project.status === "Aktiv").length)], ["Durchschnitt", `${avgProgress}%`], ["Naechstes Projekt", projectsSource[0]?.name || "Projekt anlegen"]]
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
    return [["Aktive Positionen", String(activeArticles.length)], ["Listenwert", formatEuro(activeArticles.reduce((sum, article) => sum + Number(article.price || 0), 0))], ["Top Kategorie", activeArticles[0]?.category || "Leistung"]]
  }

  if (view === "reports") {
    const total = source.reduce((sum, invoice) => sum + Number(invoice.grossTotal || 0), 0)
    const paidShare = Math.round((paidTotal / Math.max(total, 1)) * 100)
    return [["Gesamtvolumen", formatEuro(total)], ["Bezahlt", `${paidShare}%`], ["Dokumente", String(source.length)]]
  }

  if (view === "settings") {
    const company = data.companySettings ?? fallbackCompanySettings
    return [["Firma", company.company || "Nicht gesetzt"], ["Nummernkreise", String(rangesSource.length)], ["Status", data.loaded ? "Synchron" : "Demo"]]
  }

  if (view === "users" || view === "license") {
    const limit = userLimitFromData(data)
    return [["Benutzer", `${limit.currentUsers}/${limit.maxUsers}`], ["Tarif", limit.plan], ["Status", limit.isFull ? "Limit erreicht" : "Aktiv"]]
  }

  if (view === "notifications" || view === "audit") {
    const unread = notificationsSource.filter((item) => !item.readAt).length
    return [["Neue Ereignisse", String(unread)], ["Gesamt", String(notificationsSource.length)], ["Letzte Meldung", notificationsSource[0]?.title || "Keine Meldung"]]
  }

  if (view === "automation") {
    return [["Regeln", String(rangesSource.length)], ["Aktiv", String(rangesSource.filter((range) => range.nextValue > 0).length)], ["Naechster Lauf", rangesSource[0] ? `${rangesSource[0].type} ${rangesSource[0].nextValue}` : "Bereit"]]
  }

  if (view === "api") {
    const connected = Number(data.invoices.length > 0) + Number(data.customers.length > 0) + Number(data.articles.length > 0)
    return [["Endpoints", String(connected)], ["Status", data.loaded ? "Bereit" : "Laedt"], ["Version", "V2 Preview"]]
  }

  return moduleContent[view].focus
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

function moduleRowHref(view: Exclude<PremiumView, "dashboard">) {
  if (view === "customers") return "/customers"
  if (view === "projects" || view === "time") return "/projects"
  if (view === "invoices" || view === "offers") return "/documents"
  if (view === "expenses") return "/articles"
  if (view === "reports") return "/finance/statistics"
  if (view === "settings") return "/settings"
  if (view === "users" || view === "license") return "/settings/users"
  if (view === "integrations") return "/dashboard-v2/integrations"
  if (view === "automation") return "/settings/reminders"
  if (view === "notifications") return "/dashboard-v2/notifications"
  if (view === "audit") return "/dashboard-v2/audit"
  return "/dashboard-v2/api"
}

function PremiumModulePage({ view, data, searchQuery }: { view: Exclude<PremiumView, "dashboard">; data: PremiumData; searchQuery: string }) {
  const meta = premiumViewMeta[view]
  const content = moduleContent[view]
  const rows = moduleRows(view, data).filter((row) => matchesSearch(row, searchQuery))
  const stats = moduleStats(view, data)
  const focus = moduleFocus(view, data)
  const timeline = moduleTimeline(view, data)
  const rowHref = moduleRowHref(view)

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

      <section className={styles.moduleGrid}>
        <article className={`${styles.panel} ${styles.moduleCard}`}>
          <div className={styles.panelHead}><h2>Schnellzugriff</h2><span>Premium Aktionen</span></div>
          <div className={styles.actionStrip}>
            {content.actions.map(([action, href], index) => (
              <Link key={action} href={href}>
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
              <Link key={`${title}-${value}`} href={rowHref} className={styles.pipelineRow}>
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

export function PremiumWorkspacePage({ view = "dashboard" }: { view?: PremiumView }) {
  const [mode, setMode] = useState<ThemeMode>("dark")
  const [searchQuery, setSearchQuery] = useState("")
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
    const savedMode = window.localStorage.getItem("dream-invoice-premium-theme")
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode)
    }
  }, [])

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

  function handleModeChange(nextMode: ThemeMode) {
    setMode(nextMode)
    window.localStorage.setItem("dream-invoice-premium-theme", nextMode)
  }

  return (
    <div className={styles.page} data-theme={mode} role="main">
      <Sidebar />
      <section className={styles.contentShell}>
        <Topbar mode={mode} searchQuery={searchQuery} unreadCount={(data.notifications.length ? data.notifications : fallbackNotifications).filter((item) => !item.readAt).length} onModeChange={handleModeChange} onSearchChange={setSearchQuery} />
        {view === "dashboard" ? <DashboardOverview data={data} searchQuery={searchQuery} /> : <PremiumModulePage view={view} data={data} searchQuery={searchQuery} />}
      </section>
    </div>
  )
}
