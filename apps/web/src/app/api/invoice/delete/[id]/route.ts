import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

function isPrismaNotFound(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025"
}

async function requireInvoicePermission(action: "delete") {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", action)) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Rechnungsaktion.", 403)
  }

  return user
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ success: true }))
    }

    const actor = await requireInvoicePermission("delete")

    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.delete({
        where: { id }
      })

      await writeAuditLog({
        action: "invoice.delete",
        entity: "invoice",
        entityId: invoice.id,
        reason: "Invoice deleted",
        data: {
          actorUserId: actor.id,
          number: invoice.number,
          status: invoice.status,
          type: invoice.type
        }
      }, { client: tx, throwOnError: true })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthServiceError) {
      const mapped = mapAuthError(err)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    if (isPrismaNotFound(err)) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    console.error(err)
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    )
  }
}
