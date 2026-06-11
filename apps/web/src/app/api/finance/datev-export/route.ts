import { prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"
import { createCsvResponse } from "@/lib/export/csv-response"

function formatDate(value: Date | string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 10)
}

function amount(value: unknown) {
  const numberValue = Number(value ?? 0)
  return (Number.isFinite(numberValue) ? numberValue : 0).toFixed(2)
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return createCsvResponse(
      [
        ["Datum", "Belegnummer", "Konto", "Gegenkonto", "Text", "Soll", "Haben", "Steuer"],
        ["2026-06-10", "RE-2026-104", "8400", "1200", "Ausgangsrechnung Premium Staging Kunde", "", "148.75", "23.75"],
        ["2026-05-23", "RE-2026-4999", "8400", "1200", "Ausgangsrechnung Aurora Labs GmbH", "", "719.05", "114.80"],
        ["2026-06-10", "EXP-DEMO-001", "4930", "1200", "Software Ausgabe", "79.90", "", "0.00"]
      ],
      "datev-export.csv"
    )
  }

  const [invoices, payments, expenses] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: { customer: true }
    }),
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      include: { invoice: { include: { customer: true } } }
    }),
    prisma.expense.findMany({
      orderBy: { date: "desc" }
    })
  ])

  const rows: unknown[][] = [
    ["Datum", "Belegnummer", "Konto", "Gegenkonto", "Text", "Soll", "Haben", "Steuer"],
    ...invoices.map((invoice) => [
      formatDate(invoice.issueDate),
      invoice.number,
      "8400",
      "1200",
      `Ausgangsrechnung ${invoice.customer?.name || "Ohne Kunde"}`,
      "",
      amount(invoice.grossTotal),
      amount(invoice.vatTotal)
    ]),
    ...payments.map((payment) => [
      formatDate(payment.paidAt),
      payment.reference || payment.invoice?.number || payment.id,
      "1200",
      "8400",
      `Zahlung ${payment.invoice?.customer?.name || payment.method || "Kunde"}`,
      amount(payment.amount),
      "",
      "0.00"
    ]),
    ...expenses.map((expense) => [
      formatDate(expense.date),
      expense.id,
      "4930",
      "1200",
      expense.title || expense.vendor || "Premium Ausgabe",
      amount(expense.amount),
      "",
      "0.00"
    ])
  ]

  return createCsvResponse(rows, "datev-export.csv")
}
