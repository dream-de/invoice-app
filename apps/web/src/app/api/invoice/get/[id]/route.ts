import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { documents } from "@/data/invoice-data"

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

  const grossTotal = Number(document.amount ?? 0)
  const netTotal = grossTotal / 1.19
  const vatTotal = grossTotal - netTotal

  return {
    id: document.id,
    number: document.number,
    type: document.type === "Angebot" ? "offer" : "invoice",
    status: normalizeStatus(document.status),
    issueDate: "2026-05-14T00:00:00.000Z",
    dueDate: "2026-05-28T00:00:00.000Z",
    notes: "Demo-Dokument fuer Dream Invoice.",
    netTotal,
    vatTotal,
    grossTotal,
    customer: {
      name: document.customer,
      email: "billing@example.invalid",
      street: "Lindenallee 42",
      zip: "50667",
      city: "Koeln",
      country: "Deutschland"
    },
    positions: [
      {
        id: document.id + "-position-1",
        title: document.type === "Angebot" ? "Projektpaket" : "Digitale Dienstleistung",
        description: "Demo-Position",
        quantity: 1,
        netPrice: netTotal,
        vatRate: 19,
        sortOrder: 0
      }
    ]
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!process.env.DATABASE_URL) {
    const invoice = fallbackInvoice(id)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  }

  try {
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
    console.error(err)
    const invoice = fallbackInvoice(id)

    if (invoice) {
      return NextResponse.json(invoice)
    }

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
