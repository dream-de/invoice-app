"use client"

import { Field, SettingCard, SoftInput, ToggleRow } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

export default function RemindersSettingsPage() {
  const { t } = useLanguage()

  return (
    <SettingsLayout
      title={t("settings.reminders.title")}
      description={t("settings.reminders.description")}
    >
      <SettingCard>
        <div className="space-y-4">
          <ToggleRow
            title={t("settings.reminders.enable.title")}
            description={t("settings.reminders.enable.description")}
          />

          <ToggleRow
            title={t("settings.reminders.recurring.title")}
            description={t("settings.reminders.recurring.description")}
          />
        </div>
      </SettingCard>

      <SettingCard title={t("settings.reminders.automation.title")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label={t("settings.reminders.fields.dailyRun")}>
            <SoftInput defaultValue="03:00" />
          </Field>
          <Field label={t("settings.reminders.fields.lastRun")}>
            <SoftInput defaultValue={t("settings.reminders.values.never")} />
          </Field>
          <Field label={t("settings.reminders.fields.nextRun")}>
            <SoftInput defaultValue={t("settings.reminders.values.nextRun")} />
          </Field>
        </div>
        <p className="mt-4 text-sm font-medium text-[#64748b]">
          {t("settings.reminders.automation.hint")}
        </p>
      </SettingCard>
    </SettingsLayout>
  )
}
