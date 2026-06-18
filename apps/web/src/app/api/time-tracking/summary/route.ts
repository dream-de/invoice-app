import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function startOfUtcWeek(date: Date) {
  const day = date.getUTCDay() || 7
  return addDays(startOfUtcDay(date), 1 - day)
}

function startOfUtcMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

async function sumHours(from: Date, to: Date) {
  const result = await prisma.timeEntry.aggregate({
    where: { date: { gte: from, lt: to } },
    _sum: { hours: true }
  })
  return Number(result._sum.hours ?? 0)
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, today: 0, week: 0, month: 0, unbilled: 0, unbilledAmount: 0, mode: "demo" })
  }

  try {
    const now = new Date()
    const todayStart = startOfUtcDay(now)
    const tomorrowStart = addDays(todayStart, 1)
    const weekStart = startOfUtcWeek(now)
    const nextWeekStart = addDays(weekStart, 7)
    const monthStart = startOfUtcMonth(now)
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

    const [today, week, month, unbilled] = await Promise.all([
      sumHours(todayStart, tomorrowStart),
      sumHours(weekStart, nextWeekStart),
      sumHours(monthStart, nextMonthStart),
      prisma.timeEntry.aggregate({
        where: { billingStatus: "not_invoiced" },
        _sum: { amount: true },
        _count: { _all: true }
      })
    ])

    return NextResponse.json({
      ok: true,
      today,
      week,
      month,
      unbilled: unbilled._count._all,
      unbilledAmount: Number(unbilled._sum.amount ?? 0)
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, today: 0, week: 0, month: 0, unbilled: 0, unbilledAmount: 0 }, { status: 500 })
  }
}
