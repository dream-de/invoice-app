"use client"

import { useEffect, useState } from "react"
import { BellRing, Check, FileText, Mail, Settings, Shield, SlidersHorizontal } from "lucide-react"
import { Field, SettingCard } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

type NotificationCategory = "documents" | "email" | "settings" | "security" | "system"

type NotificationSettingsForm = {
  enabled: boolean
  categories: Record<NotificationCategory, boolean>
}

const defaultSettings: NotificationSettingsForm = {
  enabled: true,
  categories: {
    documents: true,
    email: true,
    settings: true,
    security: true,
    system: true
  }
}

const categoryOptions: Array<{
  key: NotificationCategory
  title: string
  description: string
  icon: typeof BellRing
}> = [
  {
    key: "documents",
    title: "Dokumente",
    description: "Rechnungen, PDF-Aktionen und wichtige Dokumentereignisse.",
    icon: FileText
  },
  {
    key: "email",
    title: "E-Mail-Versand",
    description: "Erfolgreich gesendete E-Mails, Test-E-Mails und Versandfehler.",
    icon: Mail
  },
  {
    key: "settings",
    title: "Einstellungen",
    description: "Aenderungen an Versand, Nummernkreisen und Systemkonfiguration.",
    icon: SlidersHorizontal
  },
  {
    key: "security",
    title: "Sicherheit",
    description: "Anmeldungen, 2FA, Passwort- und Kontosicherheitsereignisse.",
    icon: Shield
  },
  {
    key: "system",
    title: "System",
    description: "Backups, Wartung und technische Hinweise.",
    icon: Settings
  }
]

export default function NotificationSettingsPage() {
  const [form, setForm] = useState<NotificationSettingsForm>(defaultSettings)
  const [status, setStatus] = useState("")

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings/notifications", { cache: "no-store" })
        const result = await response.json().catch(() => null)
        if (response.ok && result?.settings) {
          setForm({
            enabled: result.settings.enabled !== false,
            categories: {
              ...defaultSettings.categories,
              ...result.settings.categories
            }
          })
        }
      } catch {
        setStatus("Benachrichtigungseinstellungen konnten nicht geladen werden.")
      }
    }

    loadSettings()
  }, [])

  function toggleCategory(category: NotificationCategory) {
    setForm((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [category]: !current.categories[category]
      }
    }))
  }

  async function save() {
    setStatus("Speichert...")
    const response = await fetch("/api/settings/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })
    const result = await response.json().catch(() => null)

    if (!response.ok || !result?.ok) {
      setStatus(result?.error || "Speichern fehlgeschlagen.")
      return
    }

    setForm({
      enabled: result.settings.enabled !== false,
      categories: {
        ...defaultSettings.categories,
        ...result.settings.categories
      }
    })
    setStatus("Gespeichert.")
  }

  return (
    <SettingsLayout
      title="Benachrichtigungen"
      description="Steuern Sie, welche Ereignisse oben an der Glocke angezeigt werden."
      action={save}
      status={status}
    >
      <SettingCard title="Benachrichtigungssystem" description="Wenn ausgeschaltet, werden keine neuen Hinweise angezeigt. Bestehende Hinweise bleiben gespeichert.">
        <Field label="Status">
          <button
            type="button"
            onClick={() => setForm((current) => ({ ...current, enabled: !current.enabled }))}
            className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-[#edf2f7] bg-[#f8fafc] p-4 text-left transition hover:bg-white"
          >
            <span>
              <span className="block font-extrabold text-[#111827]">
                {form.enabled ? "Benachrichtigungen aktiv" : "Benachrichtigungen aus"}
              </span>
              <span className="mt-1 block text-sm font-medium text-[#64748b]">
                Die Glocke zeigt nur aktive Kategorien und ungelesene Hinweise.
              </span>
            </span>
            <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${form.enabled ? "bg-black" : "bg-[#dfe6ee]"}`}>
              <span className={`h-6 w-6 rounded-full bg-white transition ${form.enabled ? "translate-x-6" : ""}`} />
            </span>
          </button>
        </Field>
      </SettingCard>

      <SettingCard title="Kategorien" description="Diese Bereiche koennen einzeln ein- oder ausgeschaltet werden.">
        <div className="grid gap-3 md:grid-cols-2">
          {categoryOptions.map((option) => {
            const Icon = option.icon
            const enabled = form.categories[option.key]

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleCategory(option.key)}
                className={`rounded-[24px] border p-5 text-left transition ${
                  enabled
                    ? "border-black bg-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                    : "border-[#e5eaf0] bg-[#f8fafc] hover:bg-white"
                }`}
              >
                <span className="flex items-start justify-between gap-4">
                  <span className="flex min-w-0 gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${enabled ? "bg-black text-[var(--brand-lime)]" : "bg-[#edf2f7] text-[#64748b]"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block font-extrabold text-[#111827]">{option.title}</span>
                      <span className="mt-1 block text-sm font-medium leading-5 text-[#64748b]">{option.description}</span>
                    </span>
                  </span>
                  {enabled ? <Check className="h-5 w-5 shrink-0 text-[#111827]" /> : null}
                </span>
              </button>
            )
          })}
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
