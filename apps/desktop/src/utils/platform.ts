export type DesktopPlatform = "darwin" | "linux" | "win32"

export function normalizeDesktopPlatform(platform: string): DesktopPlatform | "unsupported" {
  if (platform === "darwin" || platform === "linux" || platform === "win32") return platform
  return "unsupported"
}

export function isSupportedDesktopPlatform(platform: string) {
  return normalizeDesktopPlatform(platform) !== "unsupported"
}
