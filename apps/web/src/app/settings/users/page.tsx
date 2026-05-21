import { getLicenseSettingsSummary } from "@/lib/license/settings"
import { UsersAndPermissionsClient } from "./UsersAndPermissionsClient"

export const dynamic = "force-dynamic"

export default async function UsersAndPermissionsPage() {
  const licenseSummary = await getLicenseSettingsSummary()

  return (
    <UsersAndPermissionsClient
      licenseSummary={{
        ...licenseSummary,
        validUntil: licenseSummary.validUntil?.toISOString() ?? null
      }}
    />
  )
}
