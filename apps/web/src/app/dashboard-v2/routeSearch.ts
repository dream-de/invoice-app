export type DashboardV2SearchPageProps = {
  searchParams?: Promise<{
    q?: string | string[]
  }>
}

export async function searchQueryFromParams(searchParams?: DashboardV2SearchPageProps["searchParams"]) {
  const params = await searchParams
  const query = Array.isArray(params?.q) ? params.q[0] : params?.q
  return query || ""
}
