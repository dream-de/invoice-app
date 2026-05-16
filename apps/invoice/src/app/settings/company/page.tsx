"use client"

import { useEffect, useState } from "react"
import { Field, SettingCard, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

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
  company: "Mustermann GmbH",
  owner: "Max Mustermann",
  street: "Musterstraße 123",
  zip: "10115",
  city: "Berlin",
  country: "Deutschland",
  email: "info@mustermann-gmbh.de",
  phone: "+49 30 1234567",
  website: "www.mustermann-gmbh.de"
}

export default function CompanySettingsPage() {
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
    setStatus("Speichert...")

    const response = await fetch("/api/settings/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      setStatus(result.error || "Speichern fehlgeschlagen.")
      return
    }

    setStatus("Gespeichert.")
  }

  return (
    <SettingsLayout
      title="Unternehmensdaten"
      description="Diese Informationen erscheinen im Kopf- und Fußbereich der Rechnung."
      action={save}
      status={status}
    >
      <SettingCard>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Firmenname">
            <SoftInput value={form.company} onChange={(event) => update("company", event.target.value)} />
          </Field>
          <Field label="Inhaber / Geschäftsführer">
            <SoftInput value={form.owner} onChange={(event) => update("owner", event.target.value)} />
          </Field>
          <Field label="Straße & Hausnr.">
            <SoftInput value={form.street} onChange={(event) => update("street", event.target.value)} />
          </Field>
          <Field label="PLZ">
            <SoftInput value={form.zip} onChange={(event) => update("zip", event.target.value)} />
          </Field>
          <Field label="Stadt">
            <SoftInput value={form.city} onChange={(event) => update("city", event.target.value)} />
          </Field>
          <Field label="E-Mail Adresse">
            <SoftInput value={form.email} onChange={(event) => update("email", event.target.value)} />
          </Field>
          <Field label="Telefon">
            <SoftInput value={form.phone} onChange={(event) => update("phone", event.target.value)} />
          </Field>
          <Field label="Webseite">
            <SoftInput value={form.website} onChange={(event) => update("website", event.target.value)} />
          </Field>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
