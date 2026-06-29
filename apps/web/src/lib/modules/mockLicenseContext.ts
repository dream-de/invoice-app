import { defaultFeatureFlags } from "./featureFlags"
import type { ModuleEngineContext } from "./moduleEngine"

const allExtensions = [
  "open_banking",
  "datev",
  "ocr",
  "warehouse",
  "shopify",
  "woocommerce",
  "nextcloud",
  "paperless_ngx",
  "google_drive",
  "openai",
  "whatsapp",
  "slack",
  "microsoft_teams"
]

export const freeModuleContext: ModuleEngineContext = {
  plan: "free",
  installedExtensions: [],
  featureFlags: { ...defaultFeatureFlags },
  licenseStatus: "active",
  userPermissions: ["settings.read"]
}

export const businessModuleContext: ModuleEngineContext = {
  plan: "business",
  installedExtensions: [],
  featureFlags: {
    ...defaultFeatureFlags,
    "open_banking.enabled": true,
    "open_banking.payment_matching": true
  },
  licenseStatus: "active",
  userPermissions: ["settings.read", "api.read"]
}

export const enterpriseModuleContext: ModuleEngineContext = {
  plan: "enterprise",
  installedExtensions: [],
  featureFlags: {
    ...defaultFeatureFlags,
    "open_banking.enabled": true,
    "open_banking.bank_sync": true,
    "open_banking.payment_matching": true,
    "open_banking.bank_rules": true,
    "open_banking.cashflow_forecast": true,
    "advanced_audit_logs.enabled": true
  },
  licenseStatus: "active",
  userPermissions: ["*"]
}

export const businessDatevModuleContext: ModuleEngineContext = {
  ...businessModuleContext,
  installedExtensions: ["datev"],
  featureFlags: {
    ...businessModuleContext.featureFlags,
    "datev.enabled": true
  }
}

export const businessOcrModuleContext: ModuleEngineContext = {
  ...businessModuleContext,
  installedExtensions: ["ocr"],
  featureFlags: {
    ...businessModuleContext.featureFlags,
    "ocr.enabled": true
  }
}

export const enterpriseAllExtensionsModuleContext: ModuleEngineContext = {
  ...enterpriseModuleContext,
  installedExtensions: allExtensions,
  featureFlags: Object.fromEntries(Object.keys(defaultFeatureFlags).map((key) => [key, true]))
}

export const expiredModuleContext: ModuleEngineContext = {
  ...businessModuleContext,
  licenseStatus: "expired"
}

export const mockModuleContexts = {
  free: freeModuleContext,
  business: businessModuleContext,
  enterprise: enterpriseModuleContext,
  businessDatev: businessDatevModuleContext,
  businessOcr: businessOcrModuleContext,
  enterpriseAllExtensions: enterpriseAllExtensionsModuleContext,
  expired: expiredModuleContext
} as const
