import { prisma } from "@dream-invoice/database"

function money(value: unknown) {
  const amount = Number(value ?? 0)
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    Number.isFinite(amount) ? amount : 0
  )
}

function numberFromAuditData(data: unknown, key: string) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return 0
  const value = (data as Record<string, unknown>)[key]
  const amount = Number(String(value ?? "0").replace(",", "."))
  return Number.isFinite(amount) ? amount : 0
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return new Response("Finanzbericht\nDatenbank ist nicht verbunden.\n", {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="finanzbericht.txt"'
      }
    })
  }

  const [invoiceStats, paymentStats, openStats, expenseLogs, timeLogs] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { netTotal: true, vatTotal: true, grossTotal: true },
      _count: { _all: true }
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      _count: { _all: true }
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["draft", "open", "sent", "overdue"] } },
      _sum: { grossTotal: true },
      _count: { _all: true }
    }),
    prisma.auditLog.findMany({
      where: { action: "premium.expense.create" },
      select: { data: true }
    }),
    prisma.auditLog.findMany({
      where: { action: "premium.time.create" },
      select: { data: true }
    })
  ])

  const expensesTotal = expenseLogs.reduce((sum, entry) => sum + numberFromAuditData(entry.data, "amount"), 0)
  const billableTimeTotal = timeLogs.reduce((sum, entry) => sum + numberFromAuditData(entry.data, "amount"), 0)
  const grossTotal = Number(invoiceStats._sum.grossTotal ?? 0)
  const paidTotal = Number(paymentStats._sum.amount ?? 0)
  const openTotal = Number(openStats._sum.grossTotal ?? 0)

  const report = [
    "DreamInvoice Premium Finanzbericht",
    `Erstellt: ${new Date().toLocaleString("de-DE")}`,
    "",
    "Rechnungen",
    `Anzahl: ${invoiceStats._count._all}`,
    `Netto: ${money(invoiceStats._sum.netTotal)}`,
    `MwSt: ${money(invoiceStats._sum.vatTotal)}`,
    `Brutto: ${money(grossTotal)}`,
    `Offen: ${money(openTotal)} (${openStats._count._all})`,
    "",
    "Zahlungen",
    `Zahlungseingaenge: ${money(paidTotal)} (${paymentStats._count._all})`,
    `Rest offen: ${money(Math.max(grossTotal - paidTotal, 0))}`,
    "",
    "Premium Workflows",
    `Erfasste Ausgaben: ${money(expensesTotal)} (${expenseLogs.length})`,
    `Abrechenbare Zeit: ${money(billableTimeTotal)} (${timeLogs.length})`,
    "",
    "Ergebnis",
    `Liquiditaetsblick: ${money(paidTotal - expensesTotal)}`,
    `Forecast inkl. offene Rechnungen: ${money(paidTotal + openTotal + billableTimeTotal - expensesTotal)}`
  ].join("\n")

  return new Response(report, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="finanzbericht.txt"',
      "Cache-Control": "no-store"
    }
  })
}
