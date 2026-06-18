import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { requirePortalCustomer } from "@/lib/customer-portal/auth"
import { createProviderCheckoutUrl, normalizeProvider } from "@/lib/payment/online-payments"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await requirePortalCustomer()
  const payload = await request.json().catch(() => ({}))
  const provider = normalizeProvider(String(payload.provider || "stripe"))
  if (!provider) return NextResponse.json({ ok: false, error: "Zahlungsanbieter ist ungueltig." }, { status: 400 })

  const invoice = await prisma.invoice.findFirst({ where: { id, customerId: customer.id, type: "invoice" } })
  if (!invoice) return NextResponse.json({ ok: false, error: "Rechnung nicht gefunden." }, { status: 404 })

  const checkout = await createProviderCheckoutUrl(provider, invoice, request)
  const link = await prisma.paymentLink.upsert({
    where: { invoiceId_provider: { invoiceId: invoice.id, provider } },
    update: {
      amount: invoice.grossTotal,
      status: "open",
      checkoutUrl: checkout.checkoutUrl,
      providerPaymentId: checkout.providerPaymentId,
      metadata: checkout.metadata
    },
    create: {
      invoiceId: invoice.id,
      provider,
      amount: invoice.grossTotal,
      currency: "EUR",
      checkoutUrl: checkout.checkoutUrl,
      providerPaymentId: checkout.providerPaymentId,
      metadata: checkout.metadata
    }
  })

  return NextResponse.json({ ok: true, link })
}


export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await requirePortalCustomer()
  const provider = normalizeProvider(new URL(request.url).searchParams.get("provider") || "stripe")
  if (!provider) return NextResponse.redirect(new URL("/portal/invoices?payment=invalid-provider", request.url))

  const invoice = await prisma.invoice.findFirst({ where: { id, customerId: customer.id, type: "invoice" } })
  if (!invoice) return NextResponse.redirect(new URL("/portal/invoices?payment=not-found", request.url))

  const checkout = await createProviderCheckoutUrl(provider, invoice, request)
  const link = await prisma.paymentLink.upsert({
    where: { invoiceId_provider: { invoiceId: invoice.id, provider } },
    update: {
      amount: invoice.grossTotal,
      status: "open",
      checkoutUrl: checkout.checkoutUrl,
      providerPaymentId: checkout.providerPaymentId,
      metadata: checkout.metadata
    },
    create: {
      invoiceId: invoice.id,
      provider,
      amount: invoice.grossTotal,
      currency: "EUR",
      checkoutUrl: checkout.checkoutUrl,
      providerPaymentId: checkout.providerPaymentId,
      metadata: checkout.metadata
    }
  })

  return NextResponse.redirect(link.checkoutUrl)
}
