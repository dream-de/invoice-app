export type DesktopReadinessArea = {
  id: string
  title: string
  status: "ready" | "planned" | "blocked"
  description: string
}

export const desktopReadinessAreas: DesktopReadinessArea[] = [
  {
    id: "shell",
    title: "Desktop shell",
    status: "ready",
    description: "Product identity, routes, window defaults and shell state are prepared."
  },
  {
    id: "ipc",
    title: "IPC contract",
    status: "ready",
    description: "Renderer-to-main channels are namespaced and typed before Electron wiring."
  },
  {
    id: "native-services",
    title: "Native services",
    status: "ready",
    description: "Download and notification plans are browser independent and can map to native APIs."
  },
  {
    id: "local-data",
    title: "Local data store",
    status: "planned",
    description: "SQLite and migrations stay planned until the web product foundation is stable."
  },
  {
    id: "packaging",
    title: "Packaging and updates",
    status: "planned",
    description: "Installer, code signing and update channels come after the first working Electron shell."
  }
]

export function listReadyDesktopAreas(areas: DesktopReadinessArea[] = desktopReadinessAreas) {
  return areas.filter((area) => area.status === "ready")
}

export function describeDesktopReadiness(areas: DesktopReadinessArea[] = desktopReadinessAreas) {
  const ready = listReadyDesktopAreas(areas).length
  return ready + "/" + areas.length + " desktop foundation areas ready"
}
