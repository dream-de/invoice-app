import { getUserLimitStatus } from "./limits"

export async function getLicenseSettingsSummary() {
  return getUserLimitStatus()
}
