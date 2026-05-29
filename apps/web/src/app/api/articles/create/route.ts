import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { z } from "zod"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

const decimalInput = z.union([z.string(), z.number()]).transform((value, ctx) => {
  const normalized = String(value).trim().replace(",", ".")
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    ctx.addIssue({ code: "custom", message: "Ungueltige Zahl." })
    return z.NEVER
  }

  return Number(normalized)
})

const articleCreateSchema = z.object({
  name: z.string().trim().min(2, "Artikelname fehlt.").max(160),
  code: z.string().trim().min(1).max(64).optional(),
  number: z.string().trim().min(1).max(64).optional(),
  category: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(2_000).optional().nullable(),
  unit: z.string().trim().min(1).max(24).optional(),
  price: decimalInput.optional(),
  netPrice: decimalInput.optional(),
  tax: decimalInput.optional(),
  vatRate: decimalInput.optional()
}).refine((data) => data.price !== undefined || data.netPrice !== undefined, {
  path: ["price"],
  message: "Preis fehlt."
})

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

function optionalText(value: string | null | undefined) {
  const text = value?.trim() ?? ""
  return text.length ? text : null
}

export async function POST(request: Request) {
  try {
    const parsed = articleCreateSchema.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Ungueltige Artikel-Daten." },
        { status: 400 }
      )
    }
    const data = parsed.data
    const netPrice = data.price ?? data.netPrice ?? 0
    const vatRate = data.tax ?? data.vatRate ?? 19

    if (isDemoMode() || !process.env.DATABASE_URL) {
      const number = data.code || data.number || "AR-DEMO-0001"

      return NextResponse.json(demoModeResponse({
        ok: true,
        article: {
          id: "demo-" + Date.now(),
          number,
          code: number,
          name: data.name,
          category: optionalText(data.category),
          description: optionalText(data.description),
          unit: data.unit ?? "Stk",
          netPrice,
          price: netPrice,
          vatRate,
          tax: vatRate,
          active: true
        }
      }))
    }

    await requirePermission("articles", "edit")

    const count = await prisma.article.count()
    const number =
      data.code ||
      data.number ||
      `AR-${String(count + 1).padStart(4, "0")}`

    const article = await prisma.article.create({
      data: {
        number,
        name: data.name,
        category: optionalText(data.category),
        description: optionalText(data.description),
        unit: data.unit ?? "Stk",
        netPrice,
        vatRate
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
