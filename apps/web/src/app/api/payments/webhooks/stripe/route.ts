import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { refreshInvoicePaymentStatus } from "@/lib/payment/online-payments"

export async function POST(request: Request) {
  const event = await request.json().catch(() => null)
  if (!event?.type) return NextResponse.json({ ok: false, error: "Invalid Stripe webhook." }, { status: 400 })

  const session = event.data?.object || {}
  const providerPaymentId = String(session.id || "")
  const invoiceId = String(session.metadata?.invoiceId || session.client_reference_id || "")
  const status = event.type === "checkout.session.completed" ? "paid" : event.type === "checkout.session.expired" ? "canceled" : event.type.includes("failed") ? "failed" : "open"

  if (!invoiceId && !providerPaymentId) return NextResponse.json({ ok: true, ignored: true })

  await prisma.$transaction(async (tx) => {
    const link = providerPaymentId
      ? await tx.paymentLink.findFirst({ where: { provider: "stripe", providerPaymentId } })
      : null
    const targetInvoiceId = invoiceId || link?.invoiceId
    if (!targetInvoiceId) return

    await tx.paymentLink.updateMany({
      where: { invoiceId: targetInvoiceId, provider: "stripe" },
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
          await tx.payment.update({ where: { id: existingPayment.id }, data: { status: "paid", paidAt: new Date(), checkoutUrl: session.url || null } })
        } else {
          await tx.payment.create({
          data: {
            invoiceId: targetInvoiceId,
            amount: invoice.grossTotal,
            currency: "EUR",
            method: "Kreditkarte",
            reference: "Stripe Checkout",
            status: "paid",
            provider: "stripe",
            providerPaymentId,
            checkoutUrl: session.url || null,
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
