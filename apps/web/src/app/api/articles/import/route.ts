import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { recognizeArticlesFromFile } from "@dream-invoice/ocr"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")
  const save = formData.get("save") === "true"

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Keine Datei erhalten." },
      { status: 400 }
    )
  }

  const result = await recognizeArticlesFromFile(file)

  if (!save || !result.ok) {
    return NextResponse.json(result, { status: result.ok || result.unsupported ? 200 : 422 })
  }

  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json(demoModeResponse({
      ...result,
      saved: true,
      savedCount: result.ok ? result.articles.length : 0
    }))
  }

  const count = await prisma.article.count()

  const articles = await prisma.$transaction(
    result.articles.map((article, index) =>
      prisma.article.create({
        data: {
          number: article.number || `AR-${String(count + index + 1).padStart(4, "0")}`,
          name: article.name,
          category: article.category || null,
          description: article.description || null,
          unit: article.unit || "Stk",
          netPrice: article.netPrice,
          vatRate: article.vatRate ?? 19
        }
      })
    )
  )

  return NextResponse.json({
    ...result,
    saved: true,
    savedCount: articles.length,
    articles
  })
}
