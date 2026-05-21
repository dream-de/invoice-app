import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

function toNumber(value: unknown) {
  return Number(String(value ?? "").replace(",", ".")) || 0
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const rows = Array.isArray(body.articles) ? body.articles : []

    if (!rows.length) {
      return NextResponse.json(
        { ok: false, error: "Keine Artikel erhalten." },
        { status: 400 }
      )
    }

    const startCount = await prisma.article.count()
    const saved = []

    for (const [index, row] of rows.entries()) {
      if (!row.name || String(row.name).trim().length < 2) continue

      const number =
        String(row.code || row.number || "").trim() ||
        `AR-${String(startCount + index + 1).padStart(4, "0")}`

      const article = await prisma.article.upsert({
        where: { number },
        create: {
          number,
          name: String(row.name).trim(),
          category: row.category ? String(row.category).trim() : null,
          description: row.description ? String(row.description).trim() : null,
          unit: row.unit ? String(row.unit).trim() : "Stk",
          netPrice: toNumber(row.price ?? row.netPrice),
          vatRate: toNumber(row.tax ?? row.vatRate ?? 19)
        },
        update: {
          name: String(row.name).trim(),
          category: row.category ? String(row.category).trim() : null,
          description: row.description ? String(row.description).trim() : null,
          unit: row.unit ? String(row.unit).trim() : "Stk",
          netPrice: toNumber(row.price ?? row.netPrice),
          vatRate: toNumber(row.tax ?? row.vatRate ?? 19),
          active: true
        }
      })

      saved.push(article)
    }

    return NextResponse.json({
      ok: true,
      savedCount: saved.length,
      articles: saved
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Artikel konnten nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
