export type DesktopUiDensity = "compact" | "comfortable"
export type DesktopUiTheme = "system" | "light" | "dark"

export const defaultDesktopUiDensity: DesktopUiDensity = "comfortable"
export const defaultDesktopUiTheme: DesktopUiTheme = "system"

export function createDesktopUiPreferences(input: Partial<{
  density: DesktopUiDensity
  theme: DesktopUiTheme
}> = {}) {
  return {
    density: input.density ?? defaultDesktopUiDensity,
    theme: input.theme ?? defaultDesktopUiTheme
  }
}
