import { PremiumWorkspacePage } from "../../PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../../routeSearch"

type IntegrationDetailPageProps = DashboardV2SearchPageProps & {
  params: Promise<{ key: string }>
}

export default async function IntegrationDetailPage({ params, searchParams }: IntegrationDetailPageProps) {
  const [{ key }, { query, theme }] = await Promise.all([params, dashboardV2ParamsFromSearchParams(searchParams)])
  const initialQuery = query || key

  return <PremiumWorkspacePage view="integrations" initialSearchQuery={initialQuery} initialTheme={theme} />
}
