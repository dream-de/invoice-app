import { getEnabledFeatures, licensePlanLabels } from "@invoice-platform/licensing"

export const webProAppProfile = {
  id: "web-pro",
  label: "Dream Invoice Web Pro",
  plan: "pro",
  planLabel: licensePlanLabels.pro,
  enabledFeatures: getEnabledFeatures("pro")
} as const
