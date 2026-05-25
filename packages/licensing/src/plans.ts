export const licensePlans = ["free", "starter", "pro", "team", "business", "enterprise", "unlimited"] as const

export type LicensePlan = (typeof licensePlans)[number]

export const defaultLicensePlan: LicensePlan = "free"

export const licensePlanLabels: Record<LicensePlan, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  team: "Team",
  business: "Business",
  enterprise: "Enterprise",
  unlimited: "Unlimited"
}

export function isLicensePlan(value: string): value is LicensePlan {
  return licensePlans.includes(value as LicensePlan)
}
