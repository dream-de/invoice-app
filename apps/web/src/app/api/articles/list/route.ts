import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { articles as fallbackArticles } from "@/data/invoice-data"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { isDemoMode } from "@/lib/demo-mode"

type FallbackArticle = (typeof fallbackArticles)[number]

function normalizeFallbackArticle(article: FallbackArticle) {
  return {
    id: article.id,
    name: article.name,
    code: article.code,
    category: article.category,
    description: article.description,
    unit: article.unit,
    price: Number(article.price),
    tax: Number(article.tax),
    active: article.status !== "inactive"
  }
}

function fallbackArticleRows() {
  return fallbackArticles.map(normalizeFallbackArticle)
}


export const dynamic = "force-dynamic"

type ListArticle = {
  id: string
  number: string
  name: string
  category: string | null
  description: string | null
  unit: string
  netPrice: unknown
  vatRate: unknown
  active: boolean
  createdAt: Date
  updatedAt: Date
}

async function requireArticleViewPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "articles", "view")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Artikelaktion.", 403)
  }

  return user
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: true,
      articles: fallbackArticleRows(),
      mode: "demo"
    })
  }

  try {
    await requireArticleViewPermission()

    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({
      ok: true,
      articles: (articles as ListArticle[]).map((article) => ({
        id: article.id,
        name: article.name,
        code: article.number,
        category: article.category,
        description: article.description,
        unit: article.unit,
        price: Number(article.netPrice),
        tax: Number(article.vatRate),
        active: article.active
      }))
    })
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const mapped = mapAuthError(error)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    console.error(error)
    return NextResponse.json({
      ok: true,
      articles: fallbackArticleRows(),
      mode: "demo"
    })
  }
}
