import { NextResponse } from "next/server"
import { date, money, getPortalInvoices } from "@/lib/customer-portal/data"
import { portalAuthErrorResponse, requirePortalCustomer } from "@/lib/customer-portal/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const customer = await requirePortalCustomer()
    const offers = await getPortalInvoices(customer.id, "offer")
    return NextResponse.json({
      ok: true,
      offers: offers.map((offer) => ({
        id: offer.id,
        number: offer.number,
        issueDate: date(offer.issueDate),
        status: offer.status,
        total: money(offer.grossTotal),
        pdfUrl: `/api/offer/pdf/${offer.id}`,
        acceptancePrepared: true
      }))
    })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Angebote konnten nicht geladen werden." }, { status: 500 })
  }
}
