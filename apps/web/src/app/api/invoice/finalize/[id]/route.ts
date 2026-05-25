import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { documents } from "@/data/invoice-data"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params


try {
    if (!process.env.DATABASE_URL) {
      const document = documents.find((item) => item.id === id)

      return NextResponse.json({
        success: true,
        invoice: {
          id,
          number: document?.number ?? "DI-DEMO-DRAFT",
          status: "final",
          type: document?.type === "Angebot" ? "offer" : "invoice"
        },
        mode: "demo"
      })
    }

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
