import { enforceUserLimit } from "@dream-invoice/licensing/signed-license"
import { prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"
import { FREE_USER_LIMIT } from "./plans"

export type UserLimitStatus = {
  activeUsers: number
  maxUsers: number
  remainingUsers: number
  limitReached: boolean
  plan: string
  billingCycle: string
  status: string
  validUntil: Date | null
}

export async function getUserLimitStatus(): Promise<UserLimitStatus> {
  if (isDemoMode()) {
    return {
      activeUsers: 1,
      maxUsers: 1,
      remainingUsers: 0,
      limitReached: true,
      plan: "demo",
      billingCycle: "demo",
      status: "active",
      validUntil: null
    }
  }

  const now = new Date()

  const [activeUsers, license] = await Promise.all([
    prisma.user.count({
      where: { status: "active" }
    }),
    prisma.license.findFirst({
      where: {
        status: "active",
        OR: [{ validUntil: null }, { validUntil: { gte: now } }]
      },
      orderBy: { updatedAt: "desc" }
    })
  ])

  const maxUsers = license?.maxUsers ?? FREE_USER_LIMIT
  const remainingUsers = Math.max(maxUsers - activeUsers, 0)

  return {
    activeUsers,
    maxUsers,
    remainingUsers,
    limitReached: activeUsers >= maxUsers,
    plan: license?.plan ?? "free",
    billingCycle: license?.billingCycle ?? "free",
    status: license?.status ?? "active",
    validUntil: license?.validUntil ?? null
  }
}

export async function assertCanCreateUser() {
  const status = await getUserLimitStatus()

  enforceUserLimit(status.activeUsers, status.maxUsers)

  return status
}
