"use client"

import { useEffect, useState } from "react"
import { Check, Mail, Power, Send, Server } from "lucide-react"
import { Field, SettingCard, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

type EmailProvider = "disabled" | "smtp" | "resend"

type EmailSettingsForm = {
  provider: EmailProvider
  fromName: string
  fromEmail: string
  replyTo: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPassword: string
  smtpPasswordSet: boolean
  resendApiKey: string
  resendApiKeySet: boolean
}

const fallback: EmailSettingsForm = {
  provider: "disabled",
  fromName: "Dream Invoice",
  fromEmail: "",
  replyTo: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "",
  smtpPassword: "",
  smtpPasswordSet: false,
  resendApiKey: "",
  resendApiKeySet: false
}


export default function EmailSettingsPage() {
  const { t } = useLanguage()
  const providerOptions: Array<{
    value: EmailProvider
    title: string
    description: string
    icon: typeof Power
  }> = [
    {
      value: "disabled",
      title: t("settings.email.providers.disabled.title"),
      description: t("settings.email.providers.disabled.description"),
      icon: Power
    },
    {
      value: "smtp",
      title: t("settings.email.providers.smtp.title"),
      description: t("settings.email.providers.smtp.description"),
      icon: Server
    },
    {
      value: "resend",
      title: t("settings.email.providers.resend.title"),
      description: t("settings.email.providers.resend.description"),
      icon: Send
    }
  ]

  const [form, setForm] = useState<EmailSettingsForm>(fallback)
  const [status, setStatus] = useState("")
  const [testRecipient, setTestRecipient] = useState("")
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings/email", { cache: "no-store" })
        const result = await response.json()

        if (result.ok && result.settings) {
          setForm({
            ...fallback,
            ...result.settings,
            smtpPassword: "",
            resendApiKey: "",
            smtpPasswordSet: Boolean(result.settings.smtpPasswordSet),
            resendApiKeySet: Boolean(result.settings.resendApiKeySet)
          })
          setTestRecipient(result.settings.replyTo || result.settings.fromEmail || "")
        }
      } catch {
        setStatus(t("settings.email.status.loadError"))
      }
    }

    loadSettings()
  }, [])

  function update<K extends keyof EmailSettingsForm>(field: K, value: EmailSettingsForm[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function sendTestEmail() {
    if (testing) return

    setTesting(true)
    setStatus(t("settings.email.status.testSending"))

    const response = await fetch("/api/settings/email/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testRecipient })
    })

    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.ok) {
      setStatus(result?.error || t("settings.email.status.testError"))
      setTesting(false)
      return
    }

    setStatus(t("settings.email.status.testSent"))
    setTesting(false)
  }

  function applyMailpitPreset() {
    setForm((current) => ({
      ...current,
      provider: "smtp",
      fromName: current.fromName || "Dream Invoice",
      fromEmail: current.fromEmail || "no-reply@dream-invoice.local",
      replyTo: current.replyTo || "dev@dream-invoice.local",
      smtpHost: "127.0.0.1",
      smtpPort: 1025,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: ""
    }))
    setTestRecipient((current) => current || "dev@dream-invoice.local")
    setStatus(t("settings.email.mailpit.applied"))
  }

  async function save() {
    setStatus(t("settings.email.status.saving"))

    const response = await fetch("/api/settings/email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.ok) {
      setStatus(result?.error || t("settings.email.status.saveError"))
      return
    }

    setForm((current) => ({
      ...current,
      smtpPassword: "",
      resendApiKey: "",
      smtpPasswordSet: Boolean(result.settings?.smtpPasswordSet),
      resendApiKeySet: Boolean(result.settings?.resendApiKeySet)
    }))
    setStatus(t("settings.email.status.saved"))
  }

  return (
    <SettingsLayout
      title={t("settings.email.title")}
      description={t("settings.email.description")}
      action={save}
      status={status}
    >
      <SettingCard title={t("settings.email.provider.title")} description={t("settings.email.provider.description")}>
        <div className="grid gap-3 md:grid-cols-3">
          {providerOptions.map((option) => {
            const Icon = option.icon
            const selected = form.provider === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => update("provider", option.value)}
                className={`rounded-[24px] border p-5 text-left transition ${
                  selected
                    ? "border-black bg-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                    : "border-[#e5eaf0] bg-[#f8fafc] hover:bg-white"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${selected ? "bg-black text-[var(--brand-lime)]" : "bg-[#edf2f7] text-[#64748b]"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-extrabold text-[#111827]">{option.title}</span>
                      <span className="mt-1 block text-sm font-medium text-[#64748b]">{option.description}</span>
                    </span>
                  </span>

                  {selected ? <Check className="h-5 w-5 text-[#111827]" /> : null}
                </span>
              </button>
            )
          })}
        </div>
      </SettingCard>

      <SettingCard title={t("settings.email.sender.title")} description={t("settings.email.sender.description")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("settings.email.fields.fromName")}>
            <SoftInput value={form.fromName} onChange={(event) => update("fromName", event.target.value)} placeholder={t("settings.email.placeholders.fromName")} />
          </Field>
          <Field label={t("settings.email.fields.fromEmail")}>
            <SoftInput type="email" value={form.fromEmail} onChange={(event) => update("fromEmail", event.target.value)} placeholder={t("settings.email.placeholders.fromEmail")} />
          </Field>
          <Field label={t("settings.email.fields.replyTo")}>
            <SoftInput type="email" value={form.replyTo} onChange={(event) => update("replyTo", event.target.value)} placeholder={t("settings.email.placeholders.optional")} />
          </Field>
          <div className="rounded-[22px] bg-[#f7f9fc] px-5 py-4 text-sm font-semibold leading-6 text-[#64748b]">
            <span className="flex items-center gap-2 font-extrabold text-[#111827]"><Mail className="h-4 w-4" /> {t("settings.email.statusLabel")}</span>
            <span className="mt-1 block">{t("settings.email.activeProvider").replace("{provider}", providerOptions.find((option) => option.value === form.provider)?.title ?? "")}</span>
          </div>
        </div>
      </SettingCard>

      <SettingCard title={t("settings.email.mailpit.title")} description={t("settings.email.mailpit.description")}>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-[22px] bg-[#f7f9fc] px-5 py-4 text-sm font-semibold leading-6 text-[#64748b]">
            <span className="block font-extrabold text-[#111827]">{t("settings.email.mailpit.valuesTitle")}</span>
            <span className="mt-1 block">SMTP: 127.0.0.1:1025</span>
            <span className="block">Inbox: http://localhost:8025</span>
          </div>
          <button
            type="button"
            onClick={applyMailpitPreset}
            className="inline-flex items-center justify-center rounded-full bg-[#e8eeff] px-5 py-3 text-sm font-extrabold text-[#1e3a8a] shadow-[0_10px_22px_rgba(30,58,138,0.12)] transition hover:bg-[#dbeafe]"
          >
            {t("settings.email.mailpit.apply")}
          </button>
        </div>
      </SettingCard>

      <SettingCard title={t("settings.email.smtp.title")} description={t("settings.email.smtp.description")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("settings.email.fields.smtpHost")}>
            <SoftInput value={form.smtpHost} onChange={(event) => update("smtpHost", event.target.value)} placeholder="smtp.example.com" />
          </Field>
          <Field label={t("settings.email.fields.smtpPort")}>
            <SoftInput type="number" value={form.smtpPort} onChange={(event) => update("smtpPort", Number(event.target.value) || 587)} />
          </Field>
          <Field label={t("settings.email.fields.smtpUser")}>
            <SoftInput value={form.smtpUser} onChange={(event) => update("smtpUser", event.target.value)} placeholder={t("settings.email.placeholders.smtpUser")} />
          </Field>
          <Field label={t("settings.email.fields.smtpPassword")}>
            <SoftInput
              type="password"
              value={form.smtpPassword}
              onChange={(event) => update("smtpPassword", event.target.value)}
              placeholder={form.smtpPasswordSet ? t("settings.email.placeholders.savedPassword") : t("settings.email.placeholders.password")}
            />
          </Field>
        </div>

        <button
          type="button"
          aria-pressed={form.smtpSecure}
          onClick={() => update("smtpSecure", !form.smtpSecure)}
          className={`mt-4 inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-extrabold transition ${form.smtpSecure ? "bg-black text-[var(--brand-lime)]" : "bg-[#eef2f7] text-[#334155]"}`}
        >
          <span className={`h-3 w-3 rounded-full ${form.smtpSecure ? "bg-[var(--brand-lime)]" : "bg-[#94a3b8]"}`} />
          {t("settings.email.smtp.secure")}
        </button>
      </SettingCard>

      <SettingCard title={t("settings.email.resend.title")} description={t("settings.email.resend.description")}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("settings.email.fields.apiKey")}>
            <SoftInput
              type="password"
              value={form.resendApiKey}
              onChange={(event) => update("resendApiKey", event.target.value)}
              placeholder={form.resendApiKeySet ? t("settings.email.placeholders.savedApiKey") : "re_..."}
            />
          </Field>
          <Field label={t("settings.email.fields.testRecipient")}>
            <SoftInput
              type="email"
              value={testRecipient}
              onChange={(event) => setTestRecipient(event.target.value)}
              placeholder={t("settings.email.placeholders.testRecipient")}
            />
          </Field>
        </div>

        <button
          type="button"
          onClick={sendTestEmail}
          disabled={testing}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)] disabled:cursor-wait disabled:opacity-70"
        >
          <Send className="h-4 w-4" />
          {testing ? t("settings.email.test.running") : t("settings.email.test.send")}
        </button>
      </SettingCard>
    </SettingsLayout>
  )
}
