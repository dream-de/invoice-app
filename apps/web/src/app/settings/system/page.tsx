"use client"

import { Download, IconButton, RotateCcw, SettingCard } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { LanguageSettings } from "./LanguageSettings"
import { useLanguage } from "@/lib/i18n"

export default function SystemSettingsPage() {
  const { t } = useLanguage()

  return (
    <SettingsLayout
      title={t("settings.system.title")}
      description={t("settings.system.description")}
    >
      <LanguageSettings />

      <SettingCard title={t("settings.audit.title")} description={t("settings.audit.description")}>
        <div className="flex flex-wrap gap-2">
          <IconButton>{t("settings.audit.verify")}</IconButton>
          <IconButton>
            <Download className="h-4 w-4" />
            {t("settings.audit.export")}
          </IconButton>
        </div>
      </SettingCard>

      <SettingCard title={t("settings.backup.title")} description={t("settings.backup.description")}>
        <div className="flex flex-wrap gap-2">
          <IconButton kind="success">
            <Download className="h-4 w-4" />
            {t("settings.backup.create")}
          </IconButton>
          <IconButton>
            <RotateCcw className="h-4 w-4" />
            {t("settings.backup.restore")}
          </IconButton>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
