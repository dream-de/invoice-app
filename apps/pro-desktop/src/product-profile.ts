import { proDesktopIdentity } from "@dream-invoice/desktop-core"

export type ProDesktopProductProfile = {
  productName: string
  appId: string
  protocol: string
  tier: "pro"
  runtime: "planned"
  includesAccountingWorkspace: boolean
}

export const proDesktopProductProfile: ProDesktopProductProfile = {
  productName: proDesktopIdentity.productName,
  appId: proDesktopIdentity.appId,
  protocol: proDesktopIdentity.protocol,
  tier: "pro",
  runtime: "planned",
  includesAccountingWorkspace: true
}

export function describeProDesktopProduct(profile: ProDesktopProductProfile = proDesktopProductProfile) {
  return profile.productName + " (" + profile.tier + ", " + profile.runtime + ")"
}
