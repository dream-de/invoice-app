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

function normalizeStatus(status: string | undefined) {
  const normalized = String(status ?? "open").toLowerCase()

  if (normalized.includes("bezahlt") || normalized.includes("paid")) return "paid"
  if (normalized.includes("entwurf") || normalized.includes("draft")) return "draft"
  if (normalized.includes("angebot") || normalized.includes("offer")) return "sent"

  return "open"
}

function fallbackInvoice(id: string) {
  const document = documents.find((item) => item.id === id)

  if (!document) return null

  const positions = document.items.map((item, index) => ({
    id: document.id + "-position-" + (index + 1),
    title: item.title,
    description: item.description,
    quantity: item.quantity,
    netPrice: item.netPrice,
    vatRate: 19,
    sortOrder: index
  }))
  const netTotal = positions.reduce((sum, item) => sum + Number(item.quantity) * Number(item.netPrice), 0)
  const grossTotal = Number(document.amount ?? netTotal * 1.19)
  const vatTotal = grossTotal - netTotal

  return {
    id: document.id,
    number: document.number,
    type: document.type === "Angebot" ? "offer" : "invoice",
    status: normalizeStatus(document.status),
    issueDate: document.issueDate,
    dueDate: document.dueDate,
    notes: "Vielen Dank für Ihren Auftrag. Bitte überweisen Sie den fälligen Betrag innerhalb von 14 Tagen auf das unten angegebene Konto.",
    netTotal,
    vatTotal,
    grossTotal,
    customer: {
      name: document.customer,
      email: document.customerEmail,
      street: document.customerStreet,
      zip: document.customerZip,
      city: document.customerCity,
      country: "Deutschland"
    },
    positions
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (isDemoMode() || !process.env.DATABASE_URL) {
    const invoice = fallbackInvoice(id)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  }

  try {
    await requirePermission("documents", "view")

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        positions: {
          orderBy: { sortOrder: "asc" }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)

  } catch (err) {
    const authError = authErrorResponse(err)
    if (authError) return authError

    console.error(err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
