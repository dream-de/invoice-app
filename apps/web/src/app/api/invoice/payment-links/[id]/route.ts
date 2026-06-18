import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { createProviderCheckoutUrl, normalizeProvider } from "@/lib/payment/online-payments"

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
  return null
}

async function requireInvoicePermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", "view")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer Zahlungslinks.", 403)
  }
  return user
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await requireInvoicePermission()
    const links = await prisma.paymentLink.findMany({ where: { invoiceId: id }, orderBy: { provider: "asc" } })
    return NextResponse.json({ ok: true, links })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    return NextResponse.json({ ok: false, error: "Zahlungslinks konnten nicht geladen werden." }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await requireInvoicePermission()
    const payload = await request.json().catch(() => ({}))
    const requestedProvider = typeof payload.provider === "string" ? normalizeProvider(payload.provider) : null
    const providers = requestedProvider ? [requestedProvider] : ["paypal", "stripe"] as const
    const invoice = await prisma.invoice.findUnique({ where: { id } })
    if (!invoice || invoice.type !== "invoice") {
      return NextResponse.json({ ok: false, error: "Rechnung nicht gefunden." }, { status: 404 })
    }

    const links = []
    for (const provider of providers) {
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
      links.push(link)
    }

    return NextResponse.json({ ok: true, links })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Payment link creation failed.", error)
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Zahlungslink konnte nicht erstellt werden." }, { status: 500 })
  }
}
