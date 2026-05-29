import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { articles as fallbackArticles } from "@/data/invoice-data"
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

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({
      ok: true,
      articles: fallbackArticleRows(),
      mode: "demo"
    })
  }

  try {
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
    console.error(error)
    return NextResponse.json({
      ok: true,
      articles: fallbackArticleRows(),
      mode: "demo"
    })
  }
}
