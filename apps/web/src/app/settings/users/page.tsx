import { redirect } from "next/navigation"
import { requireCurrentUserRole } from "@/lib/auth/service"
import { getLicenseSettingsSummary } from "@/lib/license/settings"
import { listAppUsers, serializeAppUser } from "@/lib/users/service"
import { UsersAndPermissionsClient } from "./UsersAndPermissionsClient"

export const dynamic = "force-dynamic"

export default async function UsersAndPermissionsPage() {
  try {
    await requireCurrentUserRole(["admin"])
  } catch {
    redirect("/settings")
  }

  const [licenseSummary, users] = await Promise.all([
    getLicenseSettingsSummary(),
    listAppUsers()
  ])

  return (
    <UsersAndPermissionsClient
      initialUsers={users.map(serializeAppUser)}
      initialLimit={{
        ...licenseSummary,
        validUntil: licenseSummary.validUntil?.toISOString() ?? null
      }}
    />
  )
}
