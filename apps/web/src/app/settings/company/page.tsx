"use client"

import { useEffect, useState } from "react"
import { Building2, Landmark, Mail, Phone } from "lucide-react"
import { Field, SettingCard, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

type CompanyForm = {
  company: string
  owner: string
  street: string
  zip: string
  city: string
  country: string
  email: string
  phone: string
  website: string
}

const fallback: CompanyForm = {
  company: "Dream Ledger GmbH",
  owner: "Lena Falk",
  street: "Lindenallee 42",
  zip: "10115",
  city: "Koeln",
  country: "Deutschland",
  email: "office@dream-ledger.example",
  phone: "+49 30 1234567",
  website: "www.dream-ledger.example"
}

export default function CompanySettingsPage() {
  const { t } = useLanguage()
  const [form, setForm] = useState<CompanyForm>(fallback)
  const [status, setStatus] = useState("")

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/settings/company", { cache: "no-store" })
      const result = await response.json()

      if (result.ok && result.settings) {
        setForm({
          company: result.settings.company || "",
          owner: result.settings.owner || "",
          street: result.settings.street || "",
          zip: result.settings.zip || "",
          city: result.settings.city || "",
          country: result.settings.country || "Deutschland",
          email: result.settings.email || "",
          phone: result.settings.phone || "",
          website: result.settings.website || ""
        })
      }
    }

    loadSettings()
  }, [])

  function update(field: keyof CompanyForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function save() {
    setStatus(t("settings.company.status.saving"))

    const response = await fetch("/api/settings/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      setStatus(result.error || t("settings.company.status.error"))
      return
    }

    setStatus(t("settings.company.status.saved"))
  }

  return (
    <SettingsLayout
      title={t("settings.company.title")}
      description={t("settings.company.description")}
      action={save}
      status={status}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SettingCard title="Unternehmensprofil" description="Grunddaten fuer Firma, Inhaber und Rechnungsanschrift pflegen.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("settings.company.fields.company")}>
              <SoftInput value={form.company} onChange={(event) => update("company", event.target.value)} />
            </Field>
            <Field label={t("settings.company.fields.owner")}>
              <SoftInput value={form.owner} onChange={(event) => update("owner", event.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label={t("settings.company.fields.street")}>
                <SoftInput value={form.street} onChange={(event) => update("street", event.target.value)} />
              </Field>
            </div>
            <Field label={t("settings.company.fields.zip")}>
              <SoftInput value={form.zip} onChange={(event) => update("zip", event.target.value)} />
            </Field>
            <Field label={t("settings.company.fields.city")}>
              <SoftInput value={form.city} onChange={(event) => update("city", event.target.value)} />
            </Field>
            <Field label="Land">
              <SoftInput value={form.country} onChange={(event) => update("country", event.target.value)} />
            </Field>
          </div>
        </SettingCard>

        <div className="space-y-6">
          <SettingCard title="Kontakt" description="Oeffentliche Kontaktpunkte fuer Rechnungen und Kommunikation verwalten.">
            <div className="grid gap-4">
              <Field label={t("settings.company.fields.email")}>
                <SoftInput value={form.email} onChange={(event) => update("email", event.target.value)} />
              </Field>
              <Field label={t("settings.company.fields.phone")}>
                <SoftInput value={form.phone} onChange={(event) => update("phone", event.target.value)} />
              </Field>
              <Field label={t("settings.company.fields.website")}>
                <SoftInput value={form.website} onChange={(event) => update("website", event.target.value)} />
              </Field>
            </div>
          </SettingCard>

          <SettingCard title="Schnellueberblick" description="Die wichtigsten Stammdaten im Modul auf einen Blick.">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Building2, label: "Firma", value: form.company || "Nicht gesetzt" },
                { icon: Landmark, label: "Inhaber", value: form.owner || "Nicht gesetzt" },
                { icon: Mail, label: "E-Mail", value: form.email || "Nicht gesetzt" },
                { icon: Phone, label: "Telefon", value: form.phone || "Nicht gesetzt" }
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                    <div className="flex items-center gap-3 text-[var(--settings-title)]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--settings-label)]">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--settings-title)]">{item.value}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </SettingCard>
        </div>
      </div>
    </SettingsLayout>
  )
}
