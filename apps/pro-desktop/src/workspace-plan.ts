import { defaultDesktopDataScope } from "@invoice-platform/desktop-data"
import { createDesktopServiceStatus } from "@invoice-platform/desktop-services"
import { createDesktopWorkspaceState } from "@invoice-platform/desktop-state"
import { createDesktopUiPreferences } from "@invoice-platform/desktop-ui"

export const proDesktopWorkspacePlan = {
  dataScope: defaultDesktopDataScope,
  services: createDesktopServiceStatus("idle"),
  state: createDesktopWorkspaceState("pro"),
  ui: createDesktopUiPreferences({ density: "comfortable" })
} as const
