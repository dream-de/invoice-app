import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

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
}
