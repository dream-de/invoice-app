import { NextResponse } from "next/server"
import { getPortalDashboard } from "@/lib/customer-portal/data"
import { portalAuthErrorResponse, requirePortalCustomer } from "@/lib/customer-portal/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const customer = await requirePortalCustomer()
    const dashboard = await getPortalDashboard(customer.id)
    return NextResponse.json({
      ok: true,
      customer,
      counts: {
        openInvoices: dashboard.openInvoices.length,
        offers: dashboard.offers.length,
        documents: dashboard.attachments.length
      },
      activities: dashboard.activities
    })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Dashboard konnte nicht geladen werden." }, { status: 500 })
  }
}
