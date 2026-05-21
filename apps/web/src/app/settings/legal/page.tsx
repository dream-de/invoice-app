"use client"

import { ChoiceButtons, Field, SettingCard, SoftInput, SoftTextarea, ToggleRow } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

export default function LegalSettingsPage() {
  const { t } = useLanguage()
  const taxBasisOptions = [t("settings.legal.taxBasis.accrual"), t("settings.legal.taxBasis.cash")]

  return (
    <SettingsLayout
      title={t("settings.legal.title")}
      description={t("settings.legal.description")}
    >
      <SettingCard>
        <div className="space-y-4">
          <ToggleRow
            title={t("settings.legal.smallBusiness.title")}
            description={t("settings.legal.smallBusiness.description")}
          />
          <ToggleRow
            title={t("settings.legal.zugferd.title")}
            description={t("settings.legal.zugferd.description")}
          />
        </div>
      </SettingCard>

      <SettingCard>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("settings.legal.fields.defaultVat")}>
            <SoftInput defaultValue="19" />
          </Field>
          <Field label={t("settings.legal.fields.paymentTerm")}>
            <SoftInput defaultValue="14" />
          </Field>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
            {t("settings.legal.taxBasis.title")}
          </p>
          <p className="mb-3 text-sm font-medium text-[#64748b]">
            {t("settings.legal.taxBasis.description")}
          </p>
          <ChoiceButtons options={taxBasisOptions} defaultValue={taxBasisOptions[0]} />
        </div>
      </SettingCard>

      <SettingCard title={t("settings.legal.standardTexts.title")}>
        <div className="space-y-4">
          <Field label={t("settings.legal.fields.introText")}>
            <SoftTextarea rows={4} defaultValue={t("settings.legal.defaults.introText")} />
          </Field>
          <Field label={t("settings.legal.fields.footerText")}>
            <SoftTextarea rows={4} defaultValue={t("settings.legal.defaults.footerText")} />
          </Field>
        </div>
      </SettingCard>
    </SettingsLayout>
  )
}
