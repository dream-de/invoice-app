import { NextResponse } from "next/server"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { writeAuditLog } from "@/lib/audit/log"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

async function requireArticleEditPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "articles", "edit")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Artikelaktion.", 403)
  }

  return user
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true }))
    }

    await requireArticleEditPermission()

    const article = await prisma.article.delete({
      where: { id }
    })

    await writeAuditLog({
      action: "article.delete",
      entity: "article",
      entityId: id,
      reason: "Artikel gelöscht",
      data: { entityLabel: article.name ?? article.number ?? id },
      before: { number: article.number, name: article.name, category: article.category, unit: article.unit, netPrice: article.netPrice, vatRate: article.vatRate, active: article.active },
      requestMetadata: getAuditRequestMetadata(request)
    })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    if (error instanceof AuthServiceError) {
      const mapped = mapAuthError(error)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    if (typeof error === "object" && error && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Artikel nicht gefunden." },
        { status: 404 }
      )
    }

    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Artikel konnte nicht gelöscht werden." },
      { status: 500 }
    )
  }
}
