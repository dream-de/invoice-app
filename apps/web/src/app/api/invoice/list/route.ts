import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { documents } from "@/data/invoice-data"

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
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(fallbackInvoices())
  }

  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: {
        customer: true
      }
    })

    const formatted = invoices.map((inv) => ({
      id: inv.id,
      number: inv.number,
      type: inv.type,
      date: inv.issueDate,
      dueDate: inv.dueDate,
      createdAt: inv.createdAt,
      status: inv.status,
      customer: inv.customer?.name ?? "Unbekannt",
      netTotal: inv.netTotal,
      vatTotal: inv.vatTotal,
      grossTotal: inv.grossTotal
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error("Invoice list unavailable, using fallback documents.", error)
    return NextResponse.json(fallbackInvoices())
  }
}
