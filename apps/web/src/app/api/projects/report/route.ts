import { prisma } from "@dream-invoice/database"
import { createCsvResponse } from "@/lib/export/csv-response"

function amount(value: unknown) {
  const numberValue = Number(value ?? 0)
  return (Number.isFinite(numberValue) ? numberValue : 0).toFixed(2)
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return createCsvResponse(
      [["Code", "Projekt", "Kunde", "Status", "Budget", "Rechnungen", "Abgerechnet", "Zeitwert", "Ausgaben"]],
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
