import { redirect } from "next/navigation"

import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../routeSearch"

export default async function TimeTrackingPage({ searchParams }: DashboardV2SearchPageProps) {
  const { theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  redirect(`/dashboard-v2/time?theme=${theme ?? "dark"}`)
}
