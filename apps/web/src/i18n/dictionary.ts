import deCommon from "./locales/de/common.json"
import enCommon from "./locales/en/common.json"
import frCommon from "./locales/fr/common.json"
import esCommon from "./locales/es/common.json"
import deNavigation from "./locales/de/navigation.json"
import enNavigation from "./locales/en/navigation.json"
import frNavigation from "./locales/fr/navigation.json"
import esNavigation from "./locales/es/navigation.json"
import deDashboard from "./locales/de/dashboard.json"
import enDashboard from "./locales/en/dashboard.json"
import frDashboard from "./locales/fr/dashboard.json"
import esDashboard from "./locales/es/dashboard.json"
import deCustomers from "./locales/de/customers.json"
import enCustomers from "./locales/en/customers.json"
import frCustomers from "./locales/fr/customers.json"
import esCustomers from "./locales/es/customers.json"
import deProjects from "./locales/de/projects.json"
import enProjects from "./locales/en/projects.json"
import frProjects from "./locales/fr/projects.json"
import esProjects from "./locales/es/projects.json"
import deArticles from "./locales/de/articles.json"
import enArticles from "./locales/en/articles.json"
import frArticles from "./locales/fr/articles.json"
import esArticles from "./locales/es/articles.json"
import deDocuments from "./locales/de/documents.json"
import enDocuments from "./locales/en/documents.json"
import frDocuments from "./locales/fr/documents.json"
import esDocuments from "./locales/es/documents.json"
import deFinance from "./locales/de/finance.json"
import enFinance from "./locales/en/finance.json"
import frFinance from "./locales/fr/finance.json"
import esFinance from "./locales/es/finance.json"
import deSettings from "./locales/de/settings.json"
import enSettings from "./locales/en/settings.json"
import frSettings from "./locales/fr/settings.json"
import esSettings from "./locales/es/settings.json"
import deTemplates from "./locales/de/templates.json"
import enTemplates from "./locales/en/templates.json"
import frTemplates from "./locales/fr/templates.json"
import esTemplates from "./locales/es/templates.json"
import deValidation from "./locales/de/validation.json"
import enValidation from "./locales/en/validation.json"
import frValidation from "./locales/fr/validation.json"
import esValidation from "./locales/es/validation.json"
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
  },
  fr: {
    ...frCommon,
    ...frNavigation,
    ...frDashboard,
    ...frCustomers,
    ...frProjects,
    ...frArticles,
    ...frDocuments,
    ...frFinance,
    ...frSettings,
    ...frTemplates,
    ...frValidation
  },
  es: {
    ...esCommon,
    ...esNavigation,
    ...esDashboard,
    ...esCustomers,
    ...esProjects,
    ...esArticles,
    ...esDocuments,
    ...esFinance,
    ...esSettings,
    ...esTemplates,
    ...esValidation
  }
} as const

export const legacyDomTranslations = {
  en: enLegacyDom
} as const

export type TranslationKey = keyof typeof appTranslations.de
