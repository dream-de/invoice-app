export type DesktopRuntime = "planned" | "electron"

export type DesktopProductProfile = {
  productName: string
  appId: string
  protocol: string
  runtime: DesktopRuntime
  window: {
    minWidth: number
    minHeight: number
    defaultWidth: number
    defaultHeight: number
  }
}

export const desktopProductProfile: DesktopProductProfile = {
  productName: "Dream Invoice Desktop",
  appId: "com.dreaminvoice.desktop",
  protocol: "dream-invoice",
  runtime: "planned",
  window: {
    minWidth: 1180,
    minHeight: 760,
    defaultWidth: 1440,
    defaultHeight: 920
  }
}

export function describeDesktopProduct(profile: DesktopProductProfile = desktopProductProfile) {
  return profile.productName + " (" + profile.runtime + ")"
}
