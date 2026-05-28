import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"


function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

async function requirePermission(scope: string, action: string) {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, scope, action)) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Aktion.", 403)
  }

  return user
}

function toNumber(value: unknown) {
  return Number(String(value ?? "").replace(",", ".")) || 0
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.name || String(data.name).trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: "Artikelname fehlt." },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      const number = String(data.code || data.number || "").trim() || "AR-DEMO-0001"

      return NextResponse.json({
        ok: true,
        article: {
          id: "demo-" + Date.now(),
          number,
          code: number,
          name: String(data.name).trim(),
          category: data.category ? String(data.category).trim() : null,
          description: data.description ? String(data.description).trim() : null,
          unit: data.unit ? String(data.unit).trim() : "Stk",
          netPrice: toNumber(data.price ?? data.netPrice),
          price: toNumber(data.price ?? data.netPrice),
          vatRate: toNumber(data.tax ?? data.vatRate ?? 19),
          tax: toNumber(data.tax ?? data.vatRate ?? 19),
          active: true
        },
        mode: "demo"
      })
    }

    await requirePermission("articles", "edit")

    const count = await prisma.article.count()
    const number =
      String(data.code || data.number || "").trim() ||
      `AR-${String(count + 1).padStart(4, "0")}`

    const article = await prisma.article.create({
      data: {
        number,
        name: String(data.name).trim(),
        category: data.category ? String(data.category).trim() : null,
        description: data.description ? String(data.description).trim() : null,
        unit: data.unit ? String(data.unit).trim() : "Stk",
        netPrice: toNumber(data.price ?? data.netPrice),
        vatRate: toNumber(data.tax ?? data.vatRate ?? 19)
      }
    })

    return NextResponse.json({ ok: true, article })
  } catch (error: unknown) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Artikelnummer existiert bereits." },
        { status: 409 }
      )
    }

    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Artikel konnte nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
