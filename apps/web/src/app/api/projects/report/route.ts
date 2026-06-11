import { prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"
import { createCsvResponse } from "@/lib/export/csv-response"

function amount(value: unknown) {
  const numberValue = Number(value ?? 0)
  return (Number.isFinite(numberValue) ? numberValue : 0).toFixed(2)
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return createCsvResponse(
      [
        ["Code", "Projekt", "Kunde", "Status", "Budget", "Rechnungen", "Abgerechnet", "Zeitwert", "Ausgaben"],
        ["PR-0001", "Website Redesign", "Meridian Studio GmbH", "Aktiv", "2450.00", "2", "1320.00", "1450.00", "528.99"],
        ["PR-0002", "Brand Portal", "Aurora Labs GmbH", "Review", "5200.00", "1", "719.05", "860.00", "120.00"]
      ],
      "projektbericht.csv"
    )
  }

  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      invoices: true,
      timeEntries: true,
      expenses: true
    }
  })

  const rows = [
    ["Code", "Projekt", "Kunde", "Status", "Budget", "Rechnungen", "Abgerechnet", "Zeitwert", "Ausgaben"],
    ...projects.map((project) => [
      project.code,
      project.name,
      project.customer?.name || "",
      project.status,
      amount(project.budget),
      project.invoices.length,
      amount(project.invoices.reduce((sum, invoice) => sum + Number(invoice.grossTotal ?? 0), 0)),
      amount(project.timeEntries.reduce((sum, entry) => sum + Number(entry.amount ?? 0), 0)),
      amount(project.expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0))
    ])
  ]

  return createCsvResponse(rows, "projektbericht.csv")
}
