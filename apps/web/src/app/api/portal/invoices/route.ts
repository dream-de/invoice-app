import { NextResponse } from "next/server"
import { date, invoicePortalStatus, money, getPortalInvoices } from "@/lib/customer-portal/data"
import { portalAuthErrorResponse, requirePortalCustomer } from "@/lib/customer-portal/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const customer = await requirePortalCustomer()
    const invoices = await getPortalInvoices(customer.id, "invoice")
    return NextResponse.json({
      ok: true,
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        issueDate: date(invoice.issueDate),
        dueDate: date(invoice.dueDate),
        status: invoicePortalStatus(invoice.status, invoice.dueDate, invoice.paidAt),
        total: money(invoice.grossTotal),
        pdfUrl: `/api/invoice/pdf/${invoice.id}`
      }))
    })
  } catch (error) {
    const authError = portalAuthErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Rechnungen konnten nicht geladen werden." }, { status: 500 })
  }
}
