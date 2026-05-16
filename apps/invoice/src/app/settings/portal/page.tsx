"use client"

import { Field, IconButton, SettingCard, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

export default function PortalSettingsPage() {
  return (
    <SettingsLayout
      title="Offer Portal"
      description="Angebotslinks veröffentlichen und Status synchronisieren."
    >
      <SettingCard>
        <div className="space-y-4">
          <Field label="Portal Base URL">
            <SoftInput defaultValue="https://portal.invoice.local" />
          </Field>

          <p className="text-sm font-medium text-[#64748b]">
            Tipp: Setup-Seite im Portal: /admin/setup
          </p>

          <Field label="Publish API Key (optional)">
            <SoftInput type="password" defaultValue="" placeholder="API Key eintragen" />
          </Field>

          <IconButton>Verbindung testen</IconButton>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
