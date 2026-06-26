import { notFound, redirect } from "next/navigation"
import { PremiumWorkspacePage } from "../../PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../../routeSearch"
import { isPremiumSettingsSection, type PremiumSettingsSection } from "../sectionMap"

export default async function PremiumSettingsSectionPage({
  params,
  searchParams
}: DashboardV2SearchPageProps & { params: Promise<{ section: string }> }) {
  const { section } = await params
  const normalizedSection = section === "mandant" || section === "mandanten" ? "tenants" : section

  if (normalizedSection === "users-roles" || normalizedSection === "tenants") redirect("/dashboard-v2/settings/users")
  if (normalizedSection === "audit" || normalizedSection === "audit-logs") redirect("/dashboard-v2/settings/logs-monitoring")
  if (normalizedSection === "add-ons") redirect("/dashboard-v2/settings/api")
  if (!isPremiumSettingsSection(normalizedSection)) notFound()

  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return (
    <PremiumWorkspacePage
      view="settings"
      settingsSection={normalizedSection as PremiumSettingsSection}
      initialSearchQuery={query}
      initialTheme={theme}
    />
  )
}
