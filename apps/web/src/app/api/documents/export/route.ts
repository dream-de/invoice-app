import { prisma } from "@dream-invoice/database"
import { documents } from "@/data/invoice-data"
import { createCsvResponse } from "@/lib/export/csv-response"
import { isDemoMode } from "@/lib/demo-mode"

function formatDate(value: Date | string | null | undefined) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toISOString().slice(0, 10)
}

function staticRows(ids: string[]) {
  const now = new Date().toISOString()
  const selected = ids.length > 0 ? documents.filter((document) => ids.includes(document.id)) : documents

  return selected.map((document) => {
    const grossTotal = Number(document.amount) || 0
    const netTotal = grossTotal / 1.19
    const vatTotal = grossTotal - netTotal

    return [
      document.number,
      document.type,
      document.status,
      document.customer,
      formatDate(now),
      formatDate(now),
      netTotal.toFixed(2),
      vatTotal.toFixed(2),
      grossTotal.toFixed(2)
    ]
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const ids = (url.searchParams.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  const header = ["Nummer", "Typ", "Status", "Kunde", "Datum", "Faelligkeit", "Netto", "MwSt", "Brutto"]

  if (isDemoMode() || !process.env.DATABASE_URL) {
    return createCsvResponse([header, ...staticRows(ids)], "dokumente-export.csv")
  }

  try {
    const invoices = await prisma.invoice.findMany({
      where: ids.length > 0 ? { id: { in: ids } } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        customer: true
      }
    })

    const rows = [
      header,
      ...invoices.map((invoice) => [
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
  } catch (error) {
    console.error("Document export unavailable, using fallback documents.", error)
    return createCsvResponse([header, ...staticRows(ids)], "dokumente-export.csv")
  }
}
