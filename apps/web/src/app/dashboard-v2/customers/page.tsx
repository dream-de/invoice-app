import { PremiumWorkspacePage } from "../PremiumWorkspace"
import { type DashboardV2SearchPageProps, searchQueryFromParams } from "../routeSearch"

export default async function PremiumCustomersPage({ searchParams }: DashboardV2SearchPageProps) {
  const query = await searchQueryFromParams(searchParams)

  return <PremiumWorkspacePage view="customers" initialSearchQuery={query} />
}
