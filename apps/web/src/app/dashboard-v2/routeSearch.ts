export type DashboardV2SearchPageProps = {
  searchParams?: Promise<{
    q?: string | string[]
    theme?: string | string[]
  }>
}

export type DashboardV2ThemeMode = "dark" | "light"

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value
}

function themeModeFromValue(value?: string | string[]): DashboardV2ThemeMode | undefined {
  const theme = firstParam(value)
  return theme === "light" || theme === "dark" ? theme : undefined
}

export async function searchQueryFromParams(searchParams?: DashboardV2SearchPageProps["searchParams"]) {
  const params = await searchParams
  const query = firstParam(params?.q)
  return query || ""
}

export async function dashboardV2ParamsFromSearchParams(searchParams?: DashboardV2SearchPageProps["searchParams"]) {
  const params = await searchParams
  const query = firstParam(params?.q) || ""
  const theme = themeModeFromValue(params?.theme)
  return { query, theme }
}
