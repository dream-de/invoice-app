import { defaultLicensePlan, isLicensePlan, type LicensePlan } from "./plans"

export type LicenseStatus = "inactive" | "active" | "expired" | "invalid"

export type LicenseSnapshot = {
  plan: LicensePlan
  status: LicenseStatus
  licenseKey?: string
  activatedAt?: string
  expiresAt?: string
}

export const defaultLicenseSnapshot: LicenseSnapshot = {
  plan: defaultLicensePlan,
  status: "active"
}

export function normalizeLicensePlan(value: string | null | undefined): LicensePlan {
  if (!value) return defaultLicensePlan
  return isLicensePlan(value) ? value : defaultLicensePlan
}

export function createLicenseSnapshot(plan: LicensePlan, status: LicenseStatus = "active"): LicenseSnapshot {
  return { plan, status }
}

export function canUseLicensedFeatures(snapshot: LicenseSnapshot): boolean {
  return snapshot.status === "active"
}
