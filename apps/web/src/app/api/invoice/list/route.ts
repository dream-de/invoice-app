import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { documents } from "@/data/invoice-data"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { isDemoMode } from "@/lib/demo-mode"


function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

async function requirePermission(scope: string, action: string) {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, scope, action)) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Aktion.", 403)
  }

  return user
}

function normalizeType(type: string) {
  if (type === "Rechnung") return "invoice"
  if (type === "Angebot") return "offer"
  return type
}

function normalizeStatus(status: string) {
  if (status === "Bezahlt") return "paid"
  if (status === "Offen") return "open"
  if (status === "Entwurf") return "draft"
  if (status === "Ueberfaellig" || status === "Überfällig") return "overdue"
  return status
}

function fallbackInvoices() {
  const now = new Date().toISOString()

  return documents.map((document) => {
    const grossTotal = Number(document.amount) || 0
    const netTotal = grossTotal / 1.19
    const vatTotal = grossTotal - netTotal

    return {
      id: document.id,
      number: document.number,
      type: normalizeType(document.type),
      date: now,
      dueDate: now,
      createdAt: now,
      status: normalizeStatus(document.status),
      customer: document.customer,
      netTotal,
      vatTotal,
      grossTotal
    }
  })
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json(fallbackInvoices())
  }

  try {
    await requirePermission("documents", "view")

    const invoices = await prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: {
        customer: true,
        positions: {
          orderBy: { sortOrder: "asc" }
        }
      }
    })

    const formatted = invoices.map((inv) => {
      const calculatedNetTotal = inv.positions.reduce(
        (sum, position) => sum + Number(position.quantity) * Number(position.netPrice),
        0
      )
      const storedNetTotal = Number(inv.netTotal)
      const storedVatTotal = Number(inv.vatTotal)
      const storedGrossTotal = Number(inv.grossTotal)
      const netTotal = storedGrossTotal > 0 ? storedNetTotal : calculatedNetTotal
      const vatTotal = storedGrossTotal > 0 ? storedVatTotal : netTotal * 0.19
      const grossTotal = storedGrossTotal > 0 ? storedGrossTotal : netTotal + vatTotal

      return {
        id: inv.id,
        number: inv.number,
        type: inv.type,
        date: inv.issueDate,
        dueDate: inv.dueDate,
        createdAt: inv.createdAt,
        status: inv.status,
        customer: inv.customer?.name ?? "Unbekannt",
        netTotal,
        vatTotal,
        grossTotal
      }
    })

    return NextResponse.json(formatted)
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Invoice list unavailable.", error)
    return NextResponse.json(
      { ok: false, error: "Invoice list unavailable" },
      { status: 500 }
    )
  }
}
