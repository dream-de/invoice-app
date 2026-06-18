import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { portalAuthErrorResponse, requirePortalCustomer } from "@/lib/customer-portal/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const customer = await requirePortalCustomer()
    return NextResponse.json({ ok: true, customer })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Profil konnte nicht geladen werden." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const customer = await requirePortalCustomer()
    const data = await request.json()
    const updated = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        contact: String(data.contact ?? customer.contact ?? "").trim() || null,
        phone: String(data.phone ?? customer.phone ?? "").trim() || null,
        email: String(data.email ?? customer.email ?? "").trim() || null
      },
      select: {
        id: true,
        number: true,
        name: true,
        contact: true,
        email: true,
        phone: true,
        street: true,
        zip: true,
        city: true,
        country: true,
        portalEmail: true
      }
    })
    return NextResponse.json({ ok: true, customer: updated })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Profil konnte nicht gespeichert werden." }, { status: 500 })
  }
}
