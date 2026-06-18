import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { projects as fallbackProjects } from "@/data/invoice-data"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

function numberValue(value: unknown) {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatBudget(value: unknown) {
  return numberValue(value).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR"
}

function statusLabel(status: string | null | undefined) {
  if (status === "planned") return "Geplant"
  if (status === "active") return "Aktiv"
  if (status === "paused") return "Pausiert"
  if (status === "completed") return "Abgeschlossen"
  return status || "Aktiv"
}

function fallbackProjectRows() {
  return fallbackProjects.map((project, index) => ({
    id: project.id,
    code: `PR-${String(index + 1).padStart(4, "0")}`,
    name: project.name,
    customerId: null,
    customer: project.customer,
    status: project.status,
    description: "",
    startDate: null,
    endDate: null,
    budgetAmount: numberValue(String(project.budget).replace(/[^\d,.-]/g, "").replace(",", ".")),
    budget: project.budget,
    hourlyRate: null,
    trackedHours: 0,
    invoicedHours: 0,
    openHours: 0,
    revenue: 0,
    progress: project.progress
  }))
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json(fallbackProjectRows())
  }

  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        timeEntries: { select: { hours: true, billingStatus: true } },
        invoices: { select: { grossTotal: true } },
        invoicePositions: { select: { hours: true, amount: true } }
      }
    })

    return NextResponse.json(projects.map((project) => {
      const trackedHours = project.timeEntries.reduce((sum, entry) => sum + numberValue(entry.hours), 0)
      const invoicedHoursFromPositions = project.invoicePositions.reduce((sum, position) => sum + numberValue(position.hours), 0)
      const invoicedHoursFromEntries = project.timeEntries
        .filter((entry) => entry.billingStatus === "invoiced")
        .reduce((sum, entry) => sum + numberValue(entry.hours), 0)
      const invoicedHours = invoicedHoursFromPositions || invoicedHoursFromEntries
      const revenue = project.invoices.reduce((sum, invoice) => sum + numberValue(invoice.grossTotal), 0)
      const budgetAmount = numberValue(project.budget)
      const progress = budgetAmount > 0 ? Math.min(100, Math.round((revenue / budgetAmount) * 100)) : 0

      return {
        id: project.id,
        code: project.code,
        name: project.name,
        customerId: project.customerId,
        customer: project.customer?.name || "Ohne Kunde",
        status: statusLabel(project.status),
        statusKey: project.status,
        description: project.description || "",
        startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : null,
        endDate: project.endDate ? project.endDate.toISOString().slice(0, 10) : null,
        budgetAmount,
        budget: formatBudget(project.budget),
        hourlyRate: project.hourlyRate == null ? null : numberValue(project.hourlyRate),
        trackedHours,
        invoicedHours,
        openHours: Math.max(0, trackedHours - invoicedHours),
        revenue,
        progress: progress + "%"
      }
    }))
  } catch (error) {
    console.error(error)
    return NextResponse.json(fallbackProjectRows())
  }
}
