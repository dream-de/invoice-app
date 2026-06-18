"use client"

import { useEffect, useState } from "react"
import { BellRing, Check, FileText, Mail, MessageSquareText, Power, Send, Server, Signature } from "lucide-react"
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

  const canSendTestMail = form.provider === "smtp"
    ? Boolean(form.smtpHost.trim() && form.fromEmail.trim())
    : form.provider === "resend"
      ? Boolean(form.resendApiKey.trim() && form.fromEmail.trim())
      : false

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

    if (!canSendTestMail) {
      setStatus("Testmail ist erst nach SMTP-Konfiguration aktiv.")
      return
    }

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
      title="Kommunikation"
      description="SMTP, E-Mail-Versand, Signaturen, Standardtexte und Kommunikationshinweise zentral verwalten."
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
                    ? "border-[var(--settings-accent)] bg-[var(--settings-surface)] shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                    : "border-[var(--settings-line)] bg-[var(--settings-subtle)] hover:bg-[var(--settings-surface)]"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${selected ? "bg-[linear-gradient(180deg,#7ee7ba_0%,#38c98b_54%,#22a86d_100%)] text-white" : "bg-[var(--settings-subtle)] text-[var(--settings-muted)]"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block font-extrabold text-[var(--settings-title)]">{option.title}</span>
                      <span className="mt-1 block text-sm font-medium text-[var(--settings-muted)]">{option.description}</span>
                    </span>
                  </span>

                  {selected ? <Check className="h-5 w-5 text-[var(--settings-title)]" /> : null}
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
          <div className="rounded-[22px] bg-[var(--settings-subtle)] px-5 py-4 text-sm font-semibold leading-6 text-[var(--settings-muted)]">
            <span className="flex items-center gap-2 font-extrabold text-[var(--settings-title)]"><Mail className="h-4 w-4" /> {t("settings.email.statusLabel")}</span>
            <span className="mt-1 block">{t("settings.email.activeProvider").replace("{provider}", providerOptions.find((option) => option.value === form.provider)?.title ?? "")}</span>
          </div>
        </div>
      </SettingCard>

      <SettingCard title={t("settings.email.mailpit.title")} description={t("settings.email.mailpit.description")}>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-[22px] bg-[var(--settings-subtle)] px-5 py-4 text-sm font-semibold leading-6 text-[var(--settings-muted)]">
            <span className="block font-extrabold text-[var(--settings-title)]">{t("settings.email.mailpit.valuesTitle")}</span>
            <span className="mt-1 block">SMTP: 127.0.0.1:1025</span>
            <span className="block">Inbox: http://localhost:8025</span>
          </div>
          <button
            type="button"
            onClick={applyMailpitPreset}
            className="inline-flex items-center justify-center rounded-full bg-[var(--settings-accent-soft)] px-5 py-3 text-sm font-extrabold text-[var(--settings-accent)] shadow-[0_10px_22px_rgba(30,58,138,0.12)] transition hover:bg-[var(--settings-surface)]"
          >
            {t("settings.email.mailpit.apply")}
          </button>
        </div>
      </SettingCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingCard title="Signaturen & Standardtexte" description="Texte fuer Rechnungs-E-Mails und Angebotsversand sauber vorbereiten.">
          <div className="space-y-3">
            {[
              { icon: Signature, title: "E-Mail-Signatur", detail: "Absendername und Antwortadresse werden bereits gespeichert.", state: "Aktiv" },
              { icon: MessageSquareText, title: "Standardtexte", detail: "Vorlagen fuer Rechnungs- und Angebotsversand sind vorbereitet.", state: "Vorbereitet" },
              { icon: FileText, title: "Dokumenttexte", detail: "Zahlungshinweise und Fusszeilen bleiben im Dokumente/Rechtliches-Bereich gepflegt.", state: "Verknuepft" }
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

        <SettingCard title="Kommunikationsstatus" description="Keine Scheinfunktionen: Versand wird nur aktiviert, wenn Provider und Absender korrekt konfiguriert sind.">
          <div className="grid gap-3">
            {[
              { icon: Mail, title: "E-Mail-Versand", detail: form.provider === "disabled" ? "Deaktiviert" : "Provider: " + form.provider.toUpperCase(), active: form.provider !== "disabled" },
              { icon: Server, title: "Serverseitiger Test", detail: canSendTestMail ? "Testmail verfuegbar" : "Konfiguration erforderlich", active: canSendTestMail },
              { icon: BellRing, title: "Benachrichtigungen", detail: "Eigene Kategorie in Phase 6/Sicherheit/System weiter verfeinern", active: true }
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
                  <span className={item.active ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[11px] font-extrabold text-emerald-700" : "rounded-full bg-[var(--settings-subtle)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]"}>
                    {item.active ? "Aktiv" : "Nicht eingerichtet"}
                  </span>
                </div>
              )
            })}
          </div>
        </SettingCard>
      </div>

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
          className={`mt-4 inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-extrabold transition ${form.smtpSecure ? "bg-[linear-gradient(180deg,#7ee7ba_0%,#38c98b_54%,#22a86d_100%)] text-white shadow-[0_8px_18px_rgba(34,197,94,0.18)]" : "bg-[var(--settings-subtle)] text-[var(--settings-title)]"}`}
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
          disabled={testing || !canSendTestMail}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)] disabled:cursor-not-allowed disabled:opacity-70"
          title={canSendTestMail ? "" : "SMTP erst konfigurieren, dann Testmail senden."}
        >
          <Send className="h-4 w-4" />
          {testing ? t("settings.email.test.running") : t("settings.email.test.send")}
        </button>
        {!canSendTestMail ? (
          <p className="mt-3 text-xs font-semibold text-[var(--settings-muted)]">
            Testmail ist erst nach SMTP-Konfiguration aktiv.
          </p>
        ) : null}
      </SettingCard>
    </SettingsLayout>
  )
}
