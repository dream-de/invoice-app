import { PremiumWorkspacePage } from "../PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../routeSearch"

export default async function PremiumLicensePage({ searchParams }: DashboardV2SearchPageProps) {
  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return <PremiumWorkspacePage view="license" initialSearchQuery={query} initialTheme={theme} />
}
