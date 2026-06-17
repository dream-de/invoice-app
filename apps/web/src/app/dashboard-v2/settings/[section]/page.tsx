import { notFound } from "next/navigation"
import { PremiumWorkspacePage } from "../../PremiumWorkspace"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../../routeSearch"
import { isPremiumSettingsSection, type PremiumSettingsSection } from "../sectionMap"

export default async function PremiumSettingsSectionPage({
  params,
  searchParams
}: DashboardV2SearchPageProps & { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!isPremiumSettingsSection(section)) notFound()

  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return (
    <PremiumWorkspacePage
      view="settings"
      settingsSection={section as PremiumSettingsSection}
      initialSearchQuery={query}
      initialTheme={theme}
    />
  )
}
