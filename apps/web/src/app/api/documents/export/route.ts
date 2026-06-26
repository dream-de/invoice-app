import { prisma } from "@dream-invoice/database"
import { documents } from "@/data/invoice-data"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { createCsvResponse } from "@/lib/export/csv-response"
import { isDemoMode } from "@/lib/demo-mode"

const MAX_EXPORT_IDS = 500
const MAX_EXPORT_ID_LENGTH = 128

function formatDate(value: Date | string | null | undefined) {
  if (!value) return ""

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toISOString().slice(0, 10)
}

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return Response.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

async function requireDocumentExportPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", "view")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diesen Dokumentexport.", 403)
  }
}

function parseExportIds(request: Request) {
  const url = new URL(request.url)
  const ids = (url.searchParams.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)

  if (ids.length > MAX_EXPORT_IDS) {
    throw new AuthServiceError("invalid_request", "Zu viele Dokumente fuer den Export.", 400)
  }

  if (ids.some((id) => id.length > MAX_EXPORT_ID_LENGTH)) {
    throw new AuthServiceError("invalid_request", "Ungueltige Dokumentauswahl.", 400)
  }

  return ids
}

function staticRows(ids: string[]) {
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
      formatDate(document.issueDate),
      formatDate(document.dueDate),
      netTotal.toFixed(2),
      vatTotal.toFixed(2),
      grossTotal.toFixed(2)
    ]
  })
}

export async function GET(request: Request) {
  const header = ["Nummer", "Typ", "Status", "Kunde", "Datum", "Faelligkeit", "Netto", "MwSt", "Brutto"]
  let ids: string[] = []

  try {
    ids = parseExportIds(request)

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return createCsvResponse([header, ...staticRows(ids)], "dokumente-export.csv")
    }

    await requireDocumentExportPermission()

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
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Document export failed. Falling back to premium static export.", error)
    return createCsvResponse([header, ...staticRows(ids)], "dokumente-export.csv")
  }
}
