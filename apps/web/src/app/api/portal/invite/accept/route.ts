import { NextResponse } from "next/server"
import { acceptCustomerPortalInvite, portalAuthErrorResponse, setCustomerPortalSession } from "@/lib/customer-portal/auth"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const customerId = await acceptCustomerPortalInvite(data)
    await setCustomerPortalSession(customerId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    console.error("Customer portal invite failed.", error)
    return NextResponse.json({ ok: false, error: "Einladung konnte nicht verarbeitet werden." }, { status: 500 })
  }
}
