import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

function amount(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, projects: 0, active: 0, trackedHours: 0, invoicedHours: 0, openHours: 0, revenue: 0, utilization: 0, mode: "demo" })
  }

  try {
    const projects = await prisma.project.findMany({
      select: {
        status: true,
        budget: true,
        invoices: { select: { grossTotal: true } },
        timeEntries: { select: { hours: true, billingStatus: true } },
        invoicePositions: { select: { hours: true } }
      }
    })

    const trackedHours = projects.reduce((sum, project) => (
      sum + project.timeEntries.reduce((entrySum, entry) => entrySum + amount(entry.hours), 0)
    ), 0)
    const invoicedHours = projects.reduce((sum, project) => {
      const fromPositions = project.invoicePositions.reduce((positionSum, position) => positionSum + amount(position.hours), 0)
      const fromEntries = project.timeEntries.filter((entry) => entry.billingStatus === "invoiced").reduce((entrySum, entry) => entrySum + amount(entry.hours), 0)
      return sum + (fromPositions || fromEntries)
    }, 0)
    const revenue = projects.reduce((sum, project) => (
      sum + project.invoices.reduce((invoiceSum, invoice) => invoiceSum + amount(invoice.grossTotal), 0)
    ), 0)
    const budget = projects.reduce((sum, project) => sum + amount(project.budget), 0)

    return NextResponse.json({
      ok: true,
      projects: projects.length,
      active: projects.filter((project) => project.status === "active" || project.status === "Aktiv").length,
      trackedHours,
      invoicedHours,
      openHours: Math.max(0, trackedHours - invoicedHours),
      revenue,
      utilization: budget > 0 ? Math.min(100, Math.round((revenue / budget) * 100)) : 0
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, projects: 0, active: 0, trackedHours: 0, invoicedHours: 0, openHours: 0, revenue: 0, utilization: 0 }, { status: 500 })
  }
}
