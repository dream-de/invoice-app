import { desktopProductProfile } from "../src/product-profile"
import { desktopPreloadApi } from "./preload-api"
import { desktopWindowOptions } from "./window-options"

export type DesktopMainProcessPlan = {
  runtime: "electron"
  appId: string
  protocol: string
  singleInstanceLock: boolean
  window: typeof desktopWindowOptions
  preloadNamespace: typeof desktopPreloadApi.namespace
}

export const desktopMainProcessPlan: DesktopMainProcessPlan = {
  runtime: "electron",
  appId: desktopProductProfile.appId,
  protocol: desktopProductProfile.protocol,
  singleInstanceLock: true,
  window: desktopWindowOptions,
  preloadNamespace: desktopPreloadApi.namespace
}

export function describeDesktopMainProcess(plan: DesktopMainProcessPlan = desktopMainProcessPlan) {
  return plan.appId + " via " + plan.runtime + " (" + plan.preloadNamespace + ")"
}
