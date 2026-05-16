import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params


try {
    const invoiceId = id
    const data = await req.json()

    // 1. Rechnung prüfen
    const existing = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { positions: true }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    // 2. Summen neu berechnen
    const netTotal = data.items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )

    const vatTotal = netTotal * data.taxRate
    const grossTotal = netTotal + vatTotal + data.tip

    // 3. Positionen löschen (wir legen sie neu an)
    await prisma.invoicePosition.deleteMany({
      where: { invoiceId }
    })

    // 4. Rechnung aktualisieren
    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        issueDate: new Date(data.date),

        netTotal,
        vatTotal,
        grossTotal,

        customer: data.customerId
          ? { connect: { id: data.customerId } }
          : undefined,

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

    return NextResponse.json({ success: true, invoice: updated })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    )
  }
}
