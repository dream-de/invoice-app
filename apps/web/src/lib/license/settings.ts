import { getUserLimitStatus, type UserLimitStatus } from "./limits"
import { FREE_USER_LIMIT } from "./plans"

function getFallbackLicenseSettingsSummary(): UserLimitStatus {
  return {
    activeUsers: 0,
    maxUsers: FREE_USER_LIMIT,
    remainingUsers: FREE_USER_LIMIT,
    limitReached: false,
    plan: "free",
    billingCycle: "free",
    status: "unconfigured",
    validUntil: null
  }
}

export async function getLicenseSettingsSummary() {
  try {
    return await getUserLimitStatus()
  } catch (error) {
    console.warn("License settings summary unavailable, using fallback.", error)
    return getFallbackLicenseSettingsSummary()
  }
}
