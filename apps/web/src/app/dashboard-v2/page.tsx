"use client"

import type { ComponentType } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
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
type InvoiceRow = [number: string, customer: string, status: string, amount: string, date: string]
type ActivityRow = [title: string, text: string, time: string, tone: string]
type UserRow = [name: string, role: string, initials: string, crown: string]
type IntegrationRow = [name: string, meta: string, color: string]

const mainNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard-v2", icon: Home },
  { label: "Kunden", href: "/customers", icon: Users },
  { label: "Projekte", href: "/projects", icon: Folder },
  { label: "Rechnungen", href: "/documents", icon: FileText },
  { label: "Angebote", href: "/documents/new", icon: Tag },
  { label: "Zeiterfassung", href: "/projects", icon: Clock3 },
  { label: "Ausgaben", href: "/finance", icon: Wallet },
  { label: "Berichte", href: "/finance/statistics", icon: BarChart3 },
  { label: "Einstellungen", href: "/settings", icon: Settings }
]

const sideNav = [
  { section: "Hauptmenu", items: mainNav.slice(0, 8) },
  {
    section: "Management",
    items: [
      { label: "Benutzer & Rollen", href: "/settings/users", icon: Users },
      { label: "Lizenzen", href: "/settings/license", icon: KeyRound },
      { label: "Integrationen", href: "/settings/integrations", icon: Zap },
      { label: "Automatisierung", href: "/settings/automation", icon: Settings }
    ]
  },
  {
    section: "Extras",
    items: [
      { label: "Benachrichtigungen", href: "/settings/notifications", icon: Bell, badge: "12" },
      { label: "Aktivitaetsprotokoll", href: "/settings/audit", icon: ShieldCheck },
      { label: "API & Webhooks", href: "/settings/api", icon: Grid3X3 }
    ]
  }
]

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
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}><div className={styles.logoMark}>D</div><div><strong>DreamInvoice</strong><span>Premium Edition</span></div></div>
      <button className={styles.workspaceButton} type="button"><span className={styles.workspaceAvatar}>A</span><span><small>Workspace</small><strong>Acme GmbH</strong></span><ChevronDown size={14} /></button>
      <nav className={styles.sideSections}>{sideNav.map((group) => <div key={group.section} className={styles.sideSection}><p>{group.section}</p>{group.items.map((item) => { const Icon = item.icon; return <Link key={item.label} href={item.href} className={item.href === "/dashboard-v2" ? styles.activeSideItem : styles.sideItem}><Icon size={16} /><span>{item.label}</span>{item.badge ? <em>{item.badge}</em> : null}</Link> })}</div>)}</nav>
      <div className={styles.upgradeCard}><Crown size={26} /><strong>Upgrade & Skalieren</strong><span>Erweiterte Funktionen und unbegrenzte Benutzer</span><button type="button">Lizenz aktivieren</button></div>
    </aside>
  )
}

function Topbar({ mode, onModeChange }: { mode: ThemeMode; onModeChange: (mode: ThemeMode) => void }) {
  return (
    <header className={styles.topbar}>
      <div className={styles.searchBox}><Search size={16} /><span>Suche...</span></div>
      <nav className={styles.desktopNav}>{mainNav.map((item) => <Link key={item.label} className={item.href === "/dashboard-v2" ? styles.navActive : ""} href={item.href}>{item.label}</Link>)}</nav>
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

export default function DashboardV2Page() {
  const [mode, setMode] = useState<ThemeMode>("dark")

  return (
    <main className={styles.page} data-theme={mode}>
      <Sidebar />
      <section className={styles.contentShell}>
        <Topbar mode={mode} onModeChange={setMode} />
        <KpiGrid />
        <section className={styles.mainGrid}><RevenueChart /><StatusPanel /><QuickActions /></section>
        <section className={styles.lowerGrid}><InvoiceTable /><BarPanel /><ActivityFeed /></section>
        <section className={styles.bottomGrid}><UsersPanel /><LicensePanel /></section>
        <IntegrationsPanel />
      </section>
    </main>
  )
}
