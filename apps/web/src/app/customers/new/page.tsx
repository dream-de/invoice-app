"use client"

import Link from "next/link"
import { useState } from "react"
import { useLanguage } from "@/lib/i18n"
import {
  Button,
  ContentCard,
  FormActions,
  Input,
  PageShell,
  Select
} from "@dream-invoice/ui"

type FormState = {
  name: string
  contact: string
  email: string
  phone: string
  number: string
  status: string
  street: string
  zip: string
  city: string
  country: string
}

const initialState: FormState = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  number: "",
  status: "active",
  street: "",
  zip: "",
  city: "",
  country: ""
}

export default function NewCustomerPage() {
  const { t } = useLanguage()
  const [form, setForm] = useState<FormState>(initialState)
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
    setStatus("idle")
    setMessage("")
  }

  async function createCustomer() {
    setStatus("saving")
    setMessage("")

    try {
      const response = await fetch("/api/customers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || t("customers.new.error.createFailed"))
      }

      setStatus("success")
      setMessage(`${t("customers.new.success.created")}: ${result.customer?.name}`)
      setForm(initialState)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : t("customers.new.error.unknown"))
    }
  }

  return (
    <PageShell
      title={t("customers.new.title")}
      description={t("customers.new.description")}
    >
      <div className="mb-2">
        <Link
          href="/customers"
          className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t("customers.new.back")}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <ContentCard
          title={t("customers.new.customerData.title")}
          description={t("customers.new.customerData.description")}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label={t("customers.new.fields.companyName")}
              placeholder={t("customers.new.placeholders.companyName")}
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />

            <Input
              label={t("customers.new.fields.contact")}
              placeholder={t("customers.new.placeholders.contact")}
              value={form.contact}
              onChange={(event) => updateField("contact", event.target.value)}
            />

            <Input
              label={t("customers.new.fields.email")}
              placeholder={t("customers.new.placeholders.email")}
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />

            <Input
              label={t("customers.new.fields.phone")}
              placeholder={t("customers.new.placeholders.phone")}
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />

            <Input
              label={t("customers.new.fields.customerNumber")}
              placeholder={t("customers.new.placeholders.customerNumber")}
              value={form.number}
              onChange={(event) => updateField("number", event.target.value)}
            />

            <Select
              label={t("customers.new.fields.status")}
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              options={[
                { label: t("customers.new.status.active"), value: "active" },
                { label: t("customers.new.status.open"), value: "open" },
                { label: t("customers.new.status.inactive"), value: "inactive" }
              ]}
            />
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-black text-slate-950">
              {t("customers.new.billingAddress")}
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Input
                label={t("customers.new.fields.street")}
                placeholder={t("customers.new.placeholders.street")}
                value={form.street}
                onChange={(event) => updateField("street", event.target.value)}
              />

              <Input
                label={t("customers.new.fields.zip")}
                placeholder={t("customers.new.placeholders.zip")}
                value={form.zip}
                onChange={(event) => updateField("zip", event.target.value)}
              />

              <Input
                label={t("customers.new.fields.city")}
                placeholder={t("customers.new.placeholders.city")}
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
              />

              <Input
                label={t("customers.new.fields.country")}
                placeholder={t("customers.new.placeholders.country")}
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
              />
            </div>
          </div>

          <FormActions>
            <Link href="/customers" className="no-underline">
              <Button variant="secondary">{t("customers.new.actions.cancel")}</Button>
            </Link>

            <Button
              onClick={createCustomer}
              disabled={status === "saving"}
            >
              {status === "saving" ? t("customers.new.actions.saving") : t("customers.new.actions.create")}
            </Button>
          </FormActions>

          {message && (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${
                status === "success"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                  : "bg-red-50 text-red-700 ring-1 ring-red-100"
              }`}
            >
              {message}
            </p>
          )}
        </ContentCard>

        <div className="space-y-6">
          <ContentCard
            title={t("customers.new.statusCard.title")}
            description={t("customers.new.statusCard.description")}
          >
            <div className="rounded-[24px] bg-black p-6 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-lime-200">
                {t("customers.new.statusCard.eyebrow")}
              </p>
              <p className="mt-3 text-3xl font-black">
                {t("customers.new.statusCard.entity")}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                {t("customers.new.statusCard.copy")}
              </p>
            </div>
          </ContentCard>

          <ContentCard
            title={t("customers.new.afterSave.title")}
            description={t("customers.new.afterSave.description")}
          >
            <div className="space-y-4">
              {[
                [t("customers.new.afterSave.overview.title"), t("customers.new.afterSave.overview.copy")],
                [t("customers.new.afterSave.invoices.title"), t("customers.new.afterSave.invoices.copy")],
                [t("customers.new.afterSave.projects.title"), t("customers.new.afterSave.projects.copy")]
              ].map((item) => (
                <div key={item[0]} className="rounded-[22px] bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{item[0]}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {item[1]}
                  </p>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
