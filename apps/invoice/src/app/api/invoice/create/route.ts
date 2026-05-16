import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // 1. Nummernkreis abrufen
    const range = await prisma.numberRange.findUnique({
      where: { type: "invoice" }
    })

    if (!range) {
      return NextResponse.json(
        { error: "NumberRange 'invoice' not found" },
        { status: 500 }
      )
    }

    // 2. Neue Rechnungsnummer generieren
    const padded = String(range.nextValue).padStart(range.padding, "0")
    const invoiceNumber = `${range.prefix}${padded}`

    // 3. Netto / MwSt / Brutto berechnen
    const netTotal = data.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )

    const vatTotal = netTotal * data.taxRate
    const grossTotal = netTotal + vatTotal + data.tip

    // 4. Rechnung speichern
    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        status: "draft",
        issueDate: new Date(data.date),

        customer: data.customerId
          ? { connect: { id: data.customerId } }
          : undefined,

        netTotal,
        vatTotal,
        grossTotal,

        positions: {
          create: data.items.map((item: any, index: number) => ({
            title: item.name,
            quantity: item.quantity,
            netPrice: item.price,
            vatRate: data.taxRate * 100,
            sortOrder: index
          }))
        }
      }
    })

    // 5. Nummernkreis erhöhen
    await prisma.numberRange.update({
      where: { type: "invoice" },
      data: { nextValue: range.nextValue + 1 }
    })

    return NextResponse.json({ success: true, invoice })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
