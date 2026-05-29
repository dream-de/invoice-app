import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

function toNumber(value: unknown) {
  return Number(String(value ?? "").replace(",", ".")) || 0
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()

    if (!data.name || String(data.name).trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: "Artikelname fehlt." },
        { status: 400 }
      )
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      const number = String(data.code || data.number || "").trim()

      return NextResponse.json(demoModeResponse({
        ok: true,
        article: {
          id,
          number,
          code: number,
          name: String(data.name).trim(),
          category: data.category ? String(data.category).trim() : null,
          description: data.description ? String(data.description).trim() : null,
          unit: data.unit ? String(data.unit).trim() : "Stk",
          netPrice: toNumber(data.price ?? data.netPrice),
          price: toNumber(data.price ?? data.netPrice),
          vatRate: toNumber(data.tax ?? data.vatRate ?? 19),
          tax: toNumber(data.tax ?? data.vatRate ?? 19),
          active: true
        }
      }))
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        number: String(data.code || data.number || "").trim(),
        name: String(data.name).trim(),
        category: data.category ? String(data.category).trim() : null,
        description: data.description ? String(data.description).trim() : null,
        unit: data.unit ? String(data.unit).trim() : "Stk",
        netPrice: toNumber(data.price ?? data.netPrice),
        vatRate: toNumber(data.tax ?? data.vatRate ?? 19)
      }
    })

    return NextResponse.json({ ok: true, article })
  } catch (error: unknown) {
    if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Artikelnummer existiert bereits." },
        { status: 409 }
      )
    }

    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Artikel konnte nicht aktualisiert werden." },
      { status: 500 }
    )
  }
}
