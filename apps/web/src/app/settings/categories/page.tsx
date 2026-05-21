"use client"

import { Field, IconButton, SettingCard, SoftInput, Trash2 } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

export default function CategoriesSettingsPage() {
  const { t } = useLanguage()
  const categories = [
    t("settings.categories.examples.food"),
    t("settings.categories.examples.drinks"),
    t("settings.categories.examples.dessert"),
    t("settings.categories.examples.menu")
  ]

  return (
    <SettingsLayout
      title={t("settings.categories.title")}
      description={t("settings.categories.description")}
    >
      <SettingCard title={t("settings.categories.cardTitle")}>
        <div className="mb-4 flex justify-end">
          <IconButton kind="success">{t("settings.categories.add")}</IconButton>
        </div>

        <div className="space-y-3">
          {categories.map((name, index) => (
            <div key={name} className="grid grid-cols-[64px_1fr_auto] items-end gap-3 rounded-[22px] border border-[#edf2f7] bg-[#f8fafc] p-4">
              <div className="pb-3 text-sm font-extrabold text-[#94a3b8]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <Field label={t("settings.categories.fields.name")}>
                <SoftInput defaultValue={name} />
              </Field>
              <button className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100" aria-label={t("settings.categories.delete")}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
