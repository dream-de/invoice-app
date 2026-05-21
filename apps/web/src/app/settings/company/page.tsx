"use client"

import { useEffect, useState } from "react"
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
      <SettingCard>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("settings.company.fields.company")}>
            <SoftInput value={form.company} onChange={(event) => update("company", event.target.value)} />
          </Field>
          <Field label={t("settings.company.fields.owner")}>
            <SoftInput value={form.owner} onChange={(event) => update("owner", event.target.value)} />
          </Field>
          <Field label={t("settings.company.fields.street")}>
            <SoftInput value={form.street} onChange={(event) => update("street", event.target.value)} />
          </Field>
          <Field label={t("settings.company.fields.zip")}>
            <SoftInput value={form.zip} onChange={(event) => update("zip", event.target.value)} />
          </Field>
          <Field label={t("settings.company.fields.city")}>
            <SoftInput value={form.city} onChange={(event) => update("city", event.target.value)} />
          </Field>
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
    </SettingsLayout>
  )
}
