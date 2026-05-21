export type DesktopProductTier = "standard" | "pro"
export type DesktopRuntimeMode = "development" | "production"

export type DesktopProductIdentity = {
  productName: string
  appId: string
  protocol: string
  tier: DesktopProductTier
}

export function createDesktopProductIdentity(identity: DesktopProductIdentity) {
  return identity
}

export const standardDesktopIdentity = createDesktopProductIdentity({
  productName: "Dream Invoice Desktop",
  appId: "com.dreaminvoice.desktop",
  protocol: "dream-invoice",
  tier: "standard"
})

export const proDesktopIdentity = createDesktopProductIdentity({
  productName: "Dream Invoice Pro Desktop",
  appId: "com.dreaminvoice.pro-desktop",
  protocol: "dream-invoice-pro",
  tier: "pro"
})

export const desktopCoreRuntime = standardDesktopIdentity
