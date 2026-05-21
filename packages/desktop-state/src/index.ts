export type DesktopPanelId = "navigation" | "workspace" | "properties"
export type DesktopWorkspaceMode = "standard" | "pro"

export const defaultDesktopPanels: DesktopPanelId[] = ["navigation", "workspace", "properties"]

export function createDesktopWorkspaceState(mode: DesktopWorkspaceMode = "standard") {
  return {
    mode,
    panels: defaultDesktopPanels,
    online: true
  }
}
