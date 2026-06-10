import { PremiumWorkspacePage } from "../PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../routeSearch"

export default async function PremiumProjectsPage({ searchParams }: DashboardV2SearchPageProps) {
  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return <PremiumWorkspacePage view="projects" initialSearchQuery={query} initialTheme={theme} />
}
