import { PremiumWorkspacePage } from "./PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "./routeSearch"

export default async function DashboardV2Page({ searchParams }: DashboardV2SearchPageProps) {
  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return <PremiumWorkspacePage view="dashboard" initialSearchQuery={query} initialTheme={theme} />
}
