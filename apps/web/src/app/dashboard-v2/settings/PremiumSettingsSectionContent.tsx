"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Archive,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileText,
  Filter,
  KeyRound,
  Link2,
  LockKeyhole,
  Plug,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  SortAsc,
  Users2,
  Workflow
} from "lucide-react"
import CompanySettingsPage from "../../settings/company/page"
import EmailSettingsPage from "../../settings/email/page"
import FinanceSettingsPage from "../../settings/finance/page"
import LegalSettingsPage from "../../settings/legal/page"
import NotificationSettingsPage from "../../settings/notifications/page"
import NumberRangesSettingsPage from "../../settings/number-ranges/page"
import PortalSettingsPage from "../../settings/portal/page"
import RemindersSettingsPage from "../../settings/reminders/page"
import SystemSettingsPage from "../../settings/system/page"
import { UsersAndPermissionsClient } from "../../settings/users/UsersAndPermissionsClient"
import { SettingCard } from "../../settings/_components/SettingsControls"
import { SettingsLayout } from "../../settings/_components/SettingsLayout"
import { type PremiumSettingsSection } from "./sectionMap"
import { settingsItemByKey } from "@/lib/settings-nav"

type SettingsIcon = ComponentType<{ className?: string }>

type ModuleSubpoint = { key: string; title: string }

const defaultModuleSubpoints: ModuleSubpoint[] = [
  { key: "uebersicht", title: "Uebersicht" },
  { key: "einstellungen", title: "Einstellungen" },
  { key: "regeln", title: "Regeln" },
  { key: "protokoll", title: "Protokoll" }
]

const moduleSubpoints: Record<string, ModuleSubpoint[]> = {
  company: [
    { key: "profil", title: "Profil" },
    { key: "standorte", title: "Standorte" },
    { key: "mandanten", title: "Mandanten" },
    { key: "gruppen", title: "Gruppen" },
    { key: "branding", title: "Branding" },
    { key: "dokumentkopf", title: "Dokumentkopf" }
  ],
  locations: [
    { key: "standorte", title: "Standorte" },
    { key: "adressen", title: "Adressen" },
    { key: "kontakte", title: "Kontakte" },
    { key: "zuordnung", title: "Zuordnung" }
  ],
  tenants: [
    { key: "mandanten", title: "Mandanten" },
    { key: "gruppen", title: "Gruppen" },
    { key: "rollen", title: "Rollen" },
    { key: "zugriff", title: "Zugriff" }
  ],
  branding: [
    { key: "logo", title: "Logo" },
    { key: "farben", title: "Farben" },
    { key: "dokumentkopf", title: "Dokumentkopf" },
    { key: "layout", title: "Layout" }
  ],
  users: [
    { key: "benutzer", title: "Benutzer" },
    { key: "rollen", title: "Rollen" },
    { key: "rechte", title: "Rechte" },
    { key: "lizenz", title: "Lizenz" }
  ],
  permissions: [
    { key: "matrix", title: "Rechtematrix" },
    { key: "rollen", title: "Rollen" },
    { key: "scopes", title: "Scopes" }
  ],
  security: [
    { key: "profil", title: "Profil" },
    { key: "passwort", title: "Passwort" },
    { key: "2fa", title: "2FA" },
    { key: "sitzungen", title: "Sitzungen" },
    { key: "geraete", title: "Geraete" },
    { key: "konto", title: "Konto" }
  ],
  sessions: [
    { key: "aktive-sitzungen", title: "Aktive Sitzungen" },
    { key: "geraete", title: "Geraete" },
    { key: "status", title: "Status" }
  ],
  api: [
    { key: "keys", title: "Keys" },
    { key: "scopes", title: "Scopes" },
    { key: "versionen", title: "Versionen" }
  ],
  webhooks: [
    { key: "endpunkte", title: "Endpunkte" },
    { key: "events", title: "Events" },
    { key: "zustellung", title: "Zustellung" }
  ],
  integrations: [
    { key: "anbieter", title: "Anbieter" },
    { key: "payments", title: "Payments" },
    { key: "exporte", title: "Exporte" }
  ],
  dev: [
    { key: "diagnose", title: "Diagnose" },
    { key: "flags", title: "Feature Flags" },
    { key: "jobs", title: "Jobs" }
  ],
  system: [
    { key: "sprache", title: "Sprache" },
    { key: "optionen", title: "Optionen" },
    { key: "wartung", title: "Wartung" }
  ],
  "logs-monitoring": [
    { key: "aktivitaet", title: "Aktivitaet" },
    { key: "login", title: "Login" },
    { key: "audit", title: "Audit" },
    { key: "api", title: "API" },
    { key: "webhooks", title: "Webhooks" },
    { key: "fehler", title: "Fehler" },
    { key: "system", title: "System" }
  ]
}

function SettingsSectionNavigation({ activeKey }: { activeKey: string }) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") ?? (moduleSubpoints[activeKey] ?? defaultModuleSubpoints)[0]?.key
  const activeModule = settingsItemByKey(activeKey)
  const subpoints = moduleSubpoints[activeKey] ?? defaultModuleSubpoints
  const theme = searchParams.get("theme")

  function hrefFor(tab: string) {
    const params = new URLSearchParams()
    if (theme) params.set("theme", theme)
    params.set("tab", tab)
    return `${activeModule?.href ?? "/dashboard-v2/settings/" + activeKey}?${params.toString()}`
  }

  return (
    <div className="mb-6 rounded-lg border border-[var(--settings-line)] bg-[var(--settings-surface)] p-3 shadow-[var(--settings-card-shadow)]">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-[var(--settings-muted)]">Modul</p>
          <h2 className="text-lg font-black text-[var(--settings-title)]">{activeModule?.title ?? activeKey}</h2>
        </div>
        <Link href="/dashboard-v2/settings" className="inline-flex h-8 items-center rounded-md border border-[var(--settings-line)] px-2.5 text-[11px] font-black text-[var(--settings-muted)] no-underline hover:bg-[var(--settings-subtle)]">Alle Module</Link>
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label={`Unterpunkte im Modul ${activeModule?.title ?? activeKey}`}>
        {subpoints.map((item) => (
          <Link
            key={item.key}
            href={hrefFor(item.key)}
            className={`inline-flex min-h-8 items-center rounded-md border px-2 text-[11px] font-black no-underline transition ${item.key === activeTab ? "border-[var(--settings-accent)] bg-[var(--settings-accent-soft)] text-[var(--settings-title)] shadow-sm" : "border-[var(--settings-line)] bg-[var(--settings-subtle)] text-[var(--settings-muted)] hover:text-[var(--settings-title)]"}`}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}

type UsersRolesPayload = {
  users: Array<{
    id: string
    name: string | null
    email: string
    role: "admin" | "user"
    status: "active" | "inactive" | "disabled"
    lastLoginAt: string | null
    invitedAt: string | null
    disabledAt: string | null
    permissions: Array<{ scope: string; action: string; allowed: boolean }>
    createdAt: string
    updatedAt: string
  }>
  limit: {
    activeUsers: number
    maxUsers: number
    remainingUsers: number
    limitReached: boolean
    plan: string
    billingCycle: string
    status: string
    validUntil: string | null
  }
}

type ManagementRow = {
  name: string
  detail: string
  owner: string
  status: "Aktiv" | "Vorbereitet" | "Teilweise aktiv" | "Inaktiv"
  activity: string
  href: string
  icon: SettingsIcon
}

function statusClass(status: ManagementRow["status"]) {
  if (status === "Aktiv") return "bg-emerald-50 text-emerald-700 ring-emerald-200"
  if (status === "Teilweise aktiv") return "bg-sky-50 text-sky-700 ring-sky-200"
  if (status === "Vorbereitet") return "bg-slate-100 text-slate-700 ring-slate-200"
  return "bg-zinc-100 text-zinc-600 ring-zinc-200"
}

function StatusPill({ status }: { status: ManagementRow["status"] }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-extrabold ring-1 ${statusClass(status)}`}>
      {status}
    </span>
  )
}

function ManagementPage({
  title,
  description,
  rows,
  filters = ["Alle", "Aktiv", "Teilweise aktiv", "Vorbereitet", "Inaktiv"],
  activity
}: {
  title: string
  description: string
  rows: ManagementRow[]
  filters?: string[]
  activity: Array<[string, string, ManagementRow["status"]]>
}) {
  const [filter, setFilter] = useState(filters[0] ?? "Alle")
  const visibleRows = useMemo(() => rows.filter((row) => filter === "Alle" || row.status === filter), [filter, rows])
  const activeCount = rows.filter((row) => row.status === "Aktiv").length
  const preparedCount = rows.filter((row) => row.status === "Vorbereitet").length

  return (
    <SettingsLayout title={title} description={description}>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Module", String(rows.length), "Gesamter Verwaltungsbereich"],
          ["Aktiv", String(activeCount), "Bereits nutzbare Funktionen"],
          ["Vorbereitet", String(preparedCount), "Ohne entfernte Bestandslogik"]
        ].map(([label, value, text]) => (
          <div key={label} className="rounded-lg border border-[var(--settings-line)] bg-[var(--settings-surface)] p-4 shadow-[var(--settings-card-shadow)]">
            <p className="text-[11px] font-extrabold uppercase text-[var(--settings-muted)]">{label}</p>
            <strong className="mt-1 block text-2xl font-extrabold text-[var(--settings-title)]">{value}</strong>
            <span className="mt-1 block text-xs font-medium text-[var(--settings-muted)]">{text}</span>
          </div>
        ))}
      </div>

      <SettingCard title="Verwaltung" description="Status und Zustaendigkeiten direkt in der Settings-Detailseite pruefen.">
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
          <Filter className="h-4 w-4 shrink-0 text-[var(--settings-muted)]" />
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`h-8 shrink-0 rounded-md border px-2.5 text-[11px] font-extrabold transition ${filter === item ? "border-[var(--settings-accent)] bg-[var(--settings-accent-soft)] text-[var(--settings-title)]" : "border-[var(--settings-line)] bg-[var(--settings-subtle)] text-[var(--settings-muted)] hover:text-[var(--settings-title)]"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--settings-line)]">
          <table className="min-w-[760px] w-full border-collapse text-left">
            <thead className="bg-[var(--settings-subtle)] text-[11px] font-extrabold uppercase text-[var(--settings-muted)]">
              <tr>
                <th className="px-3 py-2">Bereich</th>
                <th className="px-3 py-2">Zustaendig</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Aktivitaet</th>
                <th className="px-3 py-2 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--settings-line)]">
              {visibleRows.map((row) => {
                const Icon = row.icon
                return (
                  <tr key={row.name} className="bg-[var(--settings-surface)]">
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]"><Icon className="h-4 w-4" /></span>
                        <div>
                          <strong className="block text-sm font-extrabold text-[var(--settings-title)]">{row.name}</strong>
                          <span className="mt-0.5 block text-xs font-medium leading-5 text-[var(--settings-muted)]">{row.detail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm font-bold text-[var(--settings-title)]">{row.owner}</td>
                    <td className="px-3 py-3"><StatusPill status={row.status} /></td>
                    <td className="px-3 py-3 text-xs font-medium text-[var(--settings-muted)]">{row.activity}</td>
                    <td className="px-3 py-3 text-right">
                      <Link href={row.href} className="inline-flex h-8 items-center rounded-md border border-[var(--settings-line)] px-2.5 text-xs font-extrabold text-[var(--settings-title)] no-underline hover:bg-[var(--settings-subtle)]">Oeffnen</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </SettingCard>

      <SettingCard title="Aktivitaet" description="Ruhiger Ueberblick ueber Status, Vorbereitung und naechste Verwaltungsschritte.">
        <div className="grid gap-2 md:grid-cols-3">
          {activity.map(([label, text, status]) => (
            <div key={label} className="rounded-lg border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-3">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-extrabold text-[var(--settings-title)]">{label}</strong>
                <StatusPill status={status} />
              </div>
              <p className="mt-2 text-xs font-medium leading-5 text-[var(--settings-muted)]">{text}</p>
            </div>
          ))}
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}

function DocumentsSettingsPage() {
  return (
    <ManagementPage
      title="Dokumente"
      description="Dokumenttypen, Vorlagen und Ablage zentral verwalten; Nummernkreise bleiben im eigenen Modul."
      rows={[
        { name: "Rechnungen", detail: "Dokumentfluss und PDF-Ausgabe", owner: "Operations", status: "Aktiv", activity: "Editor aktiv", href: "/dashboard-v2/invoices", icon: FileText },
        { name: "Angebote", detail: "Angebotsdokumente und Freigaben", owner: "Sales", status: "Aktiv", activity: "Angebotsbereich aktiv", href: "/dashboard-v2/offers", icon: FileText },
        { name: "Vorlagen", detail: "Dokumentvorlagen und Standardtexte", owner: "Admin", status: "Vorbereitet", activity: "Vorlagenstruktur vorbereitet", href: "/dashboard-v2/settings/documents?q=Vorlagen", icon: Archive },
        { name: "Ablage", detail: "Uploads und Dokumentenmanagement", owner: "Operations", status: "Teilweise aktiv", activity: "DMS-Bereich vorhanden", href: "/dashboard-v2/documents", icon: Archive }
      ]}
      activity={[
        ["Dokumentfluss", "Bestehende Dokumentrouten bleiben erreichbar.", "Aktiv"],
        ["Nummern", "Nummernkreise sind ausschliesslich im Modul Nummernkreise gebuendelt.", "Aktiv"],
        ["Vorlagen", "Vorlagen bleiben als vorbereiteter Bereich sichtbar.", "Vorbereitet"]
      ]}
    />
  )
}

function TimeTrackingSettingsPage() {
  return (
    <ManagementPage
      title="Zeiterfassung"
      description="Zeitbuchungen, Projektbezug und spaetere Uebergabe in Rechnungen verwalten."
      rows={[
        { name: "Zeitbuchungen", detail: "Erfasste Zeiten und Tagesuebersicht", owner: "Team", status: "Teilweise aktiv", activity: "Zeitbereich vorhanden", href: "/dashboard-v2/time", icon: Clock3 },
        { name: "Projektbezug", detail: "Zeiten Projekten und Kunden zuordnen", owner: "Projektleitung", status: "Vorbereitet", activity: "Projektbereich aktiv", href: "/dashboard-v2/projects", icon: Link2 },
        { name: "Freigaben", detail: "Review und spaetere Abrechnung", owner: "Operations", status: "Vorbereitet", activity: "Freigabe vorbereitet", href: "/dashboard-v2/settings/time-tracking?q=Freigaben", icon: Activity }
      ]}
      activity={[
        ["Erfassung", "Zeitfunktionen bleiben erreichbar.", "Teilweise aktiv"],
        ["Abrechnung", "Faktura-Uebergabe bleibt vorbereitet.", "Vorbereitet"],
        ["Routen", "Bestehende Zeitrouten werden nicht entfernt.", "Aktiv"]
      ]}
    />
  )
}

function BillingSettingsPage() {
  return (
    <ManagementPage
      title="Fakturierung"
      description="Fakturierung buendelt Prozessstatus und verweist auf eigenstaendige Fachmodule ohne Formular-Doppelungen."
      rows={[
        { name: "Rechnungsfluss", detail: "Rechnung erstellen, pruefen und versenden", owner: "Finance", status: "Aktiv", activity: "Rechnungseditor aktiv", href: "/dashboard-v2/invoices", icon: FileText },
        { name: "Zahlungsziele", detail: "Zahlungsbedingungen bleiben im Finanzmodul", owner: "Finance", status: "Teilweise aktiv", activity: "Finanzen verknuepft", href: "/dashboard-v2/settings/finance", icon: Link2 },
        { name: "Nummernkreise", detail: "Rechnungs- und Angebotsnummern separat verwalten", owner: "Admin", status: "Teilweise aktiv", activity: "Eigenes Modul", href: "/dashboard-v2/settings/number-ranges", icon: FileText },
        { name: "Mahnlogik", detail: "Erinnerungen und Mahnfolgen separat verwalten", owner: "Finance", status: "Teilweise aktiv", activity: "Reminder-Modul", href: "/dashboard-v2/settings/reminders", icon: Clock3 }
      ]}
      activity={[
        ["Prozess", "Fakturierung bleibt als eigener Prozessbereich sichtbar.", "Aktiv"],
        ["Keine Kopien", "Finanz-, Nummernkreis- und Reminder-Formulare werden nicht dupliziert.", "Aktiv"],
        ["Verweise", "Fachmodule bleiben ueber klare Links erreichbar.", "Teilweise aktiv"]
      ]}
    />
  )
}

function UsersRolesSettingsPage() {
  const [payload, setPayload] = useState<UsersRolesPayload | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadUsersAndRoles() {
      try {
        const response = await fetch("/api/settings/users", { cache: "no-store" })
        const result = await response.json().catch(() => null)

        if (!response.ok || !result?.ok) {
          setError(result?.error || "Benutzer und Rollen konnten nicht geladen werden.")
          return
        }

        setPayload({ users: result.users, limit: result.limit })
      } catch {
        setError("Benutzer und Rollen konnten nicht geladen werden.")
      }
    }

    loadUsersAndRoles()
  }, [])

  if (payload) {
    return <UsersAndPermissionsClient initialUsers={payload.users} initialLimit={payload.limit} />
  }

  return (
    <SettingsLayout
      title="Benutzer & Rollen"
      description="Team, Rechte, Rollen und Einladungen direkt im Settings-Bereich verwalten."
    >
      <SettingCard title={error ? "Zugriff nicht moeglich" : "Benutzer & Rollen werden geladen"} description={error || "Die echte Benutzer- und Lizenzstruktur wird aus der geschuetzten Settings-API geladen."}>
        <div className="grid gap-3 md:grid-cols-3">
          {["Benutzerliste", "Rollen", "Rechte"].map((item) => (
            <div key={item} className="rounded-lg border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-5">
              <div className="h-2 w-20 rounded-full bg-[var(--settings-line)]" />
              <div className="mt-4 h-9 rounded-lg bg-[var(--settings-surface)]" />
              <p className="mt-3 text-[11px] font-extrabold uppercase text-[var(--settings-muted)]">{item}</p>
            </div>
          ))}
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}

function SecuritySettingsPage() {
  return (
    <ManagementPage
      title="Sicherheit"
      description="Passwort, Zwei-Faktor-Schutz, Kontoschutz, aktive Sitzungen und Login-Sicherheit."
      rows={[
        { name: "Passwort", detail: "Passwortwechsel und Passwortschutz fuer das eigene Konto", owner: "Security", status: "Aktiv", activity: "Account-Security aktiv", href: "/dashboard-v2/account/security?q=Passwort", icon: KeyRound },
        { name: "2FA", detail: "Zwei-Faktor-Authentifizierung per Authenticator oder Backup-Code", owner: "Security", status: "Aktiv", activity: "2FA-API aktiv", href: "/dashboard-v2/account/security?q=2FA", icon: ShieldCheck },
        { name: "Kontoschutz", detail: "Schutzstatus, Profilabsicherung und Sicherheitsstatus", owner: "Security", status: "Aktiv", activity: "Kontoschutz aktiv", href: "/dashboard-v2/account/security?q=Kontoschutz", icon: LockKeyhole },
        { name: "Sitzungen", detail: "Session-Status und aktuelle Kontositzung pruefen", owner: "Security", status: "Aktiv", activity: "Session-Pruefung aktiv", href: "/dashboard-v2/account/security?q=Sitzungen", icon: Activity },
        { name: "Login-Sicherheit", detail: "Anmeldeschutz, blockierte Login-Versuche und 2FA-Pruefung", owner: "Security", status: "Teilweise aktiv", activity: "Login-Guard aktiv", href: "/dashboard-v2/account/security?q=Login-Sicherheit", icon: LockKeyhole }
      ]}
      filters={["Alle", "Aktiv", "Teilweise aktiv"]}
      activity={[
        ["Passwort", "Passwortfunktionen bleiben im Sicherheitsbereich gebuendelt.", "Aktiv"],
        ["2FA", "Zwei-Faktor-Funktionen sind dem Account-Schutz zugeordnet.", "Aktiv"],
        ["Login", "Login-Sicherheit bleibt separat von Audit Logs und Benutzerrollen.", "Teilweise aktiv"]
      ]}
    />
  )
}

function LicenseSettingsPage() {
  return (
    <ManagementPage
      title="Lizenzverwaltung"
      description="Lizenzstatus, Aktivierung, Benutzerlimit und interne Key-Verwaltung als eigene Kategorie."
      rows={[
        { name: "Lizenzstatus", detail: "Aktuellen Plan, Laufzeit und Status pruefen", owner: "Billing", status: "Aktiv", activity: "Lizenzseite aktiv", href: "/dashboard-v2/license", icon: KeyRound },
        { name: "Lizenz aktivieren", detail: "Lizenzschluessel eintragen oder Lizenzdatei laden", owner: "Billing", status: "Aktiv", activity: "Aktivierungs-API aktiv", href: "/dashboard-v2/license?q=Lizenz-Key", icon: ShieldCheck },
        { name: "Benutzerlimit", detail: "Planlimit und verfuegbare Benutzerplaetze kontrollieren", owner: "Billing", status: "Aktiv", activity: "Limit-Pruefung aktiv", href: "/dashboard-v2/license?q=Benutzerlimit", icon: Users2 },
        { name: "Key-Verwaltung", detail: "Interne Lizenz-Keys erzeugen, sofern der Admin-Modus aktiviert ist", owner: "Intern", status: "Vorbereitet", activity: "Admin-Route geschuetzt", href: "/dashboard-v2/license-admin", icon: LockKeyhole }
      ]}
      filters={["Alle", "Aktiv", "Vorbereitet"]}
      activity={[
        ["Aktivierung", "Lizenzaktivierung bleibt in der Lizenzverwaltung.", "Aktiv"],
        ["Limits", "Benutzerlimits sind aus Benutzer & Rollen ausgelagert.", "Aktiv"],
        ["Admin", "Key-Erzeugung bleibt intern geschuetzt erreichbar.", "Vorbereitet"]
      ]}
    />
  )
}

function ApiWebhooksSettingsPage() {
  return (
    <ManagementPage
      title="API & Webhooks"
      description="API-Schluessel, Webhook-Ziele und technische Freigaben als eigene moderne Verwaltungsseite."
      rows={[
        { name: "REST API", detail: "Mandantenfaehige API-Endpunkte und Versionierung", owner: "Dev", status: "Vorbereitet", activity: "v1-Routen vorhanden", href: "/dashboard-v2/settings/api?tab=keys", icon: KeyRound },
        { name: "Webhook Ziele", detail: "Ziel-URLs, Ereignisse und Auslieferungsstatus", owner: "Dev", status: "Vorbereitet", activity: "Ereignisse vorbereitet", href: "/dashboard-v2/settings/webhooks?tab=endpunkte", icon: Link2 },
        { name: "API Sicherheit", detail: "Tokens, Scopes und Zugriffskontrolle", owner: "Security", status: "Teilweise aktiv", activity: "Rechte-Modell vorhanden", href: "/dashboard-v2/settings/users", icon: LockKeyhole },
        { name: "Developer Status", detail: "Technische Aktivitaet und Erweiterungen", owner: "Platform", status: "Vorbereitet", activity: "Diagnose vorbereitet", href: "/dashboard-v2/settings/dev?tab=diagnose", icon: Activity }
      ]}
      activity={[
        ["Scopes", "Rechte werden ueber vorhandene Rollen- und Permission-Strukturen angebunden.", "Teilweise aktiv"],
        ["Webhook Queue", "Auslieferungsstatus ist als Verwaltungsbereich vorbereitet.", "Vorbereitet"],
        ["Dokumentation", "API- und Webhook-Hinweise bleiben in eindeutigen Technik-Bereichen erreichbar.", "Vorbereitet"]
      ]}
    />
  )
}

function DevSettingsPage() {
  return (
    <ManagementPage
      title="Dev"
      description="Entwickleroptionen, technische Diagnose, Feature Flags und Jobs ohne doppelte Add-on-Seite verwalten."
      rows={[
        { name: "Diagnose", detail: "Runtime, Healthchecks und technische Statuswerte", owner: "Platform", status: "Teilweise aktiv", activity: "Healthcheck aktiv", href: "/dashboard-v2/settings/logs-monitoring?tab=system", icon: Activity },
        { name: "Feature Flags", detail: "Vorbereitete technische Freigaben und Rollouts", owner: "Dev", status: "Vorbereitet", activity: "Settings-Modell vorbereitet", href: "/dashboard-v2/settings/dev?tab=flags", icon: Workflow },
        { name: "API Scopes", detail: "Technische Berechtigungen fuer API und Webhooks", owner: "Security", status: "Aktiv", activity: "Rechtemodell erweitert", href: "/dashboard-v2/settings/permissions?tab=scopes", icon: KeyRound },
        { name: "Jobs", detail: "Automationen, Queues und spaetere Worker-Ueberwachung", owner: "System", status: "Vorbereitet", activity: "Automation verknuepft", href: "/dashboard-v2/settings/automation?tab=zeitplaene", icon: Clock3 }
      ]}
      filters={["Alle", "Aktiv", "Teilweise aktiv", "Vorbereitet"]}
      activity={[
        ["Dubletten entfernt", "Der alte Add-ons-Ersatzbereich ist nicht mehr als eigenes Settings-Modul sichtbar.", "Aktiv"],
        ["Scopes", "API, Webhooks, Logs und Sicherheit sind als Admin-Rechte vorhanden.", "Aktiv"],
        ["Monitoring", "Technische Ereignisse laufen in Logs & Ueberwachung zusammen.", "Teilweise aktiv"]
      ]}
    />
  )
}

type LogCategory = "Aktivitaet" | "Login" | "Audit" | "API" | "Webhook" | "Fehler" | "Sicherheit" | "System"
type LogSeverity = "Info" | "Warnung" | "Kritisch"
type MonitoringLogRow = {
  id: string
  category: LogCategory
  severity: LogSeverity
  source: string
  event: string
  actor: string
  target: string
  ip: string
  createdAt: string
  details: string
}

const fallbackMonitoringLogs: MonitoringLogRow[] = [
  { id: "log-activity-1", category: "Aktivitaet", severity: "Info", source: "workspace", event: "Dokument finalisiert", actor: "System", target: "RE-2026-0104", ip: "-", createdAt: "2026-06-24T08:42:00.000Z", details: "Aktivitaetsprotokoll fuer Dokumentaktionen und Statuswechsel." },
  { id: "log-login-1", category: "Login", severity: "Info", source: "auth", event: "Anmeldung erfolgreich", actor: "admin", target: "Dashboard", ip: "192.168.20.25", createdAt: "2026-06-24T08:12:00.000Z", details: "Login-Historie fuer Benutzerkonto und aktive Sitzung." },
  { id: "log-audit-1", category: "Audit", severity: "Info", source: "audit", event: "user.update", actor: "Admin", target: "Benutzer", ip: "-", createdAt: "2026-06-23T16:30:00.000Z", details: "Audit-Log aus geschuetzten Settings-Aktionen." },
  { id: "log-api-1", category: "API", severity: "Warnung", source: "api", event: "Rate Limit vorbereitet", actor: "API Client", target: "/api/settings/users", ip: "-", createdAt: "2026-06-23T12:05:00.000Z", details: "API-Protokoll fuer technische Zugriffe und Token-Scopes." },
  { id: "log-webhook-1", category: "Webhook", severity: "Info", source: "webhooks", event: "Webhook Queue bereit", actor: "System", target: "invoice.finalized", ip: "-", createdAt: "2026-06-22T14:20:00.000Z", details: "Webhook-Protokoll fuer spaetere Zustellungen und Retry-Status." },
  { id: "log-error-1", category: "Fehler", severity: "Kritisch", source: "runtime", event: "Export fehlgeschlagen", actor: "System", target: "CSV Export", ip: "-", createdAt: "2026-06-21T09:18:00.000Z", details: "Fehlerprotokoll mit zentraler Detailansicht." },
  { id: "log-security-1", category: "Sicherheit", severity: "Warnung", source: "security", event: "2FA Backup-Code genutzt", actor: "Benutzer", target: "Konto", ip: "-", createdAt: "2026-06-20T17:50:00.000Z", details: "Sicherheitsereignis ohne Vermischung mit Profilformularen." },
  { id: "log-system-1", category: "System", severity: "Info", source: "system", event: "Healthcheck OK", actor: "System", target: "web-app", ip: "127.0.0.1", createdAt: "2026-06-20T06:00:00.000Z", details: "Systemereignisse und Ueberwachung zentral gebuendelt." }
]

function severityClass(severity: LogSeverity) {
  if (severity === "Kritisch") return "bg-red-50 text-red-700 ring-red-200"
  if (severity === "Warnung") return "bg-amber-50 text-amber-700 ring-amber-200"
  return "bg-emerald-50 text-emerald-700 ring-emerald-200"
}

function formatLogDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value))
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

function exportLogs(rows: MonitoringLogRow[]) {
  const header = ["Zeit", "Kategorie", "Schwere", "Quelle", "Ereignis", "Akteur", "Ziel", "IP", "Details"]
  const csv = [
    header.join(";"),
    ...rows.map((row) => [
      row.createdAt,
      row.category,
      row.severity,
      row.source,
      row.event,
      row.actor,
      row.target,
      row.ip,
      row.details
    ].map(csvCell).join(";"))
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = "logs-und-ueberwachung.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

function LogsMonitoringSettingsPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<"Alle" | LogCategory>("Alle")
  const [severity, setSeverity] = useState<"Alle" | LogSeverity>("Alle")
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(fallbackMonitoringLogs[0]?.id ?? "")
  const [apiRows, setApiRows] = useState<MonitoringLogRow[]>([])
  const pageSize = 5

  useEffect(() => {
    async function loadAuditRows() {
      try {
        const response = await fetch("/api/audit/events?limit=80", { cache: "no-store" })
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.ok || !Array.isArray(result.logs)) return

        setApiRows(result.logs.map((row: { id: string; action: string; entity: string; entityId?: string | null; reason?: string | null; ipAddress?: string | null; createdAt: string }) => ({
          id: row.id,
          category: row.action?.includes("login") ? "Login" : "Audit",
          severity: "Info",
          source: "audit",
          event: row.action,
          actor: "System",
          target: row.entityId || row.entity,
          ip: row.ipAddress || "-",
          createdAt: row.createdAt,
          details: row.reason || "Audit-Ereignis aus der bestehenden Audit-API."
        })))
      } catch {
        setApiRows([])
      }
    }

    loadAuditRows()
  }, [])

  const rows = useMemo(() => [...apiRows, ...fallbackMonitoringLogs], [apiRows])
  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows
      .filter((row) => category === "Alle" || row.category === category)
      .filter((row) => severity === "Alle" || row.severity === severity)
      .filter((row) => !needle || [row.category, row.severity, row.source, row.event, row.actor, row.target, row.ip, row.details].some((value) => value.toLowerCase().includes(needle)))
      .sort((a, b) => sortDirection === "desc"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }, [category, query, rows, severity, sortDirection])
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selectedRow = rows.find((row) => row.id === selectedId) ?? filteredRows[0] ?? rows[0]

  useEffect(() => {
    setPage(1)
  }, [category, query, severity, sortDirection])

  return (
    <SettingsLayout title="Logs & Ueberwachung" description="Aktivitaetsprotokoll, Login-Historie, Audit-Log, API, Webhooks, Fehler, Sicherheit und Systemereignisse zentral pruefen.">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Ereignisse", String(rows.length), SlidersHorizontal],
          ["Kritisch", String(rows.filter((row) => row.severity === "Kritisch").length), AlertTriangle],
          ["Audit", String(rows.filter((row) => row.category === "Audit").length), FileText],
          ["System", String(rows.filter((row) => row.category === "System").length), Activity]
        ].map(([label, value, Icon]) => {
          const StatIcon = Icon as SettingsIcon
          return (
            <div key={String(label)} className="rounded-lg border border-[var(--settings-line)] bg-[var(--settings-surface)] p-4 shadow-[var(--settings-card-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-extrabold uppercase text-[var(--settings-muted)]">{String(label)}</p>
                <StatIcon className="h-4 w-4 text-[var(--settings-accent)]" />
              </div>
              <strong className="mt-2 block text-2xl font-extrabold text-[var(--settings-title)]">{String(value)}</strong>
            </div>
          )
        })}
      </div>

      <SettingCard title="Protokolle" description="Suchen, filtern, sortieren, exportieren und Detailinformationen pruefen.">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_160px_150px_auto_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--settings-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Suche nach Ereignis, Akteur, Ziel oder Quelle"
              className="h-10 w-full rounded-lg border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] pl-9 pr-3 text-sm font-semibold text-[var(--settings-title)] outline-none focus:border-[var(--settings-accent)] focus:bg-[var(--settings-input-focus-bg)] focus:ring-2 focus:ring-[var(--settings-accent-soft)]"
            />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value as "Alle" | LogCategory)} className="h-10 rounded-lg border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-3 text-sm font-extrabold text-[var(--settings-title)] outline-none">
            {["Alle", "Aktivitaet", "Login", "Audit", "API", "Webhook", "Fehler", "Sicherheit", "System"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={severity} onChange={(event) => setSeverity(event.target.value as "Alle" | LogSeverity)} className="h-10 rounded-lg border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-3 text-sm font-extrabold text-[var(--settings-title)] outline-none">
            {["Alle", "Info", "Warnung", "Kritisch"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="button" onClick={() => setSortDirection((current) => current === "desc" ? "asc" : "desc")} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-3 text-xs font-extrabold text-[var(--settings-title)]">
            <SortAsc className="h-4 w-4" />
            {sortDirection === "desc" ? "Neueste" : "Aelteste"}
          </button>
          <button type="button" onClick={() => exportLogs(filteredRows)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--settings-accent-strong)] px-4 text-xs font-extrabold text-white shadow-[var(--settings-card-shadow)]">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-x-auto rounded-lg border border-[var(--settings-line)]">
            <table className="min-w-[850px] w-full border-collapse text-left">
              <thead className="bg-[var(--settings-subtle)] text-[11px] font-extrabold uppercase text-[var(--settings-muted)]">
                <tr>
                  <th className="px-3 py-2">Zeit</th>
                  <th className="px-3 py-2">Kategorie</th>
                  <th className="px-3 py-2">Ereignis</th>
                  <th className="px-3 py-2">Akteur</th>
                  <th className="px-3 py-2">Ziel</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--settings-line)]">
                {pagedRows.map((row) => (
                  <tr key={row.id} className="bg-[var(--settings-surface)]">
                    <td className="px-3 py-3 text-xs font-bold text-[var(--settings-muted)]">{formatLogDate(row.createdAt)}</td>
                    <td className="px-3 py-3 text-sm font-extrabold text-[var(--settings-title)]">{row.category}</td>
                    <td className="px-3 py-3 text-sm font-bold text-[var(--settings-title)]">{row.event}</td>
                    <td className="px-3 py-3 text-xs font-medium text-[var(--settings-muted)]">{row.actor}</td>
                    <td className="px-3 py-3 text-xs font-medium text-[var(--settings-muted)]">{row.target}</td>
                    <td className="px-3 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-extrabold ring-1 ${severityClass(row.severity)}`}>{row.severity}</span></td>
                    <td className="px-3 py-3 text-right">
                      <button type="button" onClick={() => setSelectedId(row.id)} className="inline-flex h-8 items-center gap-2 rounded-md border border-[var(--settings-line)] px-2.5 text-xs font-extrabold text-[var(--settings-title)] hover:bg-[var(--settings-subtle)]">
                        <Eye className="h-3.5 w-3.5" />
                        Oeffnen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedRow ? (
            <aside className="rounded-lg border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
              <p className="text-[11px] font-extrabold uppercase text-[var(--settings-muted)]">Detailansicht</p>
              <h3 className="mt-2 text-lg font-extrabold text-[var(--settings-title)]">{selectedRow.event}</h3>
              <div className="mt-3 grid gap-2 text-sm">
                {[
                  ["Kategorie", selectedRow.category],
                  ["Quelle", selectedRow.source],
                  ["Akteur", selectedRow.actor],
                  ["Ziel", selectedRow.target],
                  ["IP", selectedRow.ip],
                  ["Zeit", formatLogDate(selectedRow.createdAt)]
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 rounded-md bg-[var(--settings-surface)] px-3 py-2">
                    <span className="text-xs font-extrabold uppercase text-[var(--settings-muted)]">{label}</span>
                    <strong className="text-right text-xs font-extrabold text-[var(--settings-title)]">{value}</strong>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-md bg-[var(--settings-surface)] p-3 text-sm font-medium leading-6 text-[var(--settings-muted)]">{selectedRow.details}</p>
            </aside>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-bold text-[var(--settings-muted)]">{filteredRows.length} Treffer, Seite {currentPage} von {pageCount}</p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--settings-line)] px-3 text-xs font-extrabold text-[var(--settings-title)] disabled:cursor-not-allowed disabled:opacity-50">
              <ChevronLeft className="h-4 w-4" />
              Zurueck
            </button>
            <button type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--settings-line)] px-3 text-xs font-extrabold text-[var(--settings-title)] disabled:cursor-not-allowed disabled:opacity-50">
              Weiter
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}

function IntegrationsSettingsPage() {
  return (
    <ManagementPage
      title="Integrationen"
      description="Externe Dienste, Zahlungsanbieter und Datenuebergaben zentral verwalten."
      rows={[
        { name: "PayPal", detail: "Online-Zahlungen und Payment Links", owner: "Finance", status: "Vorbereitet", activity: "Payment-Bibliothek vorhanden", href: "/dashboard-v2/integrations?q=PayPal", icon: Plug },
        { name: "Stripe", detail: "Kartenzahlung und Zahlungsstatus", owner: "Finance", status: "Vorbereitet", activity: "Payment-Bereich vorbereitet", href: "/dashboard-v2/integrations?q=Stripe", icon: Plug },
        { name: "Open Banking", detail: "Bankkonten, Abgleich und finAPI", owner: "Finance", status: "Teilweise aktiv", activity: "Open-Banking-Routen vorhanden", href: "/dashboard-v2/finance/open-banking", icon: Link2 },
        { name: "DATEV", detail: "Buchhaltungsexport und Uebergabe", owner: "Accounting", status: "Vorbereitet", activity: "Report-Export vorbereitet", href: "/dashboard-v2/reports?q=DATEV", icon: Archive }
      ]}
      activity={[
        ["Zahlungen", "Payment-Module bleiben angebunden, ohne bestehende Routen zu entfernen.", "Vorbereitet"],
        ["Banking", "Open Banking ist als eigener Finanzbereich erreichbar.", "Teilweise aktiv"],
        ["Exporte", "DATEV bleibt im Report- und Archivkontext vorbereitet.", "Vorbereitet"]
      ]}
    />
  )
}

function ReportsSettingsPage() {
  return (
    <ManagementPage
      title="Berichte"
      description="Auswertungen, KPIs, Exporte und Berichtseinstellungen als produktive Verwaltungsseite."
      rows={[
        { name: "Umsatz & KPIs", detail: "Umsatz, offene Betraege und Monatsvergleich", owner: "Management", status: "Aktiv", activity: "Dashboard-Daten aktiv", href: "/dashboard-v2/reports", icon: BarChart3 },
        { name: "Finanzbericht", detail: "Einnahmen, Ausgaben und Cashflow", owner: "Finance", status: "Aktiv", activity: "Finanzdaten verfuegbar", href: "/dashboard-v2/reports?q=Finanzbericht", icon: FileText },
        { name: "Export Planung", detail: "CSV, PDF und DATEV-nahe Exporte", owner: "Accounting", status: "Vorbereitet", activity: "Export-UI vorbereitet", href: "/dashboard-v2/reports?q=Export", icon: Archive },
        { name: "Vergleich", detail: "Perioden- und Monatsvergleich", owner: "Management", status: "Teilweise aktiv", activity: "Report-Filter nutzbar", href: "/dashboard-v2/reports?q=Vergleich", icon: Activity }
      ]}
      activity={[
        ["KPI Uebersicht", "Vorhandene Reports bleiben direkt erreichbar.", "Aktiv"],
        ["Export", "Exportbereiche sind sichtbar und koennen spaeter erweitert werden.", "Vorbereitet"],
        ["Filter", "Die Detailseite bietet Suche und Statusfilter.", "Aktiv"]
      ]}
    />
  )
}

function ArchiveSettingsPage() {
  return (
    <ManagementPage
      title="Archiv"
      description="Dokumentenarchiv, Ablage, Exporte und Aufbewahrung als eigene Verwaltungsseite."
      rows={[
        { name: "Dokumentenablage", detail: "Rechnungen, Angebote und Uploads", owner: "Operations", status: "Teilweise aktiv", activity: "DMS-Bereich vorhanden", href: "/dashboard-v2/documents", icon: FileText },
        { name: "Kundenportal", detail: "Externe Freigaben und Portalablage", owner: "Portal", status: "Vorbereitet", activity: "Portal-Settings vorhanden", href: "/dashboard-v2/settings/portal", icon: Archive },
        { name: "Exportarchiv", detail: "Reports, CSV und steuernahe Ablage", owner: "Accounting", status: "Vorbereitet", activity: "Report-Export vorbereitet", href: "/dashboard-v2/reports?q=Archiv", icon: BarChart3 },
        { name: "Aufbewahrung", detail: "Archivregeln und Statusueberblick", owner: "Compliance", status: "Inaktiv", activity: "Regelwerk noch offen", href: "/dashboard-v2/settings/archive?q=Aufbewahrung", icon: Clock3 }
      ]}
      activity={[
        ["Ablage", "Vorhandene Dokumentfunktionen bleiben erreichbar.", "Teilweise aktiv"],
        ["Portal", "Portal-nahe Archivfunktionen sind vorbereitet.", "Vorbereitet"],
        ["Regeln", "Aufbewahrungsregeln sind als Status sichtbar.", "Inaktiv"]
      ]}
    />
  )
}

function AutomationSettingsPage() {
  return (
    <ManagementPage
      title="Automatisierung"
      description="Regeln, Trigger, Zeitplaene und Run-Verlauf zentral verwalten."
      rows={[
        { name: "Regeln", detail: "Wenn-Dann-Ablaeufe fuer Rechnungen und Mahnungen", owner: "Operations", status: "Vorbereitet", activity: "Automation-API vorhanden", href: "/dashboard-v2/automation?q=Regeln", icon: Workflow },
        { name: "Trigger", detail: "Ereignisse fuer Dokumente, Zahlungen und E-Mails", owner: "Operations", status: "Vorbereitet", activity: "Trigger-Modell vorbereitet", href: "/dashboard-v2/automation?q=Trigger", icon: Activity },
        { name: "Zeitplaene", detail: "Wiederkehrende Jobs und Erinnerungen", owner: "System", status: "Teilweise aktiv", activity: "Reminder-Settings aktiv", href: "/dashboard-v2/settings/reminders", icon: Clock3 },
        { name: "Run-Verlauf", detail: "Ausfuehrungen und Fehler nachvollziehen", owner: "Audit", status: "Vorbereitet", activity: "Monitoring verknuepft", href: "/dashboard-v2/settings/logs-monitoring?tab=aktivitaet", icon: FileText }
      ]}
      activity={[
        ["Regeln", "Regeluebersichten sind strukturiert angelegt.", "Vorbereitet"],
        ["Erinnerungen", "Bestehende Reminder-Logik bleibt direkt bearbeitbar.", "Teilweise aktiv"],
        ["Verlauf", "Run-Verlauf kann ueber Audit Logs nachvollzogen werden.", "Vorbereitet"]
      ]}
    />
  )
}

const premiumSettingsSectionComponents: Record<PremiumSettingsSection, ComponentType> = {
  company: CompanySettingsPage,
  finance: FinanceSettingsPage,
  documents: DocumentsSettingsPage,
  "time-tracking": TimeTrackingSettingsPage,
  billing: BillingSettingsPage,
  email: EmailSettingsPage,
  users: UsersRolesSettingsPage,
  security: SecuritySettingsPage,
  license: LicenseSettingsPage,
  integrations: IntegrationsSettingsPage,
  reports: ReportsSettingsPage,
  archive: ArchiveSettingsPage,
  system: SystemSettingsPage,
  automation: AutomationSettingsPage,
  dev: DevSettingsPage,
  "logs-monitoring": LogsMonitoringSettingsPage,
  legal: LegalSettingsPage,
  notifications: NotificationSettingsPage,
  reminders: RemindersSettingsPage,
  "number-ranges": NumberRangesSettingsPage,
  locations: CompanySettingsPage,
  tenants: CompanySettingsPage,
  branding: CompanySettingsPage,
  "payment-terms": FinanceSettingsPage,
  sessions: SecuritySettingsPage,
  permissions: UsersRolesSettingsPage,
  api: ApiWebhooksSettingsPage,
  webhooks: ApiWebhooksSettingsPage,
  templates: DocumentsSettingsPage,
  portal: PortalSettingsPage
}

export function PremiumSettingsSectionContent({ section }: { section: PremiumSettingsSection }) {
  const Component = premiumSettingsSectionComponents[section]
  return (
    <>
      <SettingsSectionNavigation activeKey={section} />
      <Component />
    </>
  )
}
