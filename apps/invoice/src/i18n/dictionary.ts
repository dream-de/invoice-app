import deCommon from "./locales/de/common.json"
import enCommon from "./locales/en/common.json"
import deNavigation from "./locales/de/navigation.json"
import enNavigation from "./locales/en/navigation.json"
import deDashboard from "./locales/de/dashboard.json"
import enDashboard from "./locales/en/dashboard.json"
import deCustomers from "./locales/de/customers.json"
import enCustomers from "./locales/en/customers.json"
import deProjects from "./locales/de/projects.json"
import enProjects from "./locales/en/projects.json"
import deArticles from "./locales/de/articles.json"
import enArticles from "./locales/en/articles.json"
import deDocuments from "./locales/de/documents.json"
import enDocuments from "./locales/en/documents.json"
import deFinance from "./locales/de/finance.json"
import enFinance from "./locales/en/finance.json"
import deSettings from "./locales/de/settings.json"
import enSettings from "./locales/en/settings.json"
import deTemplates from "./locales/de/templates.json"
import enTemplates from "./locales/en/templates.json"
import deValidation from "./locales/de/validation.json"
import enValidation from "./locales/en/validation.json"
import enLegacyDom from "./legacy-dom/en.json"

export const appTranslations = {
  de: {
    ...deCommon,
    ...deNavigation,
    ...deDashboard,
    ...deCustomers,
    ...deProjects,
    ...deArticles,
    ...deDocuments,
    ...deFinance,
    ...deSettings,
    ...deTemplates,
    ...deValidation
  },
  en: {
    ...enCommon,
    ...enNavigation,
    ...enDashboard,
    ...enCustomers,
    ...enProjects,
    ...enArticles,
    ...enDocuments,
    ...enFinance,
    ...enSettings,
    ...enTemplates,
    ...enValidation
  }
} as const

export const legacyDomTranslations = {
  en: enLegacyDom
} as const

export type TranslationKey = keyof typeof appTranslations.de
