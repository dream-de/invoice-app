import type { LicenseFeature } from "./features"
import type { LicensePlan } from "./plans"

export type LicenseEntitlements = Readonly<Record<LicensePlan, readonly LicenseFeature[]>>

export const licenseEntitlements: LicenseEntitlements = {
  free: ["invoices", "customers", "articles", "pdfExport", "templates", "demoData"],
  pro: [
    "invoices",
    "customers",
    "articles",
    "pdfExport",
    "templates",
    "demoData",
    "desktopShell",
    "desktopOffline",
    "eInvoice",
    "datevExport",
    "financeAutomation",
    "recurringInvoices",
    "dunning"
  ],
  enterprise: [
    "invoices",
    "customers",
    "articles",
    "pdfExport",
    "templates",
    "demoData",
    "desktopShell",
    "desktopOffline",
    "eInvoice",
    "datevExport",
    "financeAutomation",
    "recurringInvoices",
    "dunning",
    "multiCompany",
    "teamUsers",
    "auditLog",
    "apiAccess",
    "prioritySupport"
  ]
}

export function getEnabledFeatures(plan: LicensePlan): readonly LicenseFeature[] {
  return licenseEntitlements[plan]
}

export function isFeatureEnabled(plan: LicensePlan, feature: LicenseFeature): boolean {
  return licenseEntitlements[plan].includes(feature)
}
