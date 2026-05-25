import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params


try {
    const invoice = await prisma.invoice.update({
      where: { id: id },
      data: { status: "final" }
    })

    await writeAuditLog({
      action: "invoice.finalize",
      entity: "invoice",
      entityId: invoice.id,
      reason: "Invoice finalized",
      data: {
        number: invoice.number,
        status: invoice.status,
        type: invoice.type
      }
    })

    return NextResponse.json({ success: true, invoice })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Finalize failed" }, { status: 500 })
  }
}
