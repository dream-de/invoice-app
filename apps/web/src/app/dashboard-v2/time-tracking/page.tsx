import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../routeSearch"
import { TimeTrackingPageClient } from "./TimeTrackingPageClient"

export default async function TimeTrackingPage({ searchParams }: DashboardV2SearchPageProps) {
  const { theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return <TimeTrackingPageClient initialTheme={theme ?? "dark"} />
}
