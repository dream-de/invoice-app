"use client"

import { useState } from "react"
import { Check, ChevronDown, Globe2 } from "lucide-react"
import { SettingCard } from "../_components/SettingsControls"
import { useLanguage, type AppLanguage } from "@/lib/i18n"

export function LanguageSettings() {
  const { language, setLanguage, t } = useLanguage()
  const [saved, setSaved] = useState(false)
  const [open, setOpen] = useState(false)

  function updateLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage)
    setSaved(true)
    setOpen(false)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const languages: Array<{ value: AppLanguage; label: string; description: string }> = [
    { value: "de", label: "Deutsch", description: t("settings.language.de.description") },
    { value: "en", label: "English", description: t("settings.language.en.description") }
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

          <div className="relative w-full sm:w-[230px]">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-full border border-[#dbe4ee] bg-white px-5 text-left text-sm font-extrabold text-[#111827] outline-none transition hover:border-[#cbd6e4] focus-visible:border-black focus-visible:ring-2 focus-visible:ring-black/10"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <span>{activeLanguage.label}</span>
              <ChevronDown className={`h-4 w-4 text-[#64748b] transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open ? (
              <div className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-[18px] border border-[#dbe4ee] bg-white p-1.5 shadow-[0_20px_48px_rgba(15,23,42,0.16)]" role="listbox">
                {languages.map((item) => {
                  const active = item.value === language

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => updateLanguage(item.value)}
                      className={`flex w-full items-center justify-between rounded-[14px] px-3.5 py-2.5 text-left text-sm font-extrabold transition ${active ? "bg-[#f1f5f9] text-[#111827]" : "text-[#64748b] hover:bg-[#f8fafc] hover:text-[#111827]"}`}
                      role="option"
                      aria-selected={active}
                    >
                      <span>{item.label}</span>
                      {active ? <Check className="h-4 w-4 text-[var(--brand-lime)]" /> : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
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
