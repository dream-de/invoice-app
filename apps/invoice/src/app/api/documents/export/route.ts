import { prisma } from "@invoice-platform/database"
import { createCsvResponse } from "@/lib/export/csv-response"


function formatDate(value: Date | string | null | undefined) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const ids = (url.searchParams.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  const invoices = await prisma.invoice.findMany({
    where: ids.length > 0 ? { id: { in: ids } } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true
    }
  })

  const rows = [
    ["Nummer", "Typ", "Status", "Kunde", "Datum", "Faelligkeit", "Netto", "MwSt", "Brutto"],
    ...invoices.map((invoice: any) => [
      invoice.number,
      invoice.type,
      invoice.status,
      invoice.customer?.name || "",
      formatDate(invoice.issueDate),
      formatDate(invoice.dueDate),
      invoice.netTotal,
      invoice.vatTotal,
      invoice.grossTotal
    ])
  ]


  return createCsvResponse(rows, "dokumente-export.csv")
}
