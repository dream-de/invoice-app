export type DesktopServiceStatus = "idle" | "running" | "failed"

export function createDesktopServiceStatus(status: DesktopServiceStatus = "idle") {
  return { status }
}
