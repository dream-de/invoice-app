import { NextResponse } from "next/server"
import { changePortalPassword, portalAuthErrorResponse, requirePortalCustomer } from "@/lib/customer-portal/auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const customer = await requirePortalCustomer()
    const data = await request.json()
    await changePortalPassword(customer.id, data.currentPassword, data.nextPassword)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Passwort konnte nicht geaendert werden." }, { status: 500 })
  }
}
