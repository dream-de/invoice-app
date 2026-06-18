"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  Archive,
  BarChart3,
  Clock3,
  FileText,
  Filter,
  KeyRound,
  Link2,
  LockKeyhole,
  Plug,
  ShieldCheck,
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
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase text-slate-400">Modul</p>
          <h2 className="text-lg font-black text-slate-950">{activeModule?.title ?? activeKey}</h2>
        </div>
        <Link href="/dashboard-v2/settings" className="inline-flex h-8 items-center rounded-md border border-slate-200 px-2.5 text-[11px] font-black text-slate-600 no-underline hover:bg-slate-50">Alle Module</Link>
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label={`Unterpunkte im Modul ${activeModule?.title ?? activeKey}`}>
        {subpoints.map((item) => (
          <Link
            key={item.key}
            href={hrefFor(item.key)}
            className={`inline-flex min-h-8 items-center rounded-md border px-2 text-[11px] font-black no-underline transition ${item.key === activeTab ? "border-violet-300 bg-violet-50 text-violet-800 shadow-sm" : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"}`}
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
        { name: "REST API", detail: "Mandantenfaehige API-Endpunkte und Versionierung", owner: "Dev", status: "Vorbereitet", activity: "v1-Routen vorhanden", href: "/dashboard-v2/settings/add-ons?q=REST%20API", icon: KeyRound },
        { name: "Webhook Ziele", detail: "Ziel-URLs, Ereignisse und Auslieferungsstatus", owner: "Dev", status: "Vorbereitet", activity: "Ereignisse vorbereitet", href: "/dashboard-v2/settings/add-ons?q=Webhooks", icon: Link2 },
        { name: "API Sicherheit", detail: "Tokens, Scopes und Zugriffskontrolle", owner: "Security", status: "Teilweise aktiv", activity: "Rechte-Modell vorhanden", href: "/dashboard-v2/settings/users", icon: LockKeyhole },
        { name: "Developer Status", detail: "Technische Aktivitaet und Erweiterungen", owner: "Platform", status: "Vorbereitet", activity: "Add-on-Katalog aktiv", href: "/dashboard-v2/settings/add-ons?q=Dev", icon: Activity }
      ]}
      activity={[
        ["Scopes", "Rechte werden ueber vorhandene Rollen- und Permission-Strukturen angebunden.", "Teilweise aktiv"],
        ["Webhook Queue", "Auslieferungsstatus ist als Verwaltungsbereich vorbereitet.", "Vorbereitet"],
        ["Dokumentation", "API- und Webhook-Hinweise bleiben als Add-on-Kontext erreichbar.", "Vorbereitet"]
      ]}
    />
  )
}

function AuditLogsSettingsPage() {
  return (
    <ManagementPage
      title="Audit Logs"
      description="Sicherheitsereignisse, Zugriff und Systemaktivitaeten durchsuchen, filtern und pruefen."
      rows={[
        { name: "Login Ereignisse", detail: "Erfolgreiche und blockierte Anmeldungen", owner: "Security", status: "Aktiv", activity: "IP-Metadaten vorbereitet", href: "/dashboard-v2/audit?q=Login", icon: ShieldCheck },
        { name: "Datenzugriff", detail: "Aenderungen an Rechnungen, Kunden und Projekten", owner: "Audit", status: "Teilweise aktiv", activity: "Audit Helper vorhanden", href: "/dashboard-v2/audit?q=Datenzugriff", icon: FileText },
        { name: "Export Verlauf", detail: "CSV, PDF und Report-Aktivitaeten", owner: "Operations", status: "Vorbereitet", activity: "Exportbereiche sichtbar", href: "/dashboard-v2/reports?q=Export", icon: Archive },
        { name: "Audit Trail", detail: "Nachvollziehbare Ereignisse und Systemaktivitaeten", owner: "Audit", status: "Teilweise aktiv", activity: "Audit-Ansicht aktiv", href: "/dashboard-v2/audit?q=Audit%20Trail", icon: Activity }
      ]}
      filters={["Alle", "Aktiv", "Teilweise aktiv", "Vorbereitet"]}
      activity={[
        ["Sichtung", "Audit-Ereignisse bleiben im bestehenden Audit-Bereich erreichbar.", "Aktiv"],
        ["Filter", "Status- und Suchfilter sind direkt in dieser Detailseite nutzbar.", "Aktiv"],
        ["Export", "Archiv- und Report-Exports bleiben vorbereitet.", "Vorbereitet"]
      ]}
    />
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
        { name: "Run-Verlauf", detail: "Ausfuehrungen und Fehler nachvollziehen", owner: "Audit", status: "Vorbereitet", activity: "Audit-Verknuepfung vorbereitet", href: "/dashboard-v2/settings/audit-logs?q=Workflow", icon: FileText }
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
  "audit-logs": AuditLogsSettingsPage,
  license: LicenseSettingsPage,
  integrations: IntegrationsSettingsPage,
  reports: ReportsSettingsPage,
  archive: ArchiveSettingsPage,
  system: SystemSettingsPage,
  automation: AutomationSettingsPage,
  legal: LegalSettingsPage,
  notifications: NotificationSettingsPage,
  reminders: RemindersSettingsPage,
  "number-ranges": NumberRangesSettingsPage,
  "add-ons": ApiWebhooksSettingsPage,
  locations: CompanySettingsPage,
  tenants: CompanySettingsPage,
  branding: CompanySettingsPage,
  "payment-terms": FinanceSettingsPage,
  sessions: SecuritySettingsPage,
  permissions: UsersRolesSettingsPage,
  api: ApiWebhooksSettingsPage,
  webhooks: ApiWebhooksSettingsPage,
  audit: AuditLogsSettingsPage,
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
