export type ProDesktopProductProfile = {
  productName: string
  appId: string
  tier: "pro"
  runtime: "planned"
  includesAccountingWorkspace: boolean
}

export const proDesktopProductProfile: ProDesktopProductProfile = {
  productName: "Dream Invoice Pro Desktop",
  appId: "com.dreaminvoice.pro-desktop",
  tier: "pro",
  runtime: "planned",
  includesAccountingWorkspace: true
}

export function describeProDesktopProduct(profile: ProDesktopProductProfile = proDesktopProductProfile) {
  return profile.productName + " (" + profile.tier + ", " + profile.runtime + ")"
}
