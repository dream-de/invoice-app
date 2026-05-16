import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data.name || String(data.name).trim().length < 2) {
      return NextResponse.json(
        { error: "Kundenname fehlt." },
        { status: 400 }
      )
    }

    const count = await prisma.customer.count()
    const number = data.number?.trim() || `KD-${String(count + 1).padStart(4, "0")}`

    const customer = await prisma.customer.create({
      data: {
        number,
        name: data.name,
        contact: data.contact || null,
        email: data.email || null,
        phone: data.phone || null,
        street: data.street || null,
        zip: data.zip || null,
        city: data.city || null,
        country: data.country || "Deutschland",
        status: data.status || "active"
      }
    })

    return NextResponse.json({ ok: true, customer })
  } catch (error: any) {
    console.error(error)

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Kundennummer existiert bereits." },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: "Kunde konnte nicht erstellt werden." },
      { status: 500 }
    )
  }
}
