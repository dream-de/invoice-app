export { desktopProductProfile, describeDesktopProduct } from "./product-profile"
export type { DesktopProductProfile, DesktopRuntime } from "./product-profile"

export { desktopRoutes, findDesktopRoute } from "./router"
export type { DesktopRoute, DesktopRouteId } from "./router"

export { desktopIpcChannels } from "../ipc/channels"
export type { DesktopIpcChannel } from "../ipc/channels"
export type {
  DesktopFileSaveRequest,
  DesktopIpcRequestMap,
  DesktopIpcResponseMap,
  DesktopNotificationRequest,
  DesktopPdfExportRequest,
  DesktopSettingsSnapshot
} from "../ipc/contracts"

export {
  canOpenDesktopRoute,
  createDesktopShellState,
  initialDesktopShellState
} from "../state/shell-state"
export type { DesktopShellState } from "../state/shell-state"

export {
  describeDesktopMainProcess,
  desktopMainProcessPlan
} from "../electron/main-process"
export type { DesktopMainProcessPlan } from "../electron/main-process"
export { desktopPreloadApi } from "../electron/preload-api"
export type { DesktopPreloadApiMethod } from "../electron/preload-api"
export { desktopWindowOptions } from "../electron/window-options"
export type { DesktopWindowOptions } from "../electron/window-options"

export { createDesktopDownloadPlan } from "../services/download-service"
export type { DesktopDownloadKind, DesktopDownloadPlan } from "../services/download-service"
export { createDesktopNotificationPlan } from "../services/notification-service"
export type { DesktopNotificationPlan } from "../services/notification-service"

export { isSupportedDesktopPlatform, normalizeDesktopPlatform } from "../utils/platform"
export type { DesktopPlatform } from "../utils/platform"
