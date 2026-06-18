import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

async function requireCustomerEditPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "customers", "edit")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Kundenaktion.", 403)
  }

  return user
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const mode = new URL(req.url).searchParams.get("mode") || "archive"

  try {
    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        action: mode === "delete" ? "delete" : "archive",
        customer: { id }
      }))
    }

    await requireCustomerEditPermission()

    const existing = await prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: { select: { id: true }, take: 1 },
        projects: { select: { id: true }, take: 1 }
      }
    })

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Kunde nicht gefunden." }, { status: 404 })
    }

    const hasRelations = existing.invoices.length > 0 || existing.projects.length > 0

    if (mode === "delete" && hasRelations) {
      return NextResponse.json(
        { ok: false, error: "Kunde hat verknuepfte Daten und kann nur archiviert werden." },
        { status: 409 }
      )
    }

    if (mode === "delete") {
      await prisma.customer.delete({ where: { id } })
      return NextResponse.json({ ok: true, action: "delete" })
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: { status: "inactive" }
    })

    return NextResponse.json({ ok: true, action: "archive", customer })
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const mapped = mapAuthError(error)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    console.error(error)
    return NextResponse.json({ ok: false, error: "Kunde konnte nicht entfernt werden." }, { status: 500 })
  }
}
