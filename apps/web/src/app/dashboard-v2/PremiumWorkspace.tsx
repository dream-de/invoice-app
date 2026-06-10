"use client"

import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
type ModuleConfig = {
  stats: Array<[value: string, label: string]>
  rows: ModuleRow[]
  focus: Array<[label: string, value: string]>
  actions: string[]
  timeline: Array<[title: string, text: string]>
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
const months = ["Aug", "Sep", "Okt", "Nov", "Dez", "Jan", "Feb", "Maer", "Apr", "Mai", "Jun", "Jul", ""]

const moduleContent: Record<Exclude<PremiumView, "dashboard">, ModuleConfig> = {
  customers: {
    stats: [["186", "Kunden"], ["24", "Aktiv"], ["98%", "Kontaktqualitaet"]],
    rows: [["Meridian Studio GmbH", "4 offene Dokumente", "2.467,00 EUR", "Aktiv"], ["Aurora Labs GmbH", "Zahlung erhalten", "719,05 EUR", "Bezahlt"], ["Pixel Perfect Ltd.", "Neues Projekt", "Design Sprint", "Neu"]],
    focus: [["Offene Forderungen", "3.614,00 EUR"], ["Top Kunde", "Meridian Studio"], ["Naechster Kontakt", "Heute 15:30"]],
    actions: ["Kunde anlegen", "Import starten", "Segment pruefen"],
    timeline: [["Kontakt aktualisiert", "Daniel hat Ansprechpartner und Zahlungsziel angepasst."], ["Projekt verknuepft", "Website Redesign wurde Meridian Studio zugeordnet."], ["Bonitaet geprueft", "Kundenrisiko bleibt im gruenen Bereich."]]
  },
  projects: {
    stats: [["18", "Projekte"], ["8", "In Arbeit"], ["74%", "Auslastung"]],
    rows: [["Website Redesign", "Phase 2 aktiv", "78%", "Aktiv"], ["Brand Portal", "Review offen", "42%", "Review"], ["DATEV Export", "Bereit fuer Abnahme", "100%", "Fertig"]],
    focus: [["Abrechenbare Zeit", "126 h"], ["Budget offen", "8.430,00 EUR"], ["Naechster Meilenstein", "Freitag"]],
    actions: ["Projekt anlegen", "Aufgabe planen", "Budget pruefen"],
    timeline: [["Meilenstein bewegt", "Phase 2 wurde in Review verschoben."], ["Budgetwarnung", "Brand Portal liegt bei 82% des geplanten Budgets."], ["Freigabe erhalten", "DATEV Export kann final abgerechnet werden."]]
  },
  invoices: {
    stats: [["42", "Rechnungen"], ["11", "Ueberfaellig"], ["86%", "Zahlungsquote"]],
    rows: invoices.map(([number, customer, status, amount]) => [number, customer, amount, status]) as ModuleRow[],
    focus: [["Faellig diese Woche", "1.676,00 EUR"], ["Automatische Mahnungen", "7 aktiv"], ["Naechster Versand", "Heute 16:00"]],
    actions: ["Rechnung erstellen", "Mahnlauf starten", "Zahlung buchen"],
    timeline: [["Rechnung erstellt", "OF-2026-5001 wurde fuer Meridian Studio vorbereitet."], ["Zahlung erkannt", "719,05 EUR von Aurora Labs wurden zugeordnet."], ["Mahnung geplant", "Pixel Perfect Ltd. erhaelt morgen eine Erinnerung."]]
  },
  offers: {
    stats: [["16", "Angebote"], ["9", "Offen"], ["41%", "Annahmequote"]],
    rows: [["OF-2026-5001", "Meridian Studio GmbH", "1.320,00 EUR", "Entwurf"], ["OF-2026-4997", "Pixel Perfect Ltd.", "1.147,00 EUR", "Offen"], ["OF-2026-4992", "Urban Commerce Inc.", "2.840,00 EUR", "Review"]],
    focus: [["Pipeline", "12.640,00 EUR"], ["Entwuerfe", "5"], ["Ablauf in 7 Tagen", "3"]],
    actions: ["Angebot erstellen", "Version duplizieren", "PDF senden"],
    timeline: [["Angebot versendet", "Pixel Perfect Ltd. hat Version 3 erhalten."], ["Preisposition geaendert", "Hosting wurde als optionale Position markiert."], ["Annahme erwartet", "Meridian Studio will bis Freitag entscheiden."]]
  },
  time: {
    stats: [["126 h", "Erfasst"], ["34 h", "Abrechenbar"], ["91%", "Freigegeben"]],
    rows: [["Website Redesign", "Daniel und Sarah", "18:40 h", "Laeuft"], ["Brand Portal", "Julia", "07:15 h", "Pruefung"], ["Support Retainer", "Thomas", "04:30 h", "Bereit"]],
    focus: [["Aktiver Timer", "01:24:18"], ["Heute erfasst", "6:45 h"], ["Nicht abgerechnet", "34 h"]],
    actions: ["Timer starten", "Zeit buchen", "Freigabe senden"],
    timeline: [["Timer gestartet", "Daniel arbeitet an Website Redesign."], ["Zeit freigegeben", "Sarahs Eintrag wurde fuer Abrechnung markiert."], ["Monatsabschluss", "Mai-Zeiten sind bereit fuer Rechnungen."]]
  },
  expenses: {
    stats: [["528,99", "Ausgaben"], ["12", "Belege"], ["100%", "Zuordnung"]],
    rows: [["Adobe Creative Cloud", "Software", "71,39 EUR", "Bezahlt"], ["Hetzner Cloud", "Hosting", "43,20 EUR", "Verbucht"], ["DB Reise", "Projektkosten", "128,40 EUR", "Pruefung"]],
    focus: [["Monatliches Budget", "2.000,00 EUR"], ["Erstattungen offen", "214,20 EUR"], ["DATEV bereit", "10 Belege"]],
    actions: ["Ausgabe erfassen", "Beleg hochladen", "Export starten"],
    timeline: [["Beleg erkannt", "OCR hat Kategorie und Betrag automatisch gesetzt."], ["Kostenstelle gesetzt", "Hosting wurde Projekt Website Redesign zugeordnet."], ["Export vorbereitet", "10 Belege sind DATEV-kompatibel."]]
  },
  reports: {
    stats: [["18%", "Wachstum"], ["34%", "Marge"], ["12", "Reports"]],
    rows: [["Cashflow Juni", "Umsatz und Ausgaben", "+1.860,00 EUR", "Bereit"], ["Kundenwert", "Top 10 Kunden", "8.420,00 EUR", "Aktuell"], ["Steuerreport", "USt-Voranmeldung", "Pruefen", "Offen"]],
    focus: [["Umsatz YTD", "48.920,00 EUR"], ["Kosten YTD", "18.110,00 EUR"], ["Prognose", "+22%"]],
    actions: ["Report exportieren", "Filter speichern", "Vergleich oeffnen"],
    timeline: [["Report erstellt", "Cashflow Juni wurde aktualisiert."], ["Abweichung erkannt", "Ausgaben liegen 8% unter Prognose."], ["Export geplant", "Steuerreport wird Freitag vorbereitet."]]
  },
  settings: {
    stats: [["9", "Bereiche"], ["3", "Pruefen"], ["100%", "Gesichert"]],
    rows: [["Unternehmen", "Acme GmbH", "Vollstaendig", "Aktiv"], ["Nummernkreise", "RE-2026 und OF-2026", "Synchron", "Aktiv"], ["E-Mail Versand", "SMTP verbunden", "OK", "Aktiv"]],
    focus: [["Portal", "Aktiv"], ["Sprache", "Deutsch"], ["Sicherheit", "2FA empfohlen"]],
    actions: ["Firma bearbeiten", "Nummernkreis pruefen", "Portal oeffnen"],
    timeline: [["SMTP getestet", "Versandadresse ist erreichbar."], ["Logo aktualisiert", "Premium Branding wurde gespeichert."], ["Backup gesetzt", "Systemeinstellungen wurden versioniert."]]
  },
  users: {
    stats: [["5/5", "Benutzer"], ["3", "Rollen"], ["2FA", "Empfohlen"]],
    rows: users.map(([name, role]) => [name, role, "Aktiv", role === "Administrator" ? "Owner" : "Team"]) as ModuleRow[],
    focus: [["Admin", "Daniel"], ["Lizenzlimit", "5 Benutzer"], ["Letzter Login", "Heute"]],
    actions: ["Benutzer einladen", "Rolle bearbeiten", "2FA pruefen"],
    timeline: [["Einladung vorbereitet", "Neuer Benutzer kann per E-Mail eingeladen werden."], ["Rolle geaendert", "Sarah ist Manager mit Projektfreigaben."], ["Sicherheitshinweis", "2FA fuer Buchhaltung empfohlen."]]
  },
  license: {
    stats: [["Free", "Tarif"], ["100", "Rechnungen"], ["1 GB", "Speicher"]],
    rows: [["Benutzerlimit", "5 von 5 verwendet", "Voll", "Limit"], ["Rechnungen pro Monat", "100 von 100", "Voll", "Limit"], ["Speicher", "1 GB von 1 GB", "Voll", "Limit"]],
    focus: [["Upgrade Vorteil", "Unbegrenzt"], ["Premium Support", "Enthalten"], ["Aktivierung", "Lizenz-Key"]],
    actions: ["Lizenz aktivieren", "Upgrade pruefen", "Key eingeben"],
    timeline: [["Limit erreicht", "Kostenloser Plan ist vollstaendig ausgereizt."], ["Upgrade vorbereitet", "Premium schaltet unbegrenzte Benutzer frei."], ["Abrechnung bereit", "Lizenzdaten koennen hinterlegt werden."]]
  },
  integrations: {
    stats: [["6", "Verbunden"], ["2", "Aktion noetig"], ["99%", "Sync"]],
    rows: integrations.slice(0, 4).map(([name, meta]) => [name, meta, "Verbunden", "Aktiv"]) as ModuleRow[],
    focus: [["Zahlungen", "Stripe, PayPal"], ["Buchhaltung", "DATEV"], ["Automation", "Zapier"]],
    actions: ["Integration verbinden", "Sync pruefen", "Token erneuern"],
    timeline: [["Stripe synchronisiert", "Neue Zahlung wurde automatisch zugeordnet."], ["DATEV Export bereit", "Buchhaltungsdaten sind vorbereitet."], ["Zapier aktiv", "Webhook fuer neue Rechnung feuert korrekt."]]
  },
  automation: {
    stats: [["14", "Workflows"], ["9", "Aktiv"], ["312", "Runs"]],
    rows: [["Mahnung nach 7 Tagen", "Rechnungen", "9 Runs", "Aktiv"], ["Monatsreport senden", "Berichte", "1 Run", "Geplant"], ["Beleg automatisch taggen", "Ausgaben", "42 Runs", "Aktiv"]],
    focus: [["Gesparte Zeit", "18 h"], ["Fehlerquote", "0,8%"], ["Naechster Run", "Morgen 08:00"]],
    actions: ["Workflow erstellen", "Regel testen", "Run Verlauf"],
    timeline: [["Mahnlauf ausgefuehrt", "3 Kunden wurden automatisch erinnert."], ["Regel getestet", "Belegtagging erkennt Softwarekosten."], ["Workflow pausiert", "Alter Export wurde deaktiviert."]]
  },
  notifications: {
    stats: [["12", "Neu"], ["4", "Wichtig"], ["0", "Kritisch"]],
    rows: [["Zahlung erhalten", "Aurora Labs GmbH", "719,05 EUR", "Neu"], ["Rechnung ueberfaellig", "Pixel Perfect Ltd.", "1.147,00 EUR", "Wichtig"], ["Projekt aktualisiert", "Website Redesign", "Phase 2", "Info"]],
    focus: [["Inbox", "12 Meldungen"], ["Heute", "6 Ereignisse"], ["Regeln", "8 aktiv"]],
    actions: ["Regeln bearbeiten", "Alle gelesen", "Filter setzen"],
    timeline: [["Push gesendet", "Daniel wurde ueber Zahlung informiert."], ["Regel angewendet", "Ueberfaellige Rechnung markiert."], ["Benachrichtigung geplant", "Tagesbericht wird um 18:00 gesendet."]]
  },
  audit: {
    stats: [["248", "Events"], ["0", "Risiken"], ["30 T", "Aufbewahrung"]],
    rows: [["Daniel", "Rechnung exportiert", "OF-2026-5001", "Heute"], ["Sarah", "Kunde bearbeitet", "Aurora Labs", "Heute"], ["System", "Webhook ausgeliefert", "invoice.created", "Gestern"]],
    focus: [["Sicherheitsstatus", "Gruen"], ["Letzter Export", "Heute"], ["Admin Aktionen", "14"]],
    actions: ["Audit exportieren", "Filter setzen", "Ereignis suchen"],
    timeline: [["Export protokolliert", "PDF-Download wurde im Audit gespeichert."], ["Zugriff erlaubt", "Sarah hat Kundenprofil geoeffnet."], ["Webhook signiert", "Event wurde erfolgreich ausgeliefert."]]
  },
  api: {
    stats: [["3", "Keys"], ["8", "Webhooks"], ["99.9%", "Uptime"]],
    rows: [["invoice.created", "Webhook", "200 OK", "Aktiv"], ["payment.received", "Webhook", "200 OK", "Aktiv"], ["customer.updated", "Webhook", "Retry 1", "Pruefung"]],
    focus: [["Rate Limit", "18% genutzt"], ["Letzter Fehler", "Gestern"], ["Signaturen", "Aktiv"]],
    actions: ["Webhook erstellen", "API-Key rotieren", "Logs oeffnen"],
    timeline: [["Webhook ausgeliefert", "invoice.created wurde in 184 ms bestaetigt."], ["Key rotiert", "Alter Schluessel wurde deaktiviert."], ["Retry geplant", "customer.updated wird erneut gesendet."]]
  }
}

function linePoints(values: number[], height: number) {
  const max = Math.max(...values)
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100
    const y = height - (value / max) * (height - 12) - 4
    return `${x},${y}`
  }).join(" ")
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
      <div className={styles.upgradeCard}><Crown size={26} /><strong>Upgrade & Skalieren</strong><span>Erweiterte Funktionen und unbegrenzte Benutzer</span><button type="button">Lizenz aktivieren</button></div>
    </aside>
  )
}

function Topbar({ mode, onModeChange }: { mode: ThemeMode; onModeChange: (mode: ThemeMode) => void }) {
  const pathname = usePathname()

  return (
    <header className={styles.topbar}>
      <div className={styles.searchBox}><Search size={16} /><span>Suche...</span></div>
      <nav className={styles.desktopNav}>{mainNav.map((item) => <Link key={item.label} className={pathname === item.href ? styles.navActive : ""} href={item.href}>{item.label}</Link>)}</nav>
      <div className={styles.topActions}><ThemeToggle mode={mode} onChange={onModeChange} /><button type="button" aria-label="Neu"><Plus size={18} /></button><button type="button" aria-label="Benachrichtigungen" className={styles.bellButton}><Bell size={18} /><span>12</span></button><button type="button" aria-label="Hilfe"><HelpCircle size={18} /></button><div className={styles.profile}><span>D</span><div><strong>Daniel</strong><small>Administrator</small></div></div></div>
    </header>
  )
}

function KpiGrid() {
  return <section className={styles.kpiGrid}>{kpis.map((item) => { const Icon = item.icon; return <article key={item.label} className={`${styles.panel} ${styles.kpiCard}`} data-tone={item.tone}><div className={styles.kpiIcon}><Icon size={22} /></div><div><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div><MoreVertical size={17} className={styles.moreIcon} /></article> })}</section>
}

function RevenueChart() {
  const chartHeight = 155
  const revenuePoints = useMemo(() => linePoints(revenue, chartHeight), [])
  const paymentPoints = useMemo(() => linePoints(payments, chartHeight), [])
  const expensePoints = useMemo(() => linePoints(expenses, chartHeight), [])

  return (
    <article className={`${styles.panel} ${styles.revenuePanel}`}>
      <div className={styles.panelHead}><div><h2>Umsatzuebersicht</h2><span>Umsaetze, Zahlungen und Ausgaben</span></div><button type="button">Letzte 12 Monate <ChevronDown size={14} /></button></div>
      <div className={styles.legend}><span data-color="violet">Umsatz</span><span data-color="green">Zahlungen</span><span data-color="amber">Ausgaben</span></div>
      <div className={styles.chartArea}><svg viewBox={`0 0 100 ${chartHeight}`} preserveAspectRatio="none" aria-label="Umsatzdiagramm"><polyline points={revenuePoints} className={styles.revenueLine} /><polyline points={paymentPoints} className={styles.paymentLine} /><polyline points={expensePoints} className={styles.expenseLine} />{[0, 1, 2].map((index) => <circle key={index} cx="58.3" cy={index === 0 ? "45" : index === 1 ? "72" : "118"} r="1.8" className={styles.chartDot} />)}</svg><div className={styles.chartTooltip}><strong>April 2026</strong><span><i />Umsatz <b>1.820,00 EUR</b></span><span><i />Zahlungen <b>1.450,00 EUR</b></span><span><i />Ausgaben <b>680,00 EUR</b></span></div><div className={styles.monthLabels}>{months.map((month, index) => <span key={`${month}-${index}`}>{month}</span>)}</div></div>
    </article>
  )
}

function StatusPanel() {
  return <article className={`${styles.panel} ${styles.statusPanel}`}><div className={styles.panelHead}><h2>Rechnungsstatus</h2></div><div className={styles.donutWrap}><div className={styles.donut}><div><strong>4</strong><span>Gesamt</span></div></div><div className={styles.statusLegend}>{[["Bezahlt", "green"], ["Offen", "blue"], ["Ueberfaellig", "rose"], ["Entwurf", "muted"]].map(([label, tone]) => <div key={label}><span data-tone={tone} />{label}<b>1 (25%)</b></div>)}</div></div></article>
}

function QuickActions() {
  const actions: Array<{ label: string; icon: IconType; tone: string }> = [
    { label: "Neue Rechnung", icon: FileText, tone: "violet" },
    { label: "Neuer Kunde", icon: UserPlus, tone: "blue" },
    { label: "Neues Projekt", icon: Folder, tone: "green" },
    { label: "Angebot erstellen", icon: Tag, tone: "amber" },
    { label: "Zeiterfassung starten", icon: Clock3, tone: "rose" },
    { label: "Ausgabe erfassen", icon: Wallet, tone: "green" }
  ]
  return <article className={`${styles.panel} ${styles.quickPanel}`}><div className={styles.robot}>AI</div><div className={styles.panelHead}><div><h2>Schnellaktionen</h2><span>Hallo Daniel. Was moechten Sie heute erledigen?</span></div></div><div className={styles.quickGrid}>{actions.map((action) => { const Icon = action.icon; return <button key={action.label} type="button" data-tone={action.tone}><Icon size={19} /><span>{action.label}</span></button> })}</div></article>
}

function InvoiceTable() {
  return <article className={`${styles.panel} ${styles.tablePanel}`}><div className={styles.panelHead}><h2>Kuerzlich erstellte Rechnungen</h2><Link href="/documents">Alle anzeigen</Link></div><div className={styles.tableScroll}><table><thead><tr><th>Rechnung</th><th>Kunde</th><th>Status</th><th>Betrag</th><th>Datum</th></tr></thead><tbody>{invoices.map(([number, customer, status, amount, date]) => <tr key={number}><td>{number}</td><td>{customer}</td><td><span data-status={status}>{status}</span></td><td>{amount}</td><td>{date}</td></tr>)}</tbody></table></div></article>
}

function BarPanel() {
  const income = [720, 1150, 860, 1000, 1260, 980]
  const spend = [360, 460, 420, 610, 680, 520]
  const labels = ["Feb", "Maer", "Apr", "Mai", "Jun", "Jul"]
  return <article className={`${styles.panel} ${styles.barPanel}`}><div className={styles.panelHead}><h2>Einnahmen & Ausgaben</h2><button type="button">Monatlich <ChevronDown size={14} /></button></div><div className={styles.barChart}>{labels.map((label, index) => <div key={label} className={styles.barGroup}><div><span className={styles.incomeBar} style={{ height: `${income[index] / 13}px` }} /><span className={styles.spendBar} style={{ height: `${spend[index] / 13}px` }} /></div><small>{label}</small></div>)}</div><div className={styles.legend}><span data-color="violet">Einnahmen</span><span data-color="amber">Ausgaben</span></div></article>
}

function ActivityFeed() {
  return <article className={`${styles.panel} ${styles.activityPanel}`}><div className={styles.panelHead}><h2>Aktivitaetsfeed</h2><Link href="/settings/audit">Alle anzeigen</Link></div><div className={styles.activityList}>{activities.map(([title, text, time, tone]) => <div key={title} className={styles.activityItem}><span data-tone={tone}><CheckCircle2 size={14} /></span><div><strong>{title}</strong><p>{text}</p></div><time>{time}</time></div>)}</div></article>
}

function UsersPanel() {
  return <article className={`${styles.panel} ${styles.usersPanel}`}><div className={styles.usersMeta}><h2>Benutzer & Rollen</h2><span>5/5 kostenlose Benutzer</span><div><i /></div><button type="button">Benutzer verwalten</button></div><div className={styles.userCards}>{users.map(([name, role, initials, crown]) => <div key={name} className={styles.userCard}><div className={styles.avatar}>{initials}</div>{crown ? <Crown size={15} /> : null}<strong>{name}</strong><span>{role}</span><em>Aktiv</em></div>)}<button type="button" className={styles.addUser}><Plus size={24} /><span>Benutzer hinzufuegen</span></button></div></article>
}

function LicensePanel() {
  return <article className={`${styles.panel} ${styles.licensePanel}`}><div className={styles.panelHead}><h2>Lizenzstatus</h2><span className={styles.freeBadge}>Kostenlos</span></div><div className={styles.licenseGrid}><div><span>Benutzer</span><b>5 / 5</b></div><div><span>Rechnungen / Monat</span><b>100 / 100</b></div><div><span>Speicher</span><b>1 GB / 1 GB</b></div><div><span>Ablaufdatum</span><b>-</b></div></div><button type="button"><span>Lizenz / Upgrade aktivieren</span><KeyRound size={18} /></button></article>
}

function IntegrationsPanel() {
  return <article className={`${styles.panel} ${styles.integrationsPanel}`}><h2>Integrationen</h2><div className={styles.integrationsGrid}>{integrations.map(([name, meta, color]) => <div key={name}><span style={{ backgroundColor: color }}>{name.charAt(0)}</span><strong>{name}</strong><small>{meta}</small></div>)}<button type="button"><Grid3X3 size={18} />Mehr anzeigen</button></div></article>
}

function DashboardOverview() {
  return (
    <>
      <KpiGrid />
      <section className={styles.mainGrid}><RevenueChart /><StatusPanel /><QuickActions /></section>
      <section className={styles.lowerGrid}><InvoiceTable /><BarPanel /><ActivityFeed /></section>
      <section className={styles.bottomGrid}><UsersPanel /><LicensePanel /></section>
      <IntegrationsPanel />
    </>
  )
}

function PremiumModulePage({ view }: { view: Exclude<PremiumView, "dashboard"> }) {
  const meta = premiumViewMeta[view]
  const content = moduleContent[view]

  return (
    <section className={styles.modulePage}>
      <article className={`${styles.panel} ${styles.moduleHero}`}>
        <div>
          <span>{meta.eyebrow}</span>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        <button type="button"><Plus size={18} />{meta.primary}</button>
      </article>

      <section className={styles.moduleStatsGrid}>
        {content.stats.map(([value, label]) => (
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
            {content.actions.map((action, index) => (
              <button key={action} type="button">
                {index === 0 ? <Plus size={16} /> : index === 1 ? <Search size={16} /> : <BarChart3 size={16} />}
                {action}
              </button>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.moduleCard}`}>
          <div className={styles.panelHead}><h2>Fokus</h2><span>Wichtige Werte</span></div>
          <div className={styles.focusList}>
            {content.focus.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.timelinePanel}`}>
          <div className={styles.panelHead}><h2>Aktuell</h2><span>Letzte Ereignisse</span></div>
          <div className={styles.moduleTimeline}>
            {content.timeline.map(([title, text]) => (
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
            {content.rows.map(([title, subtitle, value, status]) => (
              <div key={`${title}-${value}`}>
                <span><strong>{title}</strong><small>{subtitle}</small></span>
                <b>{value}</b>
                <em>{status}</em>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  )
}

export function PremiumWorkspacePage({ view = "dashboard" }: { view?: PremiumView }) {
  const [mode, setMode] = useState<ThemeMode>("dark")

  useEffect(() => {
    const savedMode = window.localStorage.getItem("dream-invoice-premium-theme")
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode)
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
        <Topbar mode={mode} onModeChange={handleModeChange} />
        {view === "dashboard" ? <DashboardOverview /> : <PremiumModulePage view={view} />}
      </section>
    </div>
  )
}
