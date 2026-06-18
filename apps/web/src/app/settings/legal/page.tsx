"use client"

import { ChoiceButtons, Field, SettingCard, SoftInput, SoftTextarea, ToggleRow } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

export default function LegalSettingsPage() {
  const { t } = useLanguage()
  const taxBasisOptions = [t("settings.legal.taxBasis.accrual"), t("settings.legal.taxBasis.cash")]

  const legalStatus = [
    ["Steuerbasis", "Standard-Umsatzsteuer und Zahlungsziel bleiben editierbar.", "Aktiv"],
    ["Kleinunternehmerregelung", "Kann als rechtlicher Hinweis geschaltet werden.", "Optional"],
    ["E-Rechnung / ZUGFeRD", "E-Rechnungsoptionen koennen vorbereitet werden.", "Vorbereitet"],
    ["Pflichttexte", "Einleitungs- und Fusszeilentexte sind frei bearbeitbar.", "Aktiv"]
  ]

  return (
    <SettingsLayout
      title={t("settings.legal.title")}
      description={t("settings.legal.description")}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <SettingCard title="Steuern & Pflichtangaben" description="Rechtliche Standardwerte fuer Rechnungen und Angebote kompakt verwalten.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("settings.legal.fields.defaultVat")}>
              <SoftInput defaultValue="19" inputMode="decimal" />
            </Field>
            <Field label={t("settings.legal.fields.paymentTerm")}>
              <SoftInput defaultValue="14" inputMode="numeric" />
            </Field>
          </div>

          <div className="mt-6 rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[var(--settings-label)]">
              {t("settings.legal.taxBasis.title")}
            </p>
            <p className="mb-4 text-sm font-medium leading-6 text-[var(--settings-muted)]">
              {t("settings.legal.taxBasis.description")}
            </p>
            <ChoiceButtons options={taxBasisOptions} defaultValue={taxBasisOptions[0]} />
          </div>
        </SettingCard>

        <SettingCard title="Rechtsstatus" description="Ueberblick ueber verfuegbare rechtliche Optionen und Pflichtangaben.">
          <div className="space-y-3">
            {legalStatus.map(([title, detail, status]) => {
              const isActive = status === "Aktiv"
              const isOptional = status === "Optional"

              return (
                <div key={title} className="flex items-center justify-between gap-4 rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                  <div>
                    <p className="text-sm font-extrabold text-[var(--settings-title)]">{title}</p>
                    <p className="mt-1 text-xs font-medium text-[var(--settings-muted)]">{detail}</p>
                  </div>
                  <span className={isActive ? "rounded-full bg-[linear-gradient(180deg,#ecfdf5_0%,#dcfce7_100%)] px-3 py-1 text-[11px] font-extrabold text-emerald-700" : isOptional ? "rounded-full bg-amber-50 px-3 py-1 text-[11px] font-extrabold text-amber-700" : "rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]"}>
                    {status}
                  </span>
                </div>
              )
            })}
          </div>
        </SettingCard>
      </div>

      <SettingCard title="Rechtliche Schalter" description="Wichtige rechtliche Optionen direkt in den Einstellungen verwalten.">
        <div className="grid gap-4 md:grid-cols-2">
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

      <SettingCard title={t("settings.legal.standardTexts.title")} description="Standardtexte bleiben frei editierbar und koennen spaeter in Rechnungen und Angebote uebernommen werden.">
        <div className="grid gap-4 xl:grid-cols-2">
          <Field label={t("settings.legal.fields.introText")}>
            <SoftTextarea rows={5} defaultValue={t("settings.legal.defaults.introText")} />
          </Field>
          <Field label={t("settings.legal.fields.footerText")}>
            <SoftTextarea rows={5} defaultValue={t("settings.legal.defaults.footerText")} />
          </Field>
        </div>
      </SettingCard>

    </SettingsLayout>
  )
}
