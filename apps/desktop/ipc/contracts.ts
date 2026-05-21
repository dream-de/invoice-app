import { desktopIpcChannels } from "./channels"

export type DesktopFileSaveRequest = {
  suggestedName: string
  mimeType: string
  bytes: Uint8Array
}

export type DesktopPdfExportRequest = {
  documentId: string
  fileName: string
}

export type DesktopNotificationRequest = {
  title: string
  body: string
  tone?: "info" | "success" | "warning" | "danger"
}

export type DesktopSettingsSnapshot = {
  language: "de" | "en"
  theme: "system" | "light" | "dark"
}

export type DesktopIpcRequestMap = {
  [desktopIpcChannels.appReady]: void
  [desktopIpcChannels.openExternal]: { url: string }
  [desktopIpcChannels.exportPdf]: DesktopPdfExportRequest
  [desktopIpcChannels.saveFile]: DesktopFileSaveRequest
  [desktopIpcChannels.notify]: DesktopNotificationRequest
  [desktopIpcChannels.getSettings]: void
  [desktopIpcChannels.setSettings]: DesktopSettingsSnapshot
}

export type DesktopIpcResponseMap = {
  [desktopIpcChannels.appReady]: { ok: true }
  [desktopIpcChannels.openExternal]: { ok: true }
  [desktopIpcChannels.exportPdf]: { ok: true; path?: string }
  [desktopIpcChannels.saveFile]: { ok: true; path?: string }
  [desktopIpcChannels.notify]: { ok: true }
  [desktopIpcChannels.getSettings]: DesktopSettingsSnapshot
  [desktopIpcChannels.setSettings]: { ok: true }
}
