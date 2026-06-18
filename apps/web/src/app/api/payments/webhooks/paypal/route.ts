import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { refreshInvoicePaymentStatus } from "@/lib/payment/online-payments"

export async function POST(request: Request) {
  const event = await request.json().catch(() => null)
  if (!event?.event_type) return NextResponse.json({ ok: false, error: "Invalid PayPal webhook." }, { status: 400 })

  const resource = event.resource || {}
  const providerPaymentId = String(resource.id || resource.supplementary_data?.related_ids?.order_id || "")
  const invoiceId = String(resource.purchase_units?.[0]?.reference_id || resource.invoice_id || "")
  const status = event.event_type === "CHECKOUT.ORDER.APPROVED" || event.event_type === "PAYMENT.CAPTURE.COMPLETED" ? "paid" : event.event_type.includes("DENIED") ? "failed" : event.event_type.includes("VOIDED") ? "canceled" : "open"

  if (!invoiceId && !providerPaymentId) return NextResponse.json({ ok: true, ignored: true })

  await prisma.$transaction(async (tx) => {
    const link = providerPaymentId
      ? await tx.paymentLink.findFirst({ where: { provider: "paypal", providerPaymentId } })
      : null
    const targetInvoiceId = invoiceId || link?.invoiceId
    if (!targetInvoiceId) return

    await tx.paymentLink.updateMany({
      where: { invoiceId: targetInvoiceId, provider: "paypal" },
      data: {
        status,
        providerPaymentId: providerPaymentId || undefined,
        paidAt: status === "paid" ? new Date() : undefined,
        failedAt: status === "failed" ? new Date() : undefined,
        canceledAt: status === "canceled" ? new Date() : undefined,
        metadata: event
      }
    })

    if (status === "paid") {
      const invoice = await tx.invoice.findUnique({ where: { id: targetInvoiceId } })
      if (invoice) {
        const existingPayment = await tx.payment.findUnique({ where: { providerPaymentId } })
        if (existingPayment) {
          await tx.payment.update({ where: { id: existingPayment.id }, data: { status: "paid", paidAt: new Date() } })
        } else {
          await tx.payment.create({
          data: {
            invoiceId: targetInvoiceId,
            amount: invoice.grossTotal,
            currency: "EUR",
            method: "PayPal",
            reference: "PayPal Checkout",
            status: "paid",
            provider: "paypal",
            providerPaymentId,
            paidAt: new Date()
          }
        })
        }
      }
    }

    await refreshInvoicePaymentStatus(tx, targetInvoiceId)
  })

  return NextResponse.json({ ok: true })
}
