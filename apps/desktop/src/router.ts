export type DesktopRouteId =
  | "dashboard"
  | "customers"
  | "projects"
  | "documents"
  | "finance"
  | "articles"
  | "settings"

export type DesktopRoute = {
  id: DesktopRouteId
  path: string
  label: string
  requiresOnline: boolean
}

export const desktopRoutes: DesktopRoute[] = [
  { id: "dashboard", path: "/dashboard", label: "Dashboard", requiresOnline: false },
  { id: "customers", path: "/customers", label: "Customers", requiresOnline: false },
  { id: "projects", path: "/projects", label: "Projects", requiresOnline: false },
  { id: "documents", path: "/documents", label: "Documents", requiresOnline: false },
  { id: "finance", path: "/finance", label: "Finance", requiresOnline: true },
  { id: "articles", path: "/articles", label: "Articles", requiresOnline: false },
  { id: "settings", path: "/settings", label: "Settings", requiresOnline: false }
]

export function findDesktopRoute(path: string) {
  return desktopRoutes.find((route) => route.path === path)
}
