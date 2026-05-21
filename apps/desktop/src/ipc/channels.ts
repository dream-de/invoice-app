export const desktopIpcChannels = {
  appReady: "desktop:app-ready",
  openExternal: "desktop:open-external",
  exportPdf: "documents:export-pdf",
  saveFile: "files:save",
  notify: "notifications:create",
  getSettings: "settings:get",
  setSettings: "settings:set"
} as const

export type DesktopIpcChannel = (typeof desktopIpcChannels)[keyof typeof desktopIpcChannels]
