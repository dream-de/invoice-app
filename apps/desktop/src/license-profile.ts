import { createLicenseSnapshot, getEnabledFeatures, licensePlanLabels } from "@invoice-platform/licensing"

export const desktopLicenseProfile = {
  appId: "desktop",
  plan: "free",
  planLabel: licensePlanLabels.free,
  snapshot: createLicenseSnapshot("free"),
  enabledFeatures: getEnabledFeatures("free")
} as const
