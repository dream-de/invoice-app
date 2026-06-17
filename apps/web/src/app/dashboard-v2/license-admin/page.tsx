import { redirect } from "next/navigation"
import { isLicenseAdminEnabled } from "@/lib/license/admin"
import { PremiumWorkspacePage } from "../PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../routeSearch"

export default async function PremiumLicenseAdminPage({ searchParams }: DashboardV2SearchPageProps) {
  if (!isLicenseAdminEnabled()) redirect("/dashboard-v2/license")

  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return <PremiumWorkspacePage view="license-admin" initialSearchQuery={query} initialTheme={theme} licenseAdminEnabled />
}
