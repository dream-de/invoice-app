import { NextResponse } from "next/server"
import { prisma, type Prisma } from "@dream-invoice/database"
import { z } from "zod"
import { writeAuditLog } from "@/lib/audit/log"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import { readJsonBodyWithLimit, RequestBodyError } from "@/lib/http/request-body"

const MAX_PAYMENT_AMOUNT = 999_999_999

function parseStrictMoney(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN
  if (typeof value !== "string") return Number.NaN

  const normalized = value.trim().replace(/\./g, "").replace(",", ".")
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN

  return Number(normalized)
}

const paymentSchema = z.object({
  paymentId: z.string().trim().min(1).max(128).optional(),
  amount: z.preprocess(
    parseStrictMoney,
    z.number()
      .finite("Betrag muss eine gueltige Zahl sein.")
      .positive("Betrag muss groesser als 0 sein.")
      .max(MAX_PAYMENT_AMOUNT, "Betrag ist zu gross.")
  ),
  paidAt: z.coerce.date("Zahlungsdatum ist ungueltig."),
  method: z.string().trim().min(1, "Zahlungsart fehlt.").max(80, "Zahlungsart ist zu lang."),
  reason: z.string().trim().min(1, "Grund ist erforderlich.").max(500, "Grund ist zu lang.")
})

const deleteSchema = z.object({
  paymentId: z.string().trim().min(1).max(128)
})

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

function validationErrorResponse(error: z.ZodError) {
  return NextResponse.json(
    {
      ok: false,
      error: error.issues[0]?.message ?? "Ungueltige Zahlungsdaten.",
      code: "invalid_payment_payload",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    },
    { status: 400 }
  )
}

function requestBodyErrorResponse(error: RequestBodyError) {
  return NextResponse.json(
    { ok: false, error: error.message, code: error.code },
    { status: error.status }
  )
}

async function requireInvoicePermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", "edit")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Rechnungsaktion.", 403)
  }

  return user
}

async function updateInvoicePaymentStatus(tx: Prisma.TransactionClient, invoiceId: string) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: { orderBy: { paidAt: "desc" } } }
  })

  if (!invoice) {
    throw new AuthServiceError("not_found", "Rechnung nicht gefunden.", 404)
  }

  const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  const grossTotal = Number(invoice.grossTotal)
  const isFullyPaid = grossTotal > 0 && paidAmount >= grossTotal
  const isPastDue = invoice.dueDate ? invoice.dueDate.getTime() < Date.now() : false
  const nextStatus = isFullyPaid
    ? "paid"
    : invoice.status === "paid"
      ? isPastDue ? "overdue" : "open"
      : invoice.status
  const paidAt = isFullyPaid ? invoice.payments[0]?.paidAt ?? new Date() : null

  return tx.invoice.update({
    where: { id: invoiceId },
    data: {
      status: nextStatus,
      paidAt
    },
    include: {
      customer: true,
      positions: { orderBy: { sortOrder: "asc" } },
      payments: { orderBy: { paidAt: "desc" } }
    }
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const parsed = paymentSchema.safeParse(await readJsonBodyWithLimit(request, { invalidJson: "throw" }))

    if (!parsed.success) {
      return validationErrorResponse(parsed.error)
    }

    const data = parsed.data

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        payment: {
          id: data.paymentId ?? "demo-payment",
          invoiceId: id,
          amount: data.amount,
          currency: "EUR",
          method: data.method,
          reference: data.reason,
          paidAt: data.paidAt.toISOString()
        }
      }))
    }

    const actor = await requireInvoicePermission()

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({ where: { id } })

      if (!invoice) {
        throw new AuthServiceError("not_found", "Rechnung nicht gefunden.", 404)
      }

      if (invoice.type !== "invoice") {
        throw new AuthServiceError("invalid_request", "Zahlungen koennen nur fuer Rechnungen erfasst werden.", 400)
      }

      const existingPayment = data.paymentId
        ? await tx.payment.findFirst({
          where: { id: data.paymentId, invoiceId: id },
          select: { id: true }
        })
        : null

      if (data.paymentId && !existingPayment) {
        throw new AuthServiceError("not_found", "Zahlung nicht gefunden.", 404)
      }

      const payment = existingPayment
        ? await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount: data.amount,
            method: data.method,
            reference: data.reason,
            paidAt: data.paidAt
          }
        })
        : await tx.payment.create({
          data: {
            invoiceId: id,
            amount: data.amount,
            currency: "EUR",
            method: data.method,
            reference: data.reason,
            paidAt: data.paidAt
          }
        })

      const updatedInvoice = await updateInvoicePaymentStatus(tx, id)

      await writeAuditLog({
        action: data.paymentId ? "invoice.payment.update" : "invoice.payment.create",
        entity: "payment",
        entityId: payment.id,
        reason: data.reason,
        data: {
          actorUserId: actor.id,
          invoiceId: id,
          invoiceNumber: invoice.number,
          amount: data.amount,
          method: data.method,
          paidAt: data.paidAt.toISOString()
        }
      }, { client: tx, throwOnError: true })

      return { payment, invoice: updatedInvoice }
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error)

    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Payment save failed.", error)
    return NextResponse.json(
      { ok: false, error: "Zahlung konnte nicht gespeichert werden." },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const parsed = deleteSchema.safeParse(await readJsonBodyWithLimit(request, { invalidJson: "throw" }))

    if (!parsed.success) {
      return validationErrorResponse(parsed.error)
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true }))
    }

    const actor = await requireInvoicePermission()

    const result = await prisma.$transaction(async (tx) => {
      const existingPayment = await tx.payment.findFirst({
        where: {
          id: parsed.data.paymentId,
          invoiceId: id
        },
        select: { id: true }
      })

      if (!existingPayment) {
        throw new AuthServiceError("not_found", "Zahlung nicht gefunden.", 404)
      }

      const payment = await tx.payment.delete({
        where: { id: existingPayment.id },
        include: { invoice: true }
      })

      const updatedInvoice = await updateInvoicePaymentStatus(tx, id)

      await writeAuditLog({
        action: "invoice.payment.delete",
        entity: "payment",
        entityId: payment.id,
        reason: payment.reference,
        data: {
          actorUserId: actor.id,
          invoiceId: id,
          invoiceNumber: payment.invoice?.number,
          amount: Number(payment.amount),
          method: payment.method,
          paidAt: payment.paidAt.toISOString()
        }
      }, { client: tx, throwOnError: true })

      return { invoice: updatedInvoice }
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    if (error instanceof RequestBodyError) return requestBodyErrorResponse(error)

    const authError = authErrorResponse(error)
    if (authError) return authError

    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Zahlung nicht gefunden." },
        { status: 404 }
      )
    }

    console.error("Payment delete failed.", error)
    return NextResponse.json(
      { ok: false, error: "Zahlung konnte nicht geloescht werden." },
      { status: 500 }
    )
  }
}
