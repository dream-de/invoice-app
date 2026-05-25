import type { LicenseFeature } from "./features"
import type { LicensePlan } from "./plans"

export type LicenseEntitlements = Readonly<Record<LicensePlan, readonly LicenseFeature[]>>

const freeFeatures = ["invoices", "customers", "articles", "pdfExport", "templates", "demoData"] as const

const proFeatures = [
  ...freeFeatures,
  "desktopShell",
  "desktopOffline",
  "eInvoice",
  "datevExport",
  "financeAutomation",
  "recurringInvoices",
  "dunning"
] as const

const enterpriseFeatures = [
  ...proFeatures,
  "multiCompany",
  "teamUsers",
  "auditLog",
  "apiAccess",
  "prioritySupport"
] as const

export const licenseEntitlements: LicenseEntitlements = {
  free: freeFeatures,
  starter: freeFeatures,
  pro: proFeatures,
  team: proFeatures,
  business: proFeatures,
  enterprise: enterpriseFeatures,
  unlimited: enterpriseFeatures
}

export function getEnabledFeatures(plan: LicensePlan): readonly LicenseFeature[] {
  return licenseEntitlements[plan]
}

export function isFeatureEnabled(plan: LicensePlan, feature: LicenseFeature): boolean {
  return licenseEntitlements[plan].includes(feature)
}
