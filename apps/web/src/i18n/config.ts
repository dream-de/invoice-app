export const LANGUAGE_STORAGE_KEY = "dream-invoice-language"
export const DEFAULT_LANGUAGE = "de"

export const supportedLanguages = [
  { code: "de", label: "Deutsch", description: "Deutsche Oberflaeche und Standardtexte." },
  { code: "en", label: "English", description: "English interface texts for international users." }
] as const

export type AppLanguage = (typeof supportedLanguages)[number]["code"]

export function isAppLanguage(value: string | null): value is AppLanguage {
  return supportedLanguages.some((language) => language.code === value)
}
