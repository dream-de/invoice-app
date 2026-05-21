import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export const dynamic = "force-dynamic"

export async function GET() {
  const settings = await prisma.companySettings.findFirst({
    orderBy: { createdAt: "desc" }
  })

  return NextResponse.json({ ok: true, settings })
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()

    if (!data.company || String(data.company).trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: "Firmenname fehlt." },
        { status: 400 }
      )
    }

    const existing = await prisma.companySettings.findFirst({
      orderBy: { createdAt: "desc" }
    })

    const payload = {
      company: String(data.company).trim(),
      owner: data.owner || null,
      street: data.street || null,
      zip: data.zip || null,
      city: data.city || null,
      country: data.country || "Deutschland",
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      taxNumber: data.taxNumber || null,
      vatId: data.vatId || null,
      iban: data.iban || null,
      bic: data.bic || null,
      bankName: data.bankName || null,
      registerCourt: data.registerCourt || null,
      logoUrl: data.logoUrl || null
    }

    const settings = existing
      ? await prisma.companySettings.update({
          where: { id: existing.id },
          data: payload
        })
      : await prisma.companySettings.create({
          data: payload
        })

    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Stammdaten konnten nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
