import { redirect } from "next/navigation"
import { prisma } from "@dream-invoice/database"
import { requireCurrentUser } from "@/lib/auth/service"
import { AccountSecurityClient } from "./AccountSecurityClient"

export const dynamic = "force-dynamic"

export default async function AccountSecurityPage() {
  let current
  try {
    current = await requireCurrentUser()
  } catch {
    redirect("/login?next=/account/security")
  }

  const user = await prisma.user.findUnique({ where: { id: current.id } })
  if (!user) redirect("/login")

  return (
    <AccountSecurityClient
      initialProfile={{
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: Boolean(user.emailVerifiedAt),
        twoFactorEnabled: Boolean(user.twoFactorEnabledAt),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null
      }}
    />
  )
}
