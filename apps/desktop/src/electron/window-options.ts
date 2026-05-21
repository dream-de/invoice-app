import { desktopProductProfile } from "../product-profile"

export type DesktopWindowOptions = {
  title: string
  width: number
  height: number
  minWidth: number
  minHeight: number
  backgroundColor: string
  showWhenReady: boolean
  preloadScript: string
}

export const desktopWindowOptions: DesktopWindowOptions = {
  title: desktopProductProfile.productName,
  width: desktopProductProfile.window.defaultWidth,
  height: desktopProductProfile.window.defaultHeight,
  minWidth: desktopProductProfile.window.minWidth,
  minHeight: desktopProductProfile.window.minHeight,
  backgroundColor: "#f4f7fb",
  showWhenReady: true,
  preloadScript: "dist/electron/preload.js"
}
