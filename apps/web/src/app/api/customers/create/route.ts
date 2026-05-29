import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

function demoCustomerFromData(data: Record<string, unknown>) {
  const number = String(data.number || "").trim() || "KD-DEMO-0001"

  return {
    id: "demo-" + Date.now(),
    number,
    name: String(data.name || "").trim(),
    contact: data.contact ? String(data.contact).trim() : null,
    email: data.email ? String(data.email).trim() : null,
    phone: data.phone ? String(data.phone).trim() : null,
    street: data.street ? String(data.street).trim() : null,
    zip: data.zip ? String(data.zip).trim() : null,
    city: data.city ? String(data.city).trim() : null,
    country: data.country ? String(data.country).trim() : "Deutschland",
    status: data.status ? String(data.status).trim() : "active"
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data.name || String(data.name).trim().length < 2) {
      return NextResponse.json(
        { error: "Kundenname fehlt." },
        { status: 400 }
      )
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        customer: demoCustomerFromData(data)
      }))
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
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Kundennummer existiert bereits." },
        { status: 409 }
      )
    }

    console.error(error)

    return NextResponse.json(
      { error: "Kunde konnte nicht erstellt werden." },
      { status: 500 }
    )
  }
}
