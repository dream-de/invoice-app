import { PremiumWorkspacePage } from "../../../../../../../web/src/app/dashboard-v2/PremiumWorkspace"
import {
  type DashboardV2SearchPageProps,
  dashboardV2ParamsFromSearchParams
} from "../../../../../../../web/src/app/dashboard-v2/routeSearch"

export default async function WebProLicenseBillingUsageLimitsPage({ searchParams }: DashboardV2SearchPageProps) {
  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return (
    <PremiumWorkspacePage
      view="settings"
      settingsSection="license-billing"
      initialSearchQuery={query || "Nutzung & Limits"}
      initialTheme={theme}
    />
  )
}
