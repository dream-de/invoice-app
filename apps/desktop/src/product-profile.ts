import { standardDesktopIdentity } from "@invoice-platform/desktop-core"
import { desktopContractNamespace } from "@invoice-platform/desktop-contracts"

export type DesktopRuntime = "planned" | "electron"

export type DesktopProductProfile = {
  productName: string
  appId: string
  protocol: string
  preloadNamespace: typeof desktopContractNamespace
  runtime: DesktopRuntime
  window: {
    minWidth: number
    minHeight: number
    defaultWidth: number
    defaultHeight: number
  }
}

export const desktopProductProfile: DesktopProductProfile = {
  productName: standardDesktopIdentity.productName,
  appId: standardDesktopIdentity.appId,
  protocol: standardDesktopIdentity.protocol,
  preloadNamespace: desktopContractNamespace,
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
