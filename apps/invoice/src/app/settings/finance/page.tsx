"use client"

import { useEffect, useState } from "react"
import { Field, SettingCard, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

type FinanceForm = {
  company: string
  bankName: string
  iban: string
  bic: string
  taxNumber: string
  vatId: string
  registerCourt: string
}

const fallback: FinanceForm = {
  company: "Dream Ledger GmbH",
  bankName: "Koelner Sparkasse",
  iban: "DE12 1005 0000 1234 5678 90",
  bic: "BELA DE BE XXX",
  taxNumber: "12/345/67890",
  vatId: "DE123456789",
  registerCourt: "Amtsgericht Charlottenburg HRB 12345"
}

export default function FinanceSettingsPage() {
  const { t } = useLanguage()
  const [form, setForm] = useState<FinanceForm>(fallback)
  const [status, setStatus] = useState("")

  useEffect(() => {
    async function loadSettings() {
      const response = await fetch("/api/settings/company", { cache: "no-store" })
      const result = await response.json()

      if (result.ok && result.settings) {
        setForm({
          company: result.settings.company || fallback.company,
          bankName: result.settings.bankName || "",
          iban: result.settings.iban || "",
          bic: result.settings.bic || "",
          taxNumber: result.settings.taxNumber || "",
          vatId: result.settings.vatId || "",
          registerCourt: result.settings.registerCourt || ""
        })
      }
    }

    loadSettings()
  }, [])

  function update(field: keyof FinanceForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function save() {
    setStatus(t("settings.finance.status.saving"))

    const existingResponse = await fetch("/api/settings/company", { cache: "no-store" })
    const existingResult = await existingResponse.json()
    const existing = existingResult.settings || {}

    const response = await fetch("/api/settings/company", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...existing,
        company: existing.company || form.company || fallback.company,
        bankName: form.bankName,
        iban: form.iban,
        bic: form.bic,
        taxNumber: form.taxNumber,
        vatId: form.vatId,
        registerCourt: form.registerCourt
      })
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      setStatus(result.error || t("settings.finance.status.error"))
      return
    }

    setStatus(t("settings.finance.status.saved"))
  }

  return (
    <SettingsLayout
      title={t("settings.finance.title")}
      description={t("settings.finance.description")}
      action={save}
      status={status}
    >
      <SettingCard title={t("settings.finance.bank.title")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("settings.finance.fields.bankName")}>
            <SoftInput value={form.bankName} onChange={(event) => update("bankName", event.target.value)} />
          </Field>
          <Field label={t("settings.finance.fields.iban")}>
            <SoftInput value={form.iban} onChange={(event) => update("iban", event.target.value)} />
          </Field>
          <Field label={t("settings.finance.fields.bic")}>
            <SoftInput value={form.bic} onChange={(event) => update("bic", event.target.value)} />
          </Field>
        </div>
      </SettingCard>

      <SettingCard title={t("settings.finance.tax.title")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("settings.finance.fields.taxNumber")}>
            <SoftInput value={form.taxNumber} onChange={(event) => update("taxNumber", event.target.value)} />
          </Field>
          <Field label={t("settings.finance.fields.vatId")}>
            <SoftInput value={form.vatId} onChange={(event) => update("vatId", event.target.value)} />
          </Field>
          <div className="md:col-span-2">
            <Field label={t("settings.finance.fields.registerCourt")}>
              <SoftInput value={form.registerCourt} onChange={(event) => update("registerCourt", event.target.value)} />
            </Field>
          </div>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
