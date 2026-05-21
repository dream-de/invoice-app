import { desktopIpcChannels, type DesktopIpcChannel } from "../ipc/channels"

export type DesktopPreloadApiMethod =
  | "appReady"
  | "openExternal"
  | "exportPdf"
  | "saveFile"
  | "notify"
  | "getSettings"
  | "setSettings"

export const desktopPreloadApi = {
  namespace: "dreamInvoice",
  methods: {
    appReady: desktopIpcChannels.appReady,
    openExternal: desktopIpcChannels.openExternal,
    exportPdf: desktopIpcChannels.exportPdf,
    saveFile: desktopIpcChannels.saveFile,
    notify: desktopIpcChannels.notify,
    getSettings: desktopIpcChannels.getSettings,
    setSettings: desktopIpcChannels.setSettings
  } satisfies Record<DesktopPreloadApiMethod, DesktopIpcChannel>
} as const
