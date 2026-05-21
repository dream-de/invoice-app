import { createLicenseSnapshot, getEnabledFeatures, licensePlanLabels } from "@dream-invoice/licensing"

export const proDesktopLicenseProfile = {
  appId: "pro-desktop",
  plan: "pro",
  planLabel: licensePlanLabels.pro,
  snapshot: createLicenseSnapshot("pro"),
  enabledFeatures: getEnabledFeatures("pro")
} as const
