import { prisma } from "@invoice-platform/database"
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

  if (status.limitReached) {
    throw new Error(
      `Benutzerlimit erreicht (${status.activeUsers}/${status.maxUsers}). Bitte Lizenz erweitern.`
    )
  }

  return status
}
