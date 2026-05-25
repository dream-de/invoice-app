"use client"

import { useState } from "react"
import { Check, ChevronDown, Globe2 } from "lucide-react"
import { SettingCard } from "../_components/SettingsControls"
import { useLanguage, type AppLanguage } from "@/lib/i18n"

export function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage()
  const [saved, setSaved] = useState(false)

  function updateLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const languages: Array<{ value: AppLanguage; label: string; description: string }> = [
    { value: "de", label: "Deutsch", description: t("settings.language.de.description") },
    { value: "en", label: "English", description: t("settings.language.en.description") },
    { value: "fr", label: "Francais", description: t("settings.language.fr.description") },
    { value: "es", label: "Espanol", description: t("settings.language.es.description") },
    { value: "it", label: "Italiano", description: t("settings.language.it.description") },
    { value: "nl", label: "Nederlands", description: t("settings.language.nl.description") },
    { value: "pl", label: "Polski", description: t("settings.language.pl.description") },
    { value: "pt", label: "Portugues", description: t("settings.language.pt.description") },
    { value: "tr", label: "Turkce", description: t("settings.language.tr.description") }
  ]

  const activeLanguage = languages.find((item) => item.value === language) ?? languages[0]

  return (
    <SettingCard title={t("settings.language.title")} description={t("settings.language.description")}>
      <div className="rounded-[24px] border border-[#e1e7ef] bg-[#f8fafc] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-[var(--brand-lime)] shadow-sm">
              <Globe2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-black text-[#111827]">{activeLanguage.label}</p>
              <p className="mt-1 truncate text-sm font-medium text-[#64748b]">
                {activeLanguage.description}
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-[260px]">
            <select
              value={language}
              onChange={(event) => updateLanguage(event.target.value as AppLanguage)}
              className="h-11 w-full appearance-none rounded-full border border-[#dbe4ee] bg-white px-5 pr-11 text-sm font-extrabold text-[#111827] outline-none transition hover:border-[#cbd6e4] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black/10"
              aria-label={t("settings.language.title")}
            >
              {languages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#64748b] ring-1 ring-[#e5eaf0]">
          {saved ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              <span>{t("settings.language.saved")}</span>
            </>
          ) : (
            <span>{t("settings.language.hint")}</span>
          )}
        </div>
      </div>
    </SettingCard>
  )
}
