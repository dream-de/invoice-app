import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

type PremiumDocumentType = "invoice" | "offer"

function normalizeDocumentType(value: unknown): PremiumDocumentType {
  const normalized = String(value || "").toLowerCase()
  return normalized === "offer" || normalized === "angebot" ? "offer" : "invoice"
}

function normalizeStatus(value: unknown, type: PremiumDocumentType) {
  const normalized = String(value || "").toLowerCase()
  if (normalized === "bezahlt") return "paid"
  if (normalized === "offen" || normalized === "sent" || normalized === "versendet") return "open"
  if (normalized === "ueberfaellig" || normalized === "überfällig") return "overdue"
  if (normalized === "accepted" || normalized === "angenommen") return "accepted"
  if (["paid", "open", "draft", "overdue", "accepted"].includes(normalized)) return normalized
  return type === "offer" ? "draft" : "draft"
}

function parseMoney(value: unknown) {
  const normalized = String(value || "0").trim().replace(",", ".")
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount >= 0 ? amount : Number.NaN
}

function formatDocumentResponse(document: {
  id: string
  number: string
  type?: string | null
  status: string
  issueDate?: Date | string | null
  dueDate?: Date | string | null
  createdAt?: Date | string | null
  grossTotal?: unknown
  customer?: { name?: string | null } | null
}) {
  const date = document.issueDate ? new Date(document.issueDate).toISOString() : new Date().toISOString()

  return {
    id: document.id,
    number: document.number,
    type: document.type || "invoice",
    status: document.status,
    customer: document.customer?.name || "Ohne Kunde",
    grossTotal: Number(document.grossTotal || 0),
    date,
    dueDate: document.dueDate ? new Date(document.dueDate).toISOString() : null,
    createdAt: document.createdAt ? new Date(document.createdAt).toISOString() : date
  }
}

function demoDocumentFromData(data: Record<string, unknown>) {
  const type = normalizeDocumentType(data.type)
  const netTotal = parseMoney(data.amount)
  const safeNetTotal = Number.isFinite(netTotal) ? netTotal : 0
  const vatTotal = safeNetTotal * 0.19
  const grossTotal = safeNetTotal + vatTotal
  const prefix = type === "offer" ? "AN-DEMO-" : "RE-DEMO-"

  return formatDocumentResponse({
    id: "demo-document-" + Date.now(),
    number: prefix + String(Math.floor(Date.now() % 10000)).padStart(4, "0"),
    type,
    status: normalizeStatus(data.status, type),
    issueDate: new Date(),
    createdAt: new Date(),
    grossTotal,
    customer: { name: data.customer ? String(data.customer).trim() : "Demo Kunde" }
  })
}

async function requireDocumentCreatePermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", "create")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Dokumentaktion.", 403)
  }

  return user
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const type = normalizeDocumentType(data.type)
    const title = String(data.title || "").trim() || (type === "offer" ? "Neue Angebotsposition" : "Neue Rechnungsposition")
    const netTotal = parseMoney(data.amount)

    if (!Number.isFinite(netTotal) || netTotal <= 0) {
      return NextResponse.json(
        { ok: false, error: "Betrag fehlt oder ist ungueltig." },
        { status: 400 }
      )
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        document: demoDocumentFromData(data)
      }))
    }

    await requireDocumentCreatePermission()

    const document = await prisma.$transaction(async (tx) => {
      await tx.numberRange.upsert({
        where: { type },
        create: {
          type,
          prefix: type === "offer" ? "AN-%Y-" : "RE-%Y-",
          nextValue: 1,
          padding: 4
        },
        update: {}
      })

      const range = await tx.numberRange.update({
        where: { type },
        data: { nextValue: { increment: 1 } }
      })
      const nextValue = range.nextValue - 1
      const number = range.prefix.replace("%Y", String(new Date().getFullYear())) + String(nextValue).padStart(range.padding, "0")
      const customerName = String(data.customer || "").trim()
      const projectName = String(data.project || "").trim()
      const customer = customerName
        ? await tx.customer.findFirst({ where: { name: customerName }, select: { id: true, name: true } })
        : null
      const project = projectName
        ? await tx.project.findFirst({ where: { name: projectName }, select: { id: true } })
        : null
      const vatTotal = netTotal * 0.19
      const grossTotal = netTotal + vatTotal

      return tx.invoice.create({
        data: {
          number,
          type,
          status: normalizeStatus(data.status, type),
          issueDate: new Date(),
          dueDate: type === "invoice" ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
          notes: data.note ? String(data.note).trim() : null,
          customerId: customer?.id ?? null,
          projectId: project?.id ?? null,
          netTotal,
          vatTotal,
          grossTotal,
          positions: {
            create: [{
              title,
              description: data.note ? String(data.note).trim() : null,
              quantity: 1,
              netPrice: netTotal,
              vatRate: 19,
              sortOrder: 0
            }]
          }
        },
        include: {
          customer: true
        }
      })
    })

    return NextResponse.json({ ok: true, document: formatDocumentResponse(document) })
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const mapped = mapAuthError(error)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Dokumentnummer existiert bereits." },
        { status: 409 }
      )
    }

    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Dokument konnte nicht erstellt werden." },
      { status: 500 }
    )
  }
}
