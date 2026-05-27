import { redirect } from "next/navigation"
import { getCurrentUser, type SessionUser } from "@/lib/auth/service"
import { getEffectivePermissionKeys } from "@/lib/users/permissions"

export function hasUserPermission(user: SessionUser, scope: string, action: string) {
  return getEffectivePermissionKeys(user.role, user.permissions).has(`${scope}:${action}`)
}

export async function requirePagePermission(scope: string, action: string) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (!hasUserPermission(user, scope, action)) redirect("/dashboard")
  return user
}
