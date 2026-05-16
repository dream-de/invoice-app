import { prisma } from "@invoice-platform/database"

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

  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(";")
    )
    .join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="preisliste-export.csv"'
    }
  })
}
