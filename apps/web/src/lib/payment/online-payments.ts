import { prisma, type Prisma } from "@dream-invoice/database"

export type OnlinePaymentProvider = "paypal" | "stripe"
export type OnlinePaymentStatus = "open" | "paid" | "failed" | "canceled"

const STRIPE_API_VERSION = "2026-02-25.clover"

export function normalizeProvider(value: string): OnlinePaymentProvider | null {
  const provider = value.toLowerCase()
  return provider === "paypal" || provider === "stripe" ? provider : null
}

export function paymentStatusLabel(status: string) {
  if (status === "paid") return "Bezahlt"
  if (status === "failed") return "Fehlgeschlagen"
  if (status === "canceled" || status === "cancelled") return "Storniert"
  return "Offen"
}

export function appBaseUrl(request?: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configured) return configured.replace(/\/$/, "")
  if (request) return new URL(request.url).origin
  return "http://localhost:" + (process.env.PORT || "3010")
}

export async function ensureProviderConfigs() {
  const settings = await prisma.companySettings.findFirst({ orderBy: { createdAt: "desc" } })
  if (!settings) return []

  for (const provider of ["paypal", "stripe"] as const) {
    await prisma.paymentProviderConfig.upsert({
      where: { companySettingsId_provider: { companySettingsId: settings.id, provider } },
      update: {},
      create: {
        companySettingsId: settings.id,
        provider,
        enabled: false,
        lastStatus: "open"
      }
    })
  }

  return prisma.paymentProviderConfig.findMany({
    where: { companySettingsId: settings.id },
    orderBy: { provider: "asc" }
  })
}

export async function createProviderCheckoutUrl(provider: OnlinePaymentProvider, invoice: {
  id: string
  number: string
  grossTotal: Prisma.Decimal | number
}, request: Request) {
  const config = await prisma.paymentProviderConfig.findFirst({ where: { provider } })
  const amount = Number(invoice.grossTotal || 0)
  const baseUrl = appBaseUrl(request)
  const portalReturnUrl = baseUrl + "/portal/invoices"

  if (!config?.enabled || !config.apiKey || !config.secretKey || amount <= 0) {
    return {
      checkoutUrl: baseUrl + "/portal/invoices?pay=" + encodeURIComponent(invoice.id) + "&provider=" + provider,
      providerPaymentId: null,
      metadata: { mode: "local", reason: "provider_not_configured" }
    }
  }

  if (provider === "stripe") {
    const body = new URLSearchParams()
    body.set("mode", "payment")
    body.set("success_url", portalReturnUrl + "?payment=stripe-success&invoice=" + encodeURIComponent(invoice.id))
    body.set("cancel_url", portalReturnUrl + "?payment=stripe-cancel&invoice=" + encodeURIComponent(invoice.id))
    body.set("client_reference_id", invoice.id)
    body.set("metadata[invoiceId]", invoice.id)
    body.set("metadata[invoiceNumber]", invoice.number)
    body.set("line_items[0][quantity]", "1")
    body.set("line_items[0][price_data][currency]", "eur")
    body.set("line_items[0][price_data][unit_amount]", String(Math.round(amount * 100)))
    body.set("line_items[0][price_data][product_data][name]", "Rechnung " + invoice.number)

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        authorization: "Bearer " + config.secretKey,
        "content-type": "application/x-www-form-urlencoded",
        "stripe-version": STRIPE_API_VERSION
      },
      body
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok || !result.url) {
      throw new Error(String(result.error?.message || "Stripe Checkout konnte nicht erstellt werden."))
    }
    return { checkoutUrl: String(result.url), providerPaymentId: String(result.id), metadata: result }
  }

  const tokenResponse = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      authorization: "Basic " + Buffer.from(config.apiKey + ":" + config.secretKey).toString("base64"),
      "content-type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  })
  const tokenResult = await tokenResponse.json().catch(() => ({}))
  if (!tokenResponse.ok || !tokenResult.access_token) {
    throw new Error(String(tokenResult.error_description || "PayPal Verbindung fehlgeschlagen."))
  }

  const orderResponse = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
    method: "POST",
    headers: {
      authorization: "Bearer " + tokenResult.access_token,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: invoice.id,
        invoice_id: invoice.number,
        amount: { currency_code: "EUR", value: amount.toFixed(2) }
      }],
      application_context: {
        return_url: portalReturnUrl + "?payment=paypal-success&invoice=" + encodeURIComponent(invoice.id),
        cancel_url: portalReturnUrl + "?payment=paypal-cancel&invoice=" + encodeURIComponent(invoice.id)
      }
    })
  })
  const orderResult = await orderResponse.json().catch(() => ({}))
  const approval = Array.isArray(orderResult.links) ? orderResult.links.find((link: { rel?: string }) => link.rel === "approve") : null
  if (!orderResponse.ok || !approval?.href) {
    throw new Error(String(orderResult.message || "PayPal Link konnte nicht erstellt werden."))
  }
  return { checkoutUrl: String(approval.href), providerPaymentId: String(orderResult.id), metadata: orderResult }
}

export async function refreshInvoicePaymentStatus(tx: Prisma.TransactionClient, invoiceId: string) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true, paymentLinks: true }
  })
  if (!invoice) return null

  const paidAmount = invoice.payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0)
  const grossTotal = Number(invoice.grossTotal || 0)
  const failed = invoice.paymentLinks.some((link) => link.status === "failed")
  const canceled = invoice.paymentLinks.length > 0 && invoice.paymentLinks.every((link) => link.status === "canceled")
  const isPaid = grossTotal > 0 && paidAmount >= grossTotal
  const nextStatus = isPaid ? "paid" : failed ? "failed" : canceled ? "canceled" : invoice.status === "paid" ? "open" : invoice.status

  return tx.invoice.update({
    where: { id: invoiceId },
    data: { status: nextStatus, paidAt: isPaid ? new Date() : null }
  })
}
