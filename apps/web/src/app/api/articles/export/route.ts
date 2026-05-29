import { prisma } from "@dream-invoice/database"
import { createCsvResponse } from "@/lib/export/csv-response"
import { articles as fallbackArticles } from "@/data/invoice-data"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

type ExportArticle = {
  number: string
  name: string
  category: string | null
  netPrice: unknown
  unit: string
  vatRate: unknown
  active: boolean
}

function rowsFromFallbackArticles() {
  return fallbackArticles.map((article) => [
    article.code,
    article.name,
    article.category ?? "",
    Number(article.price).toFixed(2).replace(".", ","),
    article.unit,
    Number(article.tax).toFixed(2).replace(".", ","),
    article.status === "inactive" ? "Nein" : "Ja"
  ])
}

function createArticleCsv(rows: string[][]) {
  return createCsvResponse(
    [
      ["Artikelnummer", "Artikel", "Kategorie", "Nettopreis", "Einheit", "MwSt", "Aktiv"],
      ...rows
    ],
    "preisliste-export.csv"
  )
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return createArticleCsv(rowsFromFallbackArticles())
  }

  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" }
    })

    return createArticleCsv((articles as ExportArticle[]).map((article) => [
      article.number,
      article.name,
      article.category ?? "",
      Number(article.netPrice).toFixed(2).replace(".", ","),
      article.unit,
      Number(article.vatRate).toFixed(2).replace(".", ","),
      article.active ? "Ja" : "Nein"
    ]))
  } catch (error) {
    console.error(error)
    return createArticleCsv(rowsFromFallbackArticles())
  }
}
