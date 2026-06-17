import { redirect } from "next/navigation"
import { prisma } from "@dream-invoice/database"
import { requireCurrentUser } from "@/lib/auth/service"
import { isDemoMode } from "@/lib/demo-mode"
import { type DashboardV2SearchPageProps, dashboardV2ParamsFromSearchParams } from "../../routeSearch"
import { PremiumWorkspacePage } from "../../PremiumWorkspace"

export const dynamic = "force-dynamic"

export default async function DashboardAccountSecurityPage({ searchParams }: DashboardV2SearchPageProps) {
  let current
  try {
    current = await requireCurrentUser()
  } catch {
    redirect("/login?next=/dashboard-v2/account/security")
  }

  const user = isDemoMode()
    ? {
        ...current,
        emailVerifiedAt: null,
        twoFactorEnabledAt: null,
        lastLoginAt: null
      }
    : await prisma.user.findUnique({ where: { id: current.id } })

  if (!user) redirect("/login")

  const { query, theme } = await dashboardV2ParamsFromSearchParams(searchParams)

  return (
    <PremiumWorkspacePage
      view="account-security"
      initialSearchQuery={query}
      initialTheme={theme}
      accountSecurityInitialProfile={{
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
