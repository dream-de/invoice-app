import { PremiumWorkspacePage } from "../../PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../../routeSearch"

export default async function BankConnectRoutePage({ searchParams }: DashboardV2SearchPageProps) {
  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return <PremiumWorkspacePage view="finance-bank-connect" initialSearchQuery={query} initialTheme={theme} />
}
