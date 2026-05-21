"use client"

import { useEffect, useMemo, useState } from "react"
import { DEFAULT_LANGUAGE, isAppLanguage, LANGUAGE_STORAGE_KEY, type AppLanguage } from "@/i18n/config"
import { appTranslations, type TranslationKey } from "@/i18n/dictionary"

export type { AppLanguage } from "@/i18n/config"

function readLanguage(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return isAppLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

export function setStoredLanguage(language: AppLanguage) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  document.documentElement.lang = language
  window.dispatchEvent(new CustomEvent("invoice-language-change", { detail: language }))
}

export function useLanguage() {
  const [language, setLanguage] = useState<AppLanguage>(DEFAULT_LANGUAGE)

  useEffect(() => {
    const nextLanguage = readLanguage()
    setLanguage(nextLanguage)
    document.documentElement.lang = nextLanguage

    function update(event: Event) {
      const changedLanguage = event instanceof CustomEvent && isAppLanguage(event.detail) ? event.detail : readLanguage()
      setLanguage(changedLanguage)
      document.documentElement.lang = changedLanguage
    }

    window.addEventListener("storage", update)
    window.addEventListener("invoice-language-change", update)

    return () => {
      window.removeEventListener("storage", update)
      window.removeEventListener("invoice-language-change", update)
    }
  }, [])

  const t = useMemo(() => {
    const selectedTranslations = appTranslations[language] as Record<TranslationKey, string>
    const fallbackTranslations = appTranslations[DEFAULT_LANGUAGE] as Record<TranslationKey, string>

    return (key: TranslationKey) => selectedTranslations[key] ?? fallbackTranslations[key]
  }, [language])

  return { language, setLanguage: setStoredLanguage, t }
}

export function translateStatus(status: string, t: (key: TranslationKey) => string) {
  if (status === "paid" || status === "Bezahlt" || status === "Paid") return t("status.paid")
  if (status === "open" || status === "Offen" || status === "Open") return t("status.open")
  if (status === "overdue" || status === "Ueberfaellig" || status === "Überfällig" || status === "Overdue") return t("status.overdue")
  if (status === "draft" || status === "Entwurf" || status === "Draft") return t("status.draft")
  if (status === "sent" || status === "Gesendet" || status === "Sent") return t("status.sent")

  return status
}
