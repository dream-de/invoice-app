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

      <SettingCard title={t("settings.backup.title")}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[22px] border border-[#e5eaf0] bg-[#f8fafc] p-4">
            <h4 className="text-sm font-black text-[#111827]">{t("settings.backup.createTitle")}</h4>
            <p className="mt-1 text-sm font-medium leading-6 text-[#64748b]">{t("settings.backup.createDescription")}</p>
            <div className="mt-4">
              <IconButton kind="success">
                <Download className="h-4 w-4" />
                {t("settings.backup.create")}
              </IconButton>
            </div>
          </div>

          <div className="rounded-[22px] border border-[#e5eaf0] bg-[#f8fafc] p-4">
            <h4 className="text-sm font-black text-[#111827]">{t("settings.backup.restoreTitle")}</h4>
            <p className="mt-1 text-sm font-medium leading-6 text-[#64748b]">{t("settings.backup.restoreDescription")}</p>
            <div className="mt-4">
              <IconButton>
                <RotateCcw className="h-4 w-4" />
                {t("settings.backup.restore")}
              </IconButton>
            </div>
          </div>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
