import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params


try {
    const invoiceId = id

    // Prüfen ob Rechnung existiert
    const exists = await prisma.invoice.findUnique({
      where: { id: invoiceId }
    })

    if (!exists) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    // Rechnung löschen (Positionen werden automatisch gelöscht)
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    )
  }
}
