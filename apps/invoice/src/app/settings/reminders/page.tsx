"use client"

import { Field, SettingCard, SoftInput, ToggleRow } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

export default function RemindersSettingsPage() {
  return (
    <SettingsLayout
      title="Mahnwesen"
      description="Automatische Zahlungserinnerungen und Mahnungen."
    >
      <SettingCard>
        <div className="space-y-4">
          <ToggleRow
            title="Mahnwesen aktivieren"
            description="Automatische Zahlungserinnerungen für überfällige Rechnungen."
          />

          <ToggleRow
            title="Automatische Abo-Rechnungen"
            description="Automatische Generierung wiederkehrender Rechnungen."
          />
        </div>
      </SettingCard>

      <SettingCard title="Automatisierung">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Tägliche Ausführung um">
            <SoftInput defaultValue="03:00" />
          </Field>
          <Field label="Letzter Lauf">
            <SoftInput defaultValue="Noch nie" />
          </Field>
          <Field label="Nächster Lauf">
            <SoftInput defaultValue="Sa., 16. Mai, 03:00" />
          </Field>
        </div>
        <p className="mt-4 text-sm font-medium text-[#64748b]">
          Empfohlen: 03:00 Uhr nachts, um Konflikte mit Mahnlauf und Rechnungsversand zu vermeiden.
        </p>
      </SettingCard>
    </SettingsLayout>
  )
}
