import { PremiumWorkspacePage } from "../PremiumWorkspace"
import { type DashboardV2SearchPageProps, searchQueryFromParams } from "../routeSearch"

export default async function PremiumReportsPage({ searchParams }: DashboardV2SearchPageProps) {
  const query = await searchQueryFromParams(searchParams)

  return <PremiumWorkspacePage view="reports" initialSearchQuery={query} />
}
