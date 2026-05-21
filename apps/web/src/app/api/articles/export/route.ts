import { prisma } from "@dream-invoice/database"
import { createCsvResponse } from "@/lib/export/csv-response"

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

export async function GET() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" }
  })

  const rows = [
    ["Artikelnummer", "Artikel", "Kategorie", "Nettopreis", "Einheit", "MwSt", "Aktiv"],
    ...(articles as ExportArticle[]).map((article) => [
      article.number,
      article.name,
      article.category ?? "",
      Number(article.netPrice).toFixed(2).replace(".", ","),
      article.unit,
      Number(article.vatRate).toFixed(2).replace(".", ","),
      article.active ? "Ja" : "Nein"
    ])
  ]


  return createCsvResponse(rows, "preisliste-export.csv")
}
