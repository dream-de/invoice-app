import Link from "next/link"
import { getLicenseSettingsSummary } from "@/lib/license/settings"
import { formatPlanUsers, licensePlans } from "@/lib/license/plans"
import { LicenseActivationForm } from "./LicenseActivationForm"

export const dynamic = "force-dynamic"

const licenseSteps = [
  "Kunde kauft Monats- oder Jahreslizenz.",
  "Du erzeugst privat einen signierten Lizenzschluessel.",
  "Admin traegt den Lizenzschluessel hier ein.",
  "App prueft Ablaufdatum, Plan und Benutzerlimit serverseitig."
]

const permissionGroups = [
  {
    title: "Rechnungen",
    description: "Erstellen, bearbeiten, loeschen, finalisieren und PDF oeffnen.",
    items: ["Ansehen", "Erstellen", "Bearbeiten", "Loeschen", "Finalisieren", "PDF"]
  },
  {
    title: "Kunden & Projekte",
    description: "Kundendaten und Projektbereiche verwalten.",
    items: ["Kunden ansehen", "Kunden bearbeiten", "Projekte ansehen", "Projekte bearbeiten"]
  },
  {
    title: "Artikel & Finanzen",
    description: "Produkte, Leistungen und Finanzbereiche freigeben.",
    items: ["Artikel ansehen", "Artikel bearbeiten", "Finanzen ansehen"]
  },
  {
    title: "Administration",
    description: "Einstellungen, Templates und Systemfunktionen bleiben Admin-Bereich.",
    items: ["Einstellungen", "Templates", "System", "Benutzerrechte"]
  }
]

export default async function UsersAndPermissionsPage() {
  const licenseSummary = await getLicenseSettingsSummary()

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-6 py-8 text-[#1d2433]">
      <div className="mx-auto max-w-6xl">
        <Link href="/settings/categories" className="mb-6 inline-flex text-sm font-medium text-[#64748b] no-underline hover:text-[#111827]">
          Zurueck zu Einstellungen
        </Link>

        <div className="rounded-[36px] border border-[#e5eaf0] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#94a3b8]">
                Administration
              </p>
              <h1 className="text-[32px] font-semibold tracking-tight text-[#1d2433]">
                Benutzer & Rechte
              </h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-[#64748b]">
                Vorbereitung fuer Login, Rollen, Zugriffsrechte und Lizenzlimits.
                Free bleibt bei {licenseSummary.maxUsers} Benutzern inklusive Admin. Mehr Benutzer werden spaeter
                mit Monats- oder Jahreslizenz freigeschaltet.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#e5eaf0] bg-[#f8fafc] px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">Aktuelles Limit</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#94a3b8]">{licenseSummary.plan} · {licenseSummary.billingCycle}</p>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-[34px] font-medium leading-none text-[#111827]">{licenseSummary.activeUsers}</p>
                <p className="pb-1 text-sm font-medium text-[#64748b]">/ {licenseSummary.maxUsers} Benutzer</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">Lizenzschluessel</p>
              <h2 className="mt-3 text-lg font-semibold text-[#111827]">Monatlich oder jaehrlich freischalten</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-[#64748b]">
                Signatur-Pruefung, Aktivierungsservice und API-Endpunkt sind vorbereitet. Das Eingabefeld kommt im naechsten Schritt. Der Schluessel enthaelt
                Plan, Benutzerlimit, Ablaufdatum und Signatur.
              </p>

              <LicenseActivationForm />

              <div className="mt-5 rounded-[22px] border border-dashed border-[#cbd5e1] bg-white p-4">
                <p className="text-sm font-semibold text-[#111827]">Geplante Pruefung</p>
                <div className="mt-3 space-y-2">
                  {licenseSteps.map((step, index) => (
                    <div key={step} className="flex gap-3 text-sm font-medium text-[#64748b]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef2f7] text-xs font-semibold text-[#111827]">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">Lizenzplaene</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {licensePlans.map((plan) => (
                  <div key={plan.name} className="rounded-[20px] border border-[#e5eaf0] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{plan.name}</p>
                        <p className="mt-1 text-xs font-medium text-[#94a3b8]">{plan.billing}</p>
                        <p className="mt-2 text-xs font-medium text-[#64748b]">{plan.note}</p>
                      </div>
                      <p className="text-lg font-medium text-[#111827]">{formatPlanUsers(plan.maxUsers)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {permissionGroups.map((group) => (
              <section
                key={group.title}
                className="rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]"
              >
                <h2 className="text-lg font-semibold text-[#111827]">{group.title}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-[#64748b]">{group.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#e5eaf0] bg-white px-3 py-1.5 text-xs font-medium text-[#475569]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
