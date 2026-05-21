import { desktopRoutes, type DesktopRouteId } from "../router"

export type DesktopShellState = {
  activeRoute: DesktopRouteId
  online: boolean
  pendingJobs: number
}

export const initialDesktopShellState: DesktopShellState = {
  activeRoute: "dashboard",
  online: true,
  pendingJobs: 0
}

export function createDesktopShellState(input: Partial<DesktopShellState> = {}): DesktopShellState {
  return {
    ...initialDesktopShellState,
    ...input
  }
}

export function canOpenDesktopRoute(routeId: DesktopRouteId, state: DesktopShellState) {
  const route = desktopRoutes.find((item) => item.id === routeId)
  if (!route) return false
  return !route.requiresOnline || state.online
}
