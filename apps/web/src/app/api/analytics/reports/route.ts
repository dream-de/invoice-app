import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

function amount(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function startOfDay(date: Date) { const copy = new Date(date); copy.setHours(0,0,0,0); return copy }
function startOfWeek(date: Date) { const copy = startOfDay(date); const day = (copy.getDay() + 6) % 7; copy.setDate(copy.getDate() - day); return copy }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1) }
function startOfYear(date: Date) { return new Date(date.getFullYear(), 0, 1) }

const empty = {
  revenue: { today: 0, week: 0, month: 0, year: 0 },
  invoices: { open: 0, paid: 0, overdue: 0, cancelled: 0 },
  customers: { top: [], revenueByCustomer: [], openAmounts: [] },
  projects: { hours: 0, revenue: 0, profitability: 0, utilization: 0 },
  timeTracking: { bookedHours: 0, invoicedHours: 0, openHours: 0 },
  charts: { revenueTrend: [], invoiceStatus: [], projectUtilization: [], paymentReceipts: [] },
  exports: ["pdf", "excel", "csv"]
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, ...empty, mode: "demo" })
  }

  try {
    const now = new Date()
    const [invoices, projects, timeEntries] = await Promise.all([
      prisma.invoice.findMany({
        where: { type: "invoice" },
        include: { customer: true, payments: true, project: true, positions: true },
        orderBy: { issueDate: "asc" }
      }),
      prisma.project.findMany({ include: { invoices: true, timeEntries: true } }),
      prisma.timeEntry.findMany()
    ])

    const paidInvoices = invoices.filter((invoice) => invoice.status === "paid" || invoice.paidAt)
    const revenueSince = (date: Date) => paidInvoices.filter((invoice) => new Date(invoice.paidAt ?? invoice.issueDate) >= date).reduce((sum, invoice) => sum + amount(invoice.grossTotal), 0)
    const openInvoices = invoices.filter((invoice) => invoice.status === "open" || invoice.status === "draft")
    const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue" || (invoice.dueDate && !invoice.paidAt && new Date(invoice.dueDate) < now))
    const cancelledInvoices = invoices.filter((invoice) => ["cancelled", "canceled", "storniert"].includes(String(invoice.status).toLowerCase()))

    const customerMap = new Map<string, { customer: string; revenue: number; openAmount: number }>()
    for (const invoice of invoices) {
      const key = invoice.customerId || invoice.customer?.name || "unknown"
      const row = customerMap.get(key) ?? { customer: invoice.customer?.name ?? "Unbekannt", revenue: 0, openAmount: 0 }
      if (invoice.status === "paid" || invoice.paidAt) row.revenue += amount(invoice.grossTotal)
      if (!invoice.paidAt && invoice.status !== "paid") row.openAmount += amount(invoice.grossTotal)
      customerMap.set(key, row)
    }
    const customerRows = Array.from(customerMap.values()).sort((left, right) => right.revenue - left.revenue)

    const bookedHours = timeEntries.reduce((sum, entry) => sum + amount(entry.hours), 0)
    const invoicedHours = timeEntries.filter((entry) => entry.billingStatus === "invoiced").reduce((sum, entry) => sum + amount(entry.hours), 0)
    const projectRevenue = projects.reduce((sum, project) => sum + project.invoices.reduce((inner, invoice) => inner + amount(invoice.grossTotal), 0), 0)
    const projectHours = projects.reduce((sum, project) => sum + project.timeEntries.reduce((inner, entry) => inner + amount(entry.hours), 0), 0)
    const projectBudget = projects.reduce((sum, project) => sum + amount(project.budget), 0)

    const trend = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const next = new Date(date.getFullYear(), date.getMonth() + 1, 1)
      const value = paidInvoices
        .filter((invoice) => {
          const paidAt = new Date(invoice.paidAt ?? invoice.issueDate)
          return paidAt >= date && paidAt < next
        })
        .reduce((sum, invoice) => sum + amount(invoice.grossTotal), 0)
      return { label: date.toLocaleDateString("de-DE", { month: "short" }), value }
    })

    return NextResponse.json({
      ok: true,
      revenue: {
        today: revenueSince(startOfDay(now)),
        week: revenueSince(startOfWeek(now)),
        month: revenueSince(startOfMonth(now)),
        year: revenueSince(startOfYear(now))
      },
      invoices: { open: openInvoices.length, paid: paidInvoices.length, overdue: overdueInvoices.length, cancelled: cancelledInvoices.length },
      customers: {
        top: customerRows.slice(0, 5),
        revenueByCustomer: customerRows.slice(0, 10),
        openAmounts: [...customerRows].sort((left, right) => right.openAmount - left.openAmount).slice(0, 10)
      },
      projects: {
        hours: projectHours,
        revenue: projectRevenue,
        profitability: projectBudget > 0 ? Math.round((projectRevenue / projectBudget) * 100) : 0,
        utilization: projectHours > 0 ? Math.round((invoicedHours / projectHours) * 100) : 0
      },
      timeTracking: { bookedHours, invoicedHours, openHours: Math.max(0, bookedHours - invoicedHours) },
      charts: {
        revenueTrend: trend,
        invoiceStatus: [
          { label: "Offen", value: openInvoices.length },
          { label: "Bezahlt", value: paidInvoices.length },
          { label: "Ueberfaellig", value: overdueInvoices.length },
          { label: "Storniert", value: cancelledInvoices.length }
        ],
        projectUtilization: projects.slice(0, 8).map((project) => ({ label: project.name, value: project.timeEntries.reduce((sum, entry) => sum + amount(entry.hours), 0) })),
        paymentReceipts: trend
      },
      exports: ["pdf", "excel", "csv"]
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: "Berichte konnten nicht geladen werden.", ...empty }, { status: 500 })
  }
}
