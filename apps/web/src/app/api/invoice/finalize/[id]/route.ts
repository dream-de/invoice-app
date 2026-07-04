import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { documents } from "@/data/invoice-data"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params


try {
    if (isDemoMode() || !process.env.DATABASE_URL) {
      const document = documents.find((item) => item.id === id)

      return NextResponse.json(demoModeResponse({
        success: true,
        invoice: {
          id,
          number: document?.number ?? "DI-DEMO-DRAFT",
          status: "final",
          type: document?.type === "Angebot" ? "offer" : "invoice"
        }
      }))
    }

    const existing = await prisma.invoice.findUnique({ where: { id } })
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
        type: invoice.type,
        entityLabel: invoice.number
      },
      before: existing ? { number: existing.number, status: existing.status, type: existing.type } : undefined,
      after: { number: invoice.number, status: invoice.status, type: invoice.type },
      requestMetadata: getAuditRequestMetadata(req)
    })

    return NextResponse.json({ success: true, invoice })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Finalize failed" }, { status: 500 })
  }
}
