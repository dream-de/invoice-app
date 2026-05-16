"use client"

import { Download, IconButton, RotateCcw, SettingCard } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

export default function SystemSettingsPage() {
  return (
    <SettingsLayout
      title="System"
      description="Audit-Log, Backup und Wiederherstellung."
    >
      <SettingCard title="Audit" description="Audit-Log prüfen und als CSV exportieren.">
        <div className="flex flex-wrap gap-2">
          <IconButton>Verify</IconButton>
          <IconButton>
            <Download className="h-4 w-4" />
            Export CSV
          </IconButton>
        </div>
      </SettingCard>

      <SettingCard title="Backup" description="Datenbank sichern oder aus einer Sicherung wiederherstellen.">
        <div className="flex flex-wrap gap-2">
          <IconButton kind="success">
            <Download className="h-4 w-4" />
            Backup erstellen
          </IconButton>
          <IconButton>
            <RotateCcw className="h-4 w-4" />
            Restore
          </IconButton>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
