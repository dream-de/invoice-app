export { desktopProductProfile, describeDesktopProduct } from "./product-profile"
export type { DesktopProductProfile, DesktopRuntime } from "./product-profile"

export { desktopRoutes, findDesktopRoute } from "./router"
export type { DesktopRoute, DesktopRouteId } from "./router"

export { desktopIpcChannels } from "./ipc/channels"
export type { DesktopIpcChannel } from "./ipc/channels"
export type {
  DesktopFileSaveRequest,
  DesktopIpcRequestMap,
  DesktopIpcResponseMap,
  DesktopNotificationRequest,
  DesktopPdfExportRequest,
  DesktopSettingsSnapshot
} from "./ipc/contracts"

export {
  canOpenDesktopRoute,
  createDesktopShellState,
  initialDesktopShellState
} from "./state/shell-state"
export type { DesktopShellState } from "./state/shell-state"
