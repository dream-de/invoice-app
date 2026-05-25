import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"

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

    await writeAuditLog({
      action: "invoice.delete",
      entity: "invoice",
      entityId: exists.id,
      reason: "Invoice deleted",
      data: {
        number: exists.number,
        status: exists.status,
        type: exists.type
      }
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
