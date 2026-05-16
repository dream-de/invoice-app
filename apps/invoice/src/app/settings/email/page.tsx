"use client"

import { Field, SettingCard, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

export default function EmailSettingsPage() {
  return (
    <SettingsLayout
      title="E-Mail Konfiguration"
      description="Konfigurieren Sie SMTP oder Resend für den E-Mail-Versand."
    >
      <SettingCard title="E-Mail-Anbieter">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["Kein Versand", "E-Mails deaktiviert"],
            ["SMTP", "Eigener Mail-Server"],
            ["Resend", "Transactional API"]
          ].map(([title, sub], index) => (
            <button
              key={title}
              className={`rounded-[24px] border p-5 text-left transition ${
                index === 0
                  ? "border-black bg-white shadow-[0_12px_28px_rgba(15,23,42,0.12)]"
                  : "border-[#e5eaf0] bg-[#f8fafc] hover:bg-white"
              }`}
            >
              <span className="block font-extrabold text-[#111827]">{title}</span>
              <span className="mt-1 block text-sm font-medium text-[#64748b]">{sub}</span>
            </button>
          ))}
        </div>
      </SettingCard>

      <SettingCard title="SMTP">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SMTP Host">
            <SoftInput defaultValue="smtp.example.com" />
          </Field>
          <Field label="Port">
            <SoftInput defaultValue="587" />
          </Field>
          <Field label="Benutzername">
            <SoftInput defaultValue="noreply@mustermann-gmbh.de" />
          </Field>
          <Field label="Passwort">
            <SoftInput type="password" defaultValue="password" />
          </Field>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
