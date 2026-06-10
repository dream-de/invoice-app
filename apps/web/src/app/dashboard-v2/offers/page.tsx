import { PremiumWorkspacePage } from "../PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../routeSearch"

export default async function PremiumOffersPage({ searchParams }: DashboardV2SearchPageProps) {
  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return <PremiumWorkspacePage view="offers" initialSearchQuery={query} initialTheme={theme} />
}
