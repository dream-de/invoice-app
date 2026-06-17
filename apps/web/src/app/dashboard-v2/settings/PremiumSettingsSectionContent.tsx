"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import { Archive, BarChart3, ClipboardList, Clock3, FileDigit, FileText, LayoutTemplate, Link2, LockKeyhole, Mail, Plug, ReceiptText, Settings2, ShieldCheck, Tags, Users2, Workflow } from "lucide-react"
import CompanySettingsPage from "../../settings/company/page"
import EmailSettingsPage from "../../settings/email/page"
import FinanceSettingsPage from "../../settings/finance/page"
import LegalSettingsPage from "../../settings/legal/page"
import { UsersAndPermissionsClient } from "../../settings/users/UsersAndPermissionsClient"
import SystemSettingsPage from "../../settings/system/page"
import { Field, SettingCard, SoftInput } from "../../settings/_components/SettingsControls"
import { SettingsLayout } from "../../settings/_components/SettingsLayout"
import { type PremiumSettingsSection } from "./sectionMap"

function SettingsLinkGrid({
  title,
  description,
  items
}: {
  title: string
  description: string
  items: Array<{ href: string; title: string; body: string; icon: typeof Settings2 }>
}) {
  return (
    <SettingsLayout title={title} description={description}>
      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-[26px] border border-[var(--settings-line)] bg-[var(--settings-surface)] p-6 no-underline shadow-[var(--settings-card-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--settings-accent)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <strong className="block text-base font-extrabold text-[var(--settings-title)]">{item.title}</strong>
                  <p className="mt-2 text-sm font-medium leading-6 text-[var(--settings-muted)]">{item.body}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </SettingsLayout>
  )
}

type RangeType = "invoice" | "offer" | "customer"

type DocumentRange = {
  type: RangeType
  title: string
  prefix: string
  nextValue: string
  padding: number
}

const documentRangeDefaults: DocumentRange[] = [
  { type: "invoice", title: "Rechnungen", prefix: "RE-%Y-", nextValue: "104", padding: 3 },
  { type: "offer", title: "Angebote", prefix: "AN-%Y-", nextValue: "42", padding: 3 },
  { type: "customer", title: "Kunden", prefix: "KD-", nextValue: "4", padding: 4 }
]

function makeDocumentRangePreview(prefix: string, next: string, padding: number) {
  const year = "2026"
  const cleanNext = String(Number(next) || 1).padStart(padding, "0")

  return prefix.replace("%Y", year) + cleanNext
}

function DocumentsSettingsPage() {
  const [ranges, setRanges] = useState<DocumentRange[]>(documentRangeDefaults)
  const [status, setStatus] = useState("")

  useEffect(() => {
    async function loadRanges() {
      const response = await fetch("/api/settings/number-ranges", { cache: "no-store" })
      const result = await response.json()

      if (!result.ok || !Array.isArray(result.ranges)) return

      setRanges(
        documentRangeDefaults.map((item) => {
          const found = result.ranges.find((range: { type?: string }) => range.type === item.type)
          if (!found) return item

          return {
            ...item,
            prefix: String(found.prefix || item.prefix),
            nextValue: String(found.nextValue || item.nextValue),
            padding: Number(found.padding || item.padding)
          }
        })
      )
    }

    loadRanges()
  }, [])

  const previews = useMemo(
    () => ranges.map((range) => ({ ...range, preview: makeDocumentRangePreview(range.prefix, range.nextValue, range.padding) })),
    [ranges]
  )

  function updateRange(type: RangeType, patch: Partial<DocumentRange>) {
    setRanges((items) => items.map((item) => item.type === type ? { ...item, ...patch } : item))
  }

  async function save() {
    setStatus("Speichere Dokumenteinstellungen ...")

    const response = await fetch("/api/settings/number-ranges", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ranges: ranges.map((range) => ({
          type: range.type,
          prefix: range.prefix,
          nextValue: Number(range.nextValue) || 1,
          padding: range.padding
        }))
      })
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      setStatus(result.error || "Dokumenteinstellungen konnten nicht gespeichert werden.")
      return
    }

    setStatus("Dokumenteinstellungen gespeichert.")
  }

  return (
    <SettingsLayout
      title="Dokumente"
      description="Rechnungen, Angebote, Nummernkreise, Vorlagen und gespeicherte Dokumente zentral verwalten."
      action={save}
      status={status}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SettingCard title="Dokumentenzentrale" description="Schneller Zugriff auf produktive Rechnungs- und Angebotsbereiche im Premium-Workspace.">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/dashboard-v2/invoices/new", title: "Neue Rechnung", body: "Rechnung im modernen Editor erstellen.", icon: ReceiptText, badge: "Editor" },
              { href: "/dashboard-v2/invoices", title: "Rechnungen", body: "Gespeicherte Rechnungen pruefen und weiterverarbeiten.", icon: FileText, badge: "Live" },
              { href: "/dashboard-v2/offers", title: "Angebote", body: "Angebote, Status und Umwandlung vorbereiten.", icon: Tags, badge: "Live" },
              { href: "/dashboard-v2/settings/archive", title: "Archiv", body: "Ablage, Export und Dokumentenarchiv oeffnen.", icon: Archive, badge: "Modul" }
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4 no-underline transition hover:-translate-y-0.5 hover:bg-[var(--settings-surface)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--settings-muted)]">{item.badge}</span>
                  </div>
                  <strong className="mt-4 block text-sm font-extrabold text-[var(--settings-title)]">{item.title}</strong>
                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--settings-muted)]">{item.body}</p>
                </Link>
              )
            })}
          </div>
        </SettingCard>

        <SettingCard title="Vorlagen & Standards" description="Dokumentvorlagen bleiben vorbereitet und klar markiert, ohne Scheinfunktionen.">
          <div className="space-y-3">
            {[
              { icon: LayoutTemplate, title: "Rechnungsvorlage", detail: "Standardlayout fuer neue Rechnungen", state: "Aktiv" },
              { icon: LayoutTemplate, title: "Angebotsvorlage", detail: "Vorlage fuer Angebote und Pipeline-Dokumente", state: "Aktiv" },
              { icon: ClipboardList, title: "Standardtexte", detail: "Einleitung, Zahlungsbedingungen und Fusszeilen", state: "Vorbereitet" }
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold text-[var(--settings-title)]">{item.title}</p>
                      <p className="text-xs font-medium text-[var(--settings-muted)]">{item.detail}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[11px] font-extrabold text-emerald-700">{item.state}</span>
                </div>
              )
            })}
          </div>
        </SettingCard>
      </div>

      <SettingCard title="Nummernkreise" description="Rechnungs-, Angebots- und Kundennummern direkt in der Dokumente-Kategorie bearbeiten.">
        <div className="grid gap-4 xl:grid-cols-3">
          {previews.map((range) => (
            <section key={range.type} className="rounded-[24px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                    <FileDigit className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[var(--settings-title)]">{range.title}</h3>
                    <p className="mt-1 text-xs font-bold text-[var(--settings-muted)]">Vorschau: {range.preview}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Field label="Praefix Format">
                  <SoftInput value={range.prefix} onChange={(event) => updateRange(range.type, { prefix: event.target.value })} />
                </Field>
                <Field label="Naechste Nummer">
                  <SoftInput value={range.nextValue} onChange={(event) => updateRange(range.type, { nextValue: event.target.value })} />
                </Field>
                <div className="rounded-[18px] border border-[var(--settings-line)] bg-[var(--settings-surface)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[var(--settings-label)]">Stellen</span>
                    <span className="rounded-full bg-[var(--settings-subtle)] px-3 py-1 text-xs font-extrabold text-[var(--settings-title)]">{range.padding}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={range.padding}
                    onChange={(event) => updateRange(range.type, { padding: Number(event.target.value) })}
                    className="w-full accent-[var(--settings-accent)]"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}

const timePreparationFlags = [
  { key: "TIME_TRACKING", module: "Zeiterfassung", title: "Zeiterfassung", detail: "Grundstruktur fuer spaetere Zeiteintraege; kein Timer aktiv." },
  { key: "PROJECT_CAPACITY", module: "Zeiterfassung", title: "Projektkapazitaet", detail: "Vorbereitung fuer geplante Projektstunden und Kapazitaet." },
  { key: "TIME_BILLING", module: "Fakturierung", title: "Zeitbasierte Fakturierung", detail: "Vorbereitung fuer die Verknuepfung von Stunden mit Rechnungen." },
  { key: "AUTO_INVOICE_FROM_TIME", module: "Fakturierung", title: "Automatische Zeitrechnung", detail: "Deaktivierte Vorbereitung; keine automatische Fakturierung." }
] as const

function FeatureFlagPreparationList({ module }: { module: "Zeiterfassung" | "Fakturierung" }) {
  return (
    <div className="grid gap-3">
      {timePreparationFlags.filter((flag) => flag.module === module).map((flag) => (
        <div key={flag.key} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-[var(--settings-title)]">{flag.title}</p>
              <p className="mt-1 text-xs font-mono font-bold text-[var(--settings-muted)]">{flag.key}</p>
            </div>
            <span className="rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]">Deaktiviert</span>
          </div>
          <p className="mt-3 text-xs font-medium leading-5 text-[var(--settings-muted)]">{flag.detail}</p>
        </div>
      ))}
    </div>
  )
}

function TimeTrackingSettingsPage() {
  return (
    <SettingsLayout title="Zeiterfassung" description="Vorbereitung fuer spaetere Zeiterfassung mit Projektbezug. Es ist kein Timer und keine aktive Erfassung eingeschaltet.">
      <div className="grid gap-6 xl:grid-cols-2">
        <SettingCard title="Modulstatus" description="Das Modul bleibt vorbereitet und standardmaessig deaktiviert.">
          <div className="flex items-start gap-4 rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
              <Clock3 className="h-5 w-5" />
            </span>
            <div>
              <strong className="block text-sm font-extrabold text-[var(--settings-title)]">Zeiterfassung vorbereitet</strong>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--settings-muted)]">Kunde, Projekt, Artikel und Stunden koennen spaeter verbunden werden. In dieser Phase wird keine echte Zeiterfassung gestartet.</p>
            </div>
          </div>
        </SettingCard>
        <SettingCard title="Feature Flags" description="Alle Zeiterfassungsflags bleiben deaktiviert.">
          <FeatureFlagPreparationList module="Zeiterfassung" />
        </SettingCard>
      </div>
    </SettingsLayout>
  )
}

function BillingSettingsPage() {
  return (
    <SettingsLayout title="Fakturierung" description="Vorbereitung fuer die spaetere direkte Rechnungsanbindung aus Zeitdaten. Es wird keine automatische Fakturierung aktiviert.">
      <div className="grid gap-6 xl:grid-cols-2">
        <SettingCard title="Rechnungsanbindung" description="Der Zielpfad ist vorbereitet, aber nicht automatisiert.">
          <div className="space-y-3">
            {["Kunde", "Projekt", "Artikel", "Stunden", "Rechnung"].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-[18px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-xs font-extrabold text-[var(--settings-accent)]">{index + 1}</span>
                <strong className="text-sm font-extrabold text-[var(--settings-title)]">{step}</strong>
                {index < 4 ? <Link2 className="ml-auto h-4 w-4 text-[var(--settings-muted)]" /> : <span className="ml-auto rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]">Ziel</span>}
              </div>
            ))}
          </div>
        </SettingCard>
        <SettingCard title="Feature Flags" description="Alle Fakturierungsflags bleiben deaktiviert.">
          <FeatureFlagPreparationList module="Fakturierung" />
        </SettingCard>
      </div>
    </SettingsLayout>
  )
}

function CommunicationSettingsPage() {
  return <EmailSettingsPage />
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
      description="Team, Rechte, Rollen und Einladungen im modernen Settings-Bereich verwalten."
    >
      <SettingCard title={error ? "Zugriff nicht moeglich" : "Benutzer & Rollen werden geladen"} description={error || "Die echte Benutzer- und Lizenzstruktur wird aus der geschuetzten Settings-API geladen."}>
        <div className="grid gap-3 md:grid-cols-3">
          {["Benutzerliste", "Rollen", "Rechte-Toggles"].map((item) => (
            <div key={item} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-5">
              <div className="h-3 w-24 rounded-full bg-[var(--settings-line)]" />
              <div className="mt-4 h-10 rounded-2xl bg-[var(--settings-surface)]" />
              <p className="mt-3 text-xs font-extrabold uppercase tracking-widest text-[var(--settings-muted)]">{item}</p>
            </div>
          ))}
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}

function SecuritySettingsPage() {
  const securityAreas = [
    { title: "Konto & Sicherheit", detail: "Profil, Passwort, 2FA, aktive Sitzung und Aktivitaetsprotokoll verwalten.", href: "/dashboard-v2/account/security", icon: ShieldCheck, status: "Aktiv" },
    { title: "Audit & Zugriff", detail: "Sicherheitsereignisse, Login-Aktivitaeten und Exporte pruefen.", href: "/dashboard-v2/audit", icon: FileText, status: "Aktiv" },
    { title: "Systemschutz & Backup", detail: "Backups, Wiederherstellung und technische Systemoptionen oeffnen.", href: "/dashboard-v2/settings/system", icon: LockKeyhole, status: "Vorbereitet" },
    { title: "Rechte & Rollen", detail: "Benutzerrechte und Rollen im gruenen Toggle-System verwalten.", href: "/dashboard-v2/settings/users-roles", icon: Users2, status: "Aktiv" }
  ]

  const securityStatus = [
    ["Account Security", "Passwort, 2FA und aktive Sitzung stehen bereit.", "Aktiv"],
    ["Audit Events", "Sicherheitsereignisse und Login-Aktivitaeten sind einsehbar.", "Aktiv"],
    ["Rollen & Rechte", "Benutzerrechte und Rollen koennen verwaltet werden.", "Aktiv"],
    ["Backup", "Backup-Optionen sind im Systembereich erreichbar.", "Vorbereitet"]
  ]

  return (
    <SettingsLayout title="Sicherheit" description="Audit, Zugriff, Kontoschutz und Rollensteuerung in einem modernen Sicherheitsbereich.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SettingCard title="Sicherheitszentrale" description="Alle wichtigen Schutzbereiche sind an einem Ort gebuendelt.">
          <div className="grid gap-3 md:grid-cols-2">
            {securityAreas.map((area) => {
              const Icon = area.icon
              const isActive = area.status === "Aktiv"

              return (
                <Link key={area.title} href={area.href} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4 no-underline transition hover:-translate-y-0.5 hover:bg-[var(--settings-surface)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={isActive ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700" : "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--settings-muted)]"}>
                      {area.status}
                    </span>
                  </div>
                  <strong className="mt-4 block text-sm font-extrabold text-[var(--settings-title)]">{area.title}</strong>
                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--settings-muted)]">{area.detail}</p>
                </Link>
              )
            })}
          </div>
        </SettingCard>

        <SettingCard title="Schutzstatus" description="Schneller Ueberblick ueber verfuegbare Sicherheitsbereiche.">
          <div className="space-y-3">
            {securityStatus.map(([title, detail, status]) => {
              const isActive = status === "Aktiv"

              return (
                <div key={title} className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--settings-title)]">{title}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--settings-muted)]">{detail}</p>
                  </div>
                  <span className={isActive ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[11px] font-extrabold text-emerald-700" : "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]"}>
                    {status}
                  </span>
                </div>
              )
            })}
          </div>
        </SettingCard>
      </div>

    </SettingsLayout>
  )
}

function IntegrationsSettingsPage() {
  const providers = [
    { name: "API & Webhooks", detail: "Schnittstellen und Webhooks verwalten", href: "/dashboard-v2/api", icon: Plug, status: "Vorbereitet" },
    { name: "PayPal", detail: "PayPal als moegliche Zahlungsanbindung", href: "/dashboard-v2/integrations?q=PayPal", icon: Plug, status: "Vorbereitet" },
    { name: "Stripe", detail: "Stripe als moegliche Zahlungsanbindung", href: "/dashboard-v2/integrations?q=Stripe", icon: Plug, status: "Vorbereitet" },
    { name: "Open Banking", detail: "Bankanbindungen und Kontodienste vorbereiten", href: "/dashboard-v2/integrations?q=Open%20Banking", icon: Plug, status: "Optional" },
    { name: "DATEV", detail: "Buchhaltungsexport und Uebergabe", href: "/dashboard-v2/integrations?q=DATEV", icon: Archive, status: "Vorbereitet" },
    { name: "Automatisierung", detail: "Verknuepfungen mit externen Diensten", href: "/dashboard-v2/automation", icon: Workflow, status: "Vorbereitet" }
  ]

  return (
    <SettingsLayout title="Integrationen" description="API, Webhooks und externe Dienste zentral organisieren.">
      <div className="grid gap-6">
        <SettingCard title="Integrationskatalog" description="Verfuegbare und vorbereitete Anbindungen im Ueberblick.">
          <div className="grid gap-3 md:grid-cols-2">
            {providers.map((provider) => {
              const Icon = provider.icon
              const isPrepared = provider.status.includes("Vorbereitet")

              return (
                <Link key={provider.name} href={provider.href} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4 no-underline transition hover:-translate-y-0.5 hover:bg-[var(--settings-surface)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                      <span className={isPrepared ? "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--settings-muted)]" : "rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-700"}>
                        {provider.status}
                      </span>
                  </div>
                  <strong className="mt-4 block text-sm font-extrabold text-[var(--settings-title)]">{provider.name}</strong>
                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--settings-muted)]">{provider.detail}</p>
                </Link>
              )
            })}
          </div>
        </SettingCard>
      </div>
    </SettingsLayout>
  )
}

function ReportsSettingsPage() {
  const reportAreas = [
    { title: "Umsatz & KPIs", detail: "Umsatz, offene Betraege, Zahlungen und Monatsvergleich", href: "/dashboard-v2/reports", icon: BarChart3, status: "Aktiv" },
    { title: "Finanzbericht", detail: "Einnahmen, Ausgaben und Cashflow im Premium-Workspace", href: "/dashboard-v2/reports?q=Finanzbericht%20erstellt", icon: FileText, status: "Aktiv" },
    { title: "DATEV Export", detail: "Buchhaltungsdaten als vorbereiteter Exportbereich", href: "/dashboard-v2/reports?q=DATEV%20vorbereitet", icon: Archive, status: "Vorbereitet" },
    { title: "Vergleich", detail: "Monats- und Periodenvergleich fuer interne Auswertung", href: "/dashboard-v2/reports?q=Vergleich%20geoeffnet", icon: BarChart3, status: "Aktiv" }
  ]

  const reportSettings = [
    ["Standardansicht", "Dashboard- und Reports-Daten bleiben im Premium-Bereich gebuendelt.", "Aktiv"],
    ["Export", "Exportfunktionen stehen je nach Bereich bereit.", "Teilweise aktiv"],
    ["Planung", "Berichtsplanung kann spaeter erweitert werden.", "Vorbereitet"]
  ]

  return (
    <SettingsLayout title="Berichte" description="Auswertungen, Umsatz, KPIs und Berichtseinstellungen modern strukturieren.">
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <SettingCard title="Report-Zentrale" description="Schneller Einstieg in bestehende Berichte und Exporte ohne Wechsel in alte Settings-Ansichten.">
          <div className="grid gap-3 md:grid-cols-2">
            {reportAreas.map((area) => {
              const Icon = area.icon
              const isActive = area.status === "Aktiv"

              return (
                <Link key={area.title} href={area.href} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4 no-underline transition hover:-translate-y-0.5 hover:bg-[var(--settings-surface)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={isActive ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700" : "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--settings-muted)]"}>
                      {area.status}
                    </span>
                  </div>
                  <strong className="mt-4 block text-sm font-extrabold text-[var(--settings-title)]">{area.title}</strong>
                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--settings-muted)]">{area.detail}</p>
                </Link>
              )
            })}
          </div>
        </SettingCard>

        <SettingCard title="Berichtsstatus" description="Ueberblick ueber verfuegbare Berichtsbereiche und Exporte.">
          <div className="space-y-3">
            {reportSettings.map(([title, detail, status]) => {
              const isActive = status === "Aktiv"
              const isPartial = status === "Teilweise aktiv"

              return (
                <div key={title} className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--settings-title)]">{title}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--settings-muted)]">{detail}</p>
                  </div>
                  <span className={isActive ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[11px] font-extrabold text-emerald-700" : isPartial ? "rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-700" : "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]"}>
                    {status}
                  </span>
                </div>
              )
            })}
          </div>
        </SettingCard>
      </div>

    </SettingsLayout>
  )
}

function ArchiveSettingsPage() {
  const archiveAreas = [
    { title: "Dokumentenarchiv", detail: "Gespeicherte Rechnungen, Angebote und Dokumente strukturiert oeffnen.", href: "/dashboard-v2/settings/documents", icon: FileText, status: "Aktiv" },
    { title: "Archiv & Ablage", detail: "Paperless, Nextcloud und Portal-Ablage als vorbereitete Konfiguration.", href: "/dashboard-v2/settings/portal", icon: Archive, status: "Vorbereitet" },
    { title: "Export", detail: "Archiv- und Dokumentexport nur dort, wo vorhandene Exportlogik existiert.", href: "/dashboard-v2/reports?q=Archiv%20Export%20vorbereitet", icon: Archive, status: "Teilweise aktiv" },
    { title: "Kundenportal", detail: "Angebotsportal und Archivzugriff bleiben vorbereitet, nicht produktiv verbunden.", href: "/dashboard-v2/settings/portal?focus=portal", icon: Plug, status: "Vorbereitet" }
  ]

  const archiveStatus = [
    ["Rechnungen", "Dokumente bleiben ueber den bestehenden Rechnungsbereich erreichbar.", "Aktiv"],
    ["Angebote", "Angebote werden ueber die Dokumente-Kategorie verknuepft.", "Aktiv"],
    ["Externe Ablage", "Paperless/Nextcloud sind vorbereitet, aber nicht live synchronisiert.", "Vorbereitet"],
    ["Archiv-Export", "Exportaktionen bleiben klar als vorbereitet oder vorhanden markiert.", "Teilweise aktiv"]
  ]

  return (
    <SettingsLayout title="Archiv" description="Dokumentenarchiv, Export und Ablage zentral organisieren.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SettingCard title="Archivzentrale" description="Zugriff auf Dokumente, Ablage und vorbereitete Portalbereiche im Premium-Workspace.">
          <div className="grid gap-3 md:grid-cols-2">
            {archiveAreas.map((area) => {
              const Icon = area.icon
              const isActive = area.status === "Aktiv"
              const isPartial = area.status === "Teilweise aktiv"

              return (
                <Link key={area.title} href={area.href} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4 no-underline transition hover:-translate-y-0.5 hover:bg-[var(--settings-surface)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={isActive ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-700" : isPartial ? "rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber-700" : "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--settings-muted)]"}>
                      {area.status}
                    </span>
                  </div>
                  <strong className="mt-4 block text-sm font-extrabold text-[var(--settings-title)]">{area.title}</strong>
                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--settings-muted)]">{area.detail}</p>
                </Link>
              )
            })}
          </div>
        </SettingCard>

        <SettingCard title="Archivstatus" description="Ueberblick ueber verfuegbare Ablage- und Exportbereiche.">
          <div className="space-y-3">
            {archiveStatus.map(([title, detail, status]) => {
              const isActive = status === "Aktiv"
              const isPartial = status === "Teilweise aktiv"

              return (
                <div key={title} className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--settings-title)]">{title}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--settings-muted)]">{detail}</p>
                  </div>
                  <span className={isActive ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[11px] font-extrabold text-emerald-700" : isPartial ? "rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-700" : "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]"}>
                    {status}
                  </span>
                </div>
              )
            })}
          </div>
        </SettingCard>
      </div>

    </SettingsLayout>
  )
}

function AutomationSettingsPage() {
  const automationAreas = [
    { title: "Regeln", detail: "Regeluebersicht und vorbereitete Bedingungen im Premium-Workspace pruefen.", href: "/dashboard-v2/automation?q=Regeln", icon: Workflow, status: "Vorbereitet" },
    { title: "Trigger", detail: "Ausloeser fuer Mahnungen, Reports und Dokumentereignisse spaeter anbinden.", href: "/dashboard-v2/automation?q=Trigger", icon: Workflow, status: "Vorbereitet" },
    { title: "Geplante Ablaeufe", detail: "Zeitplaene und wiederkehrende Jobs nur als Konzept markieren.", href: "/dashboard-v2/automation?q=Geplant", icon: Settings2, status: "Vorbereitet" },
    { title: "Run-Verlauf", detail: "Ausfuehrungen spaeter ueber Audit/Workflow-Logs nachvollziehen.", href: "/dashboard-v2/audit?q=Workflow", icon: FileText, status: "Vorbereitet" }
  ]

  return (
    <SettingsLayout title="Automatisierung" description="Regeln, Trigger und geplante Ablaeufe zentral organisieren.">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SettingCard title="Automatisierungszentrale" description="Ueberblick ueber Regeln, Trigger und geplante Ablaeufe.">
          <div className="grid gap-3 md:grid-cols-2">
            {automationAreas.map((area) => {
              const Icon = area.icon

              return (
                <Link key={area.title} href={area.href} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4 no-underline transition hover:-translate-y-0.5 hover:bg-[var(--settings-surface)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--settings-muted)]">
                      {area.status}
                    </span>
                  </div>
                  <strong className="mt-4 block text-sm font-extrabold text-[var(--settings-title)]">{area.title}</strong>
                  <p className="mt-1 text-xs font-medium leading-5 text-[var(--settings-muted)]">{area.detail}</p>
                </Link>
              )
            })}
          </div>
        </SettingCard>

      </div>
    </SettingsLayout>
  )
}

const premiumSettingsSectionComponents: Record<PremiumSettingsSection, ComponentType> = {
  company: CompanySettingsPage,
  finance: FinanceSettingsPage,
  documents: DocumentsSettingsPage,
  "time-tracking": TimeTrackingSettingsPage,
  billing: BillingSettingsPage,
  communication: CommunicationSettingsPage,
  "users-roles": UsersRolesSettingsPage,
  security: SecuritySettingsPage
}

export function PremiumSettingsSectionContent({ section }: { section: PremiumSettingsSection }) {
  const Component = premiumSettingsSectionComponents[section]
  return <Component />
}
