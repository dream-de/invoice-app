import { createLicenseSnapshot, getEnabledFeatures, licensePlanLabels } from "@dream-invoice/licensing"

export const desktopLicenseProfile = {
  appId: "desktop",
  plan: "free",
  planLabel: licensePlanLabels.free,
  snapshot: createLicenseSnapshot("free"),
  enabledFeatures: getEnabledFeatures("free")
} as const
