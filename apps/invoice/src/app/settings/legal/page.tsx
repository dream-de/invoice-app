"use client"

import { ChoiceButtons, Field, SettingCard, SoftInput, SoftTextarea, ToggleRow } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

export default function LegalSettingsPage() {
  return (
    <SettingsLayout
      title="Rechtliches & Texte"
      description="Steuerliche Einstellungen und Standardtexte."
    >
      <SettingCard>
        <div className="space-y-4">
          <ToggleRow
            title="Kleinunternehmerregelung anwenden"
            description="Keine Umsatzsteuerberechnung gem. § 19 UStG."
          />
          <ToggleRow
            title="ZUGFeRD Export für Rechnungen aktivieren"
            description="Exportiert Rechnungen als ZUGFeRD EN16931."
          />
        </div>
      </SettingCard>

      <SettingCard>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Standard Umsatzsteuer (%)">
            <SoftInput defaultValue="19" />
          </Field>
          <Field label="Zahlungsziel (Tage)">
            <SoftInput defaultValue="14" />
          </Field>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
            Umsatzsteuer-Basis (Dashboard)
          </p>
          <p className="mb-3 text-sm font-medium text-[#64748b]">
            Soll basiert auf gestellten Rechnungen. Ist basiert auf erfassten Zahlungen.
          </p>
          <ChoiceButtons options={["Soll", "Ist"]} defaultValue="Soll" />
        </div>
      </SettingCard>

      <SettingCard title="Standardtexte">
        <div className="space-y-4">
          <Field label="Einleitungstext (Standard)">
            <SoftTextarea rows={4} defaultValue="Vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Leistungen:" />
          </Field>
          <Field label="Fußzeilentext (Zusatz)">
            <SoftTextarea rows={4} defaultValue="Zahlbar innerhalb von 14 Tagen ohne Abzug." />
          </Field>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
