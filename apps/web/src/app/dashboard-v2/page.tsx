import { PremiumWorkspacePage } from "./PremiumWorkspace"

type DashboardV2PageProps = {
  searchParams?: Promise<{
    q?: string | string[]
  }>
}

export default async function DashboardV2Page({ searchParams }: DashboardV2PageProps) {
  const params = await searchParams
  const query = Array.isArray(params?.q) ? params?.q[0] : params?.q

  return <PremiumWorkspacePage view="dashboard" initialSearchQuery={query || ""} />
}
