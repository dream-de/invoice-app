import { getEnabledFeatures, licensePlanLabels } from "@invoice-platform/licensing"

export const webAppProfile = {
  id: "web",
  label: "Dream Invoice Web",
  plan: "free",
  planLabel: licensePlanLabels.free,
  enabledFeatures: getEnabledFeatures("free")
} as const
