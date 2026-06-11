import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../../routeSearch"
import { PremiumInvoiceEditor } from "./PremiumInvoiceEditor"

export default async function PremiumInvoiceNewPage({ searchParams }: DashboardV2SearchPageProps) {
  const { theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return <PremiumInvoiceEditor initialTheme={theme ?? "light"} />
}
