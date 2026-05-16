import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: {
        customer: true
      }
    })

    const formatted = invoices.map((inv: any) => ({
      id: inv.id,
      number: inv.number,
      date: inv.issueDate,
      status: inv.status,
      customer: inv.customer?.name ?? "Unbekannt",
      netTotal: inv.netTotal,
      vatTotal: inv.vatTotal,
      grossTotal: inv.grossTotal
    }))

    return NextResponse.json(formatted)

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
