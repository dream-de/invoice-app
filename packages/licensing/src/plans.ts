export const licensePlans = ["free", "pro", "enterprise"] as const

export type LicensePlan = (typeof licensePlans)[number]

export const defaultLicensePlan: LicensePlan = "free"

export const licensePlanLabels: Record<LicensePlan, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise"
}

export function isLicensePlan(value: string): value is LicensePlan {
  return licensePlans.includes(value as LicensePlan)
}
