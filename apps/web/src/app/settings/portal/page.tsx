"use client"

import { Field, IconButton, SettingCard, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

export default function PortalSettingsPage() {
  const { t } = useLanguage()

  return (
    <SettingsLayout
      title={t("settings.portal.title")}
      description={t("settings.portal.description")}
    >
      <SettingCard>
        <div className="space-y-4">
          <Field label={t("settings.portal.fields.baseUrl")}>
            <SoftInput defaultValue="https://portal.invoice.local" />
          </Field>

          <p className="text-sm font-medium text-[#64748b]">
            {t("settings.portal.hint")}
          </p>

          <Field label={t("settings.portal.fields.apiKey")}>
            <SoftInput type="password" defaultValue="" placeholder={t("settings.portal.placeholders.apiKey")} />
          </Field>

          <IconButton>{t("settings.portal.testConnection")}</IconButton>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
