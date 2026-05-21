import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"

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
  } catch (error: any) {
    if (error?.code === "P2002") {
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
