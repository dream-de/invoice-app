import { NextResponse } from "next/server"
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
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true }))
    }

    await requireArticleEditPermission()

    await prisma.article.delete({
      where: { id }
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
