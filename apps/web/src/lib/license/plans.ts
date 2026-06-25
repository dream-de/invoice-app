export type LicensePlanKey =
  | "free"
  | "starter"
  | "pro"
  | "team"
  | "business"
  | "enterprise"
  | "unlimited"

export type LicensePlan = {
  key: LicensePlanKey
  name: string
  maxUsers: number | null
  billing: string
  note: string
}

export const FREE_USER_LIMIT = 5

export const licensePlans: LicensePlan[] = [
  {
    key: "free",
    name: "Free",
    maxUsers: FREE_USER_LIMIT,
    billing: "Kostenlos",
    note: "Inklusive Admin"
  },
  {
    key: "starter",
    name: "Starter",
    maxUsers: 10,
    billing: "Monatlich / Jaehrlich",
    note: "Plan + Marketplace"
  },
  {
    key: "pro",
    name: "Pro",
    maxUsers: 15,
    billing: "Monatlich / Jaehrlich",
    note: "Plan + Marketplace"
  },
  {
    key: "team",
    name: "Team",
    maxUsers: 25,
    billing: "Monatlich / Jaehrlich",
    note: "Plan + Marketplace"
  },
  {
    key: "business",
    name: "Business",
    maxUsers: 50,
    billing: "Monatlich / Jaehrlich",
    note: "Plan + Marketplace"
  },
  {
    key: "enterprise",
    name: "Enterprise",
    maxUsers: 100,
    billing: "Individuell",
    note: "Plan + Marketplace"
  },
  {
    key: "unlimited",
    name: "Unlimited",
    maxUsers: null,
    billing: "Individuell",
    note: "Sondervertrag"
  }
]

export function formatPlanUsers(maxUsers: number | null) {
  return maxUsers === null ? "Unlimitiert" : String(maxUsers)
}

export function getFallbackPlan() {
  return licensePlans[0]
}

export function getPlanByKey(key: string | null | undefined) {
  return licensePlans.find((plan) => plan.key === key) ?? getFallbackPlan()
}
