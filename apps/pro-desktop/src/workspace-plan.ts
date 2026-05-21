import { defaultDesktopDataScope } from "@dream-invoice/desktop-data"
import { createDesktopServiceStatus } from "@dream-invoice/desktop-services"
import { createDesktopWorkspaceState } from "@dream-invoice/desktop-state"
import { createDesktopUiPreferences } from "@dream-invoice/desktop-ui"

export const proDesktopWorkspacePlan = {
  dataScope: defaultDesktopDataScope,
  services: createDesktopServiceStatus("idle"),
  state: createDesktopWorkspaceState("pro"),
  ui: createDesktopUiPreferences({ density: "comfortable" })
} as const
