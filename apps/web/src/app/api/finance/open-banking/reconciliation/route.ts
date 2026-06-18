import { NextResponse } from "next/server"
import { Prisma, prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { authErrorResponse, publicAccount, requireOpenBankingAdmin } from "../_shared"

export const dynamic = "force-dynamic"

const OPEN_INVOICE_STATUSES = ["open", "sent", "overdue"]

type OpenInvoice = {
  id: string
  number: string
  status: string
  grossTotal: unknown
  ibanSnapshot: string | null
  customer: { name: string; iban?: string | null } | null
}

type BankMovement = {
  id: string
  amount: unknown
  currency: string
  bookedAt: Date | null
  valueDate: Date | null
  purpose: string | null
  counterpartyName: string | null
  counterpartyIbanMasked: string | null
  reference: string | null
  status: string
  matchConfidence: unknown
  paymentStatusAction: string
  matchedInvoiceId: string | null
  linkedInvoiceId?: string | null
  matchedAt?: Date | null
  matchedBy?: string | null
  openBankingAccount: Parameters<typeof publicAccount>[0]
}

function normalize(value: unknown) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")
}

function amount(value: unknown) {
  return Math.round(Math.abs(Number(value) || 0) * 100)
}

function isIncomingPayment(transaction: BankMovement) {
  return Number(transaction.amount) > 0
}

function findMatch(transaction: BankMovement, invoices: OpenInvoice[]) {
  const purpose = normalize([transaction.purpose, transaction.reference].join(" "))
  const party = normalize(transaction.counterpartyName)
  const iban = normalize(transaction.counterpartyIbanMasked)
  const transactionAmount = amount(transaction.amount)

  let best: { invoice: OpenInvoice; score: number; reasons: string[]; exactNumber: boolean; exactAmount: boolean; partyMatch: boolean; ibanMatch: boolean } | null = null
  for (const invoice of invoices) {
    let score = 0
    const reasons: string[] = []
    const invoiceNumber = normalize(invoice.number)
    const invoiceAmount = amount(invoice.grossTotal)
    const customer = normalize(invoice.customer?.name)
    const invoiceIban = normalize(invoice.ibanSnapshot)
    const exactNumber = Boolean(invoiceNumber && purpose.includes(invoiceNumber))
    const exactAmount = invoiceAmount > 0 && invoiceAmount === transactionAmount
    const partyMatch = Boolean(customer && (purpose.includes(customer) || party.includes(customer)))
    const ibanMatch = Boolean(invoiceIban && iban && invoiceIban === iban)

    if (exactNumber) {
      score += 45
      reasons.push("Rechnungsnummer")
    }
    if (exactAmount) {
      score += 30
      reasons.push("Betrag")
    }
    if (partyMatch) {
      score += 20
      reasons.push("Kunde")
    }
    if (ibanMatch) {
      score += 10
      reasons.push("IBAN")
    }

    if (!best || score > best.score) best = { invoice, score, reasons, exactNumber, exactAmount, partyMatch, ibanMatch }
  }

  if (!best || best.score < 30) {
    return { status: "Kein Treffer", invoice: null, confidence: 0, reasons: [], automatic: false }
  }

  const invoiceIsOpen = OPEN_INVOICE_STATUSES.includes(best.invoice.status)
  const automatic = best.exactNumber && best.exactAmount && (best.partyMatch || best.ibanMatch) && invoiceIsOpen && isIncomingPayment(transaction)

  return {
    status: automatic ? "Sicherer Treffer" : best.score >= 70 ? "Sicherer Treffer" : "Moeglicher Treffer",
    invoice: {
      id: best.invoice.id,
      number: best.invoice.number,
      customer: best.invoice.customer?.name ?? "Unbekannt",
      amount: Number(best.invoice.grossTotal)
    },
    confidence: automatic ? 100 : Math.min(best.score, 99),
    reasons: best.reasons,
    automatic
  }
}

async function writeAudit(client: Prisma.TransactionClient | typeof prisma, input: Parameters<typeof writeAuditLog>[0]) {
  await writeAuditLog(input, { client })
}

async function markInvoicePaidFromBankMatch(
  tx: Prisma.TransactionClient,
  transaction: BankMovement,
  invoiceId: string,
  matchedBy: "automatic" | "manual",
  confidence: number,
  userId: string
) {
  const paidAt = transaction.bookedAt ?? transaction.valueDate ?? new Date()
  await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "paid",
      paidAt,
      paymentMethod: "bank_transfer",
      bankTransactionId: transaction.id,
      matchedBy
    }
  })
  await tx.bankTransaction.update({
    where: { id: transaction.id },
    data: {
      matchedInvoiceId: invoiceId,
      linkedInvoiceId: invoiceId,
      status: "matched",
      matchConfidence: confidence,
      matchedAt: new Date(),
      matchedBy,
      paymentStatusAction: matchedBy === "automatic" ? "auto_paid" : "manual_paid"
    }
  })
  await writeAudit(tx, {
    action: matchedBy === "automatic" ? "payment.auto_matched" : "payment.manual_matched",
    entity: "BankTransaction",
    entityId: transaction.id,
    reason: matchedBy === "automatic" ? "Secure bank transaction automatically matched" : "Manual bank transaction match confirmed",
    data: { userId, invoiceId, confidence, autoPaid: matchedBy === "automatic", tokensExposed: false }
  })
  await writeAudit(tx, {
    action: "invoice.marked_paid",
    entity: "Invoice",
    entityId: invoiceId,
    reason: matchedBy === "automatic" ? "Invoice marked paid by secure bank reconciliation" : "Invoice marked paid by manual bank reconciliation",
    data: {
      userId,
      bankTransactionId: transaction.id,
      paymentMethod: "bank_transfer",
      matchedBy,
      paidAt: paidAt.toISOString()
    }
  })
}

async function applyAutomaticMatches(userId: string) {
  const [transactions, invoices] = await Promise.all([
    prisma.bankTransaction.findMany({
      where: {
        provider: "finapi",
        status: { not: "matched" },
        matchedInvoiceId: null
      },
      include: { openBankingAccount: true },
      orderBy: [{ bookedAt: "desc" }, { createdAt: "desc" }],
      take: 100
    }),
    prisma.invoice.findMany({
      where: { type: "invoice", status: { in: OPEN_INVOICE_STATUSES } },
      include: { customer: true },
      orderBy: { issueDate: "desc" },
      take: 200
    })
  ])

  let autoMatched = 0
  for (const transaction of transactions) {
    const suggestion = findMatch(transaction, invoices)
    if (!suggestion.automatic || !suggestion.invoice) continue
    await prisma.$transaction(async (tx) => {
      const freshInvoice = await tx.invoice.findUnique({ where: { id: suggestion.invoice.id } })
      const freshTransaction = await tx.bankTransaction.findUnique({
        where: { id: transaction.id },
        include: { openBankingAccount: true }
      })
      if (!freshInvoice || !freshTransaction) return
      if (!OPEN_INVOICE_STATUSES.includes(freshInvoice.status) || freshTransaction.status === "matched") return
      await markInvoicePaidFromBankMatch(tx, freshTransaction, freshInvoice.id, "automatic", 100, userId)
      autoMatched += 1
    })
  }

  return autoMatched
}

async function loadReconciliation() {
  const [transactions, invoices] = await Promise.all([
    prisma.bankTransaction.findMany({
      where: { provider: "finapi" },
      include: { openBankingAccount: true, matchedInvoice: { include: { customer: true } } },
      orderBy: [{ bookedAt: "desc" }, { createdAt: "desc" }],
      take: 100
    }),
    prisma.invoice.findMany({
      where: { type: "invoice", status: { in: OPEN_INVOICE_STATUSES } },
      include: { customer: true },
      orderBy: { issueDate: "desc" },
      take: 200
    })
  ])

  const openInvoices = invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    customer: invoice.customer?.name ?? "Unbekannt",
    amount: Number(invoice.grossTotal),
    status: invoice.status
  }))

  const items = transactions.map((transaction) => {
    const suggestion = transaction.status === "matched" ? null : findMatch(transaction, invoices)
    const linkedInvoice = transaction.matchedInvoice
    return {
      id: transaction.id,
      account: publicAccount(transaction.openBankingAccount),
      date: (transaction.bookedAt ?? transaction.valueDate ?? transaction.createdAt).toISOString(),
      amount: Number(transaction.amount),
      currency: transaction.currency,
      purpose: transaction.purpose ?? "",
      counterparty: transaction.counterpartyName ?? "",
      matchStatus: transaction.status === "matched"
        ? transaction.matchedBy === "automatic" ? "Automatisch zugeordnet" : "Manuell zugeordnet"
        : suggestion?.status === "Moeglicher Treffer" ? "Manuell pruefen" : suggestion?.status ?? "Kein Treffer",
      matchedInvoiceId: transaction.matchedInvoiceId,
      linkedInvoiceId: transaction.linkedInvoiceId,
      matchedAt: transaction.matchedAt?.toISOString() ?? null,
      matchedBy: transaction.matchedBy,
      paymentStatusAction: transaction.paymentStatusAction,
      suggestedInvoice: linkedInvoice ? {
        id: linkedInvoice.id,
        number: linkedInvoice.number,
        customer: linkedInvoice.customer?.name ?? "Unbekannt",
        amount: Number(linkedInvoice.grossTotal)
      } : suggestion?.invoice ?? null,
      confidence: Number(transaction.matchConfidence ?? suggestion?.confidence ?? 0),
      reasons: suggestion?.reasons ?? [],
      invoicePaidByBankMatch: transaction.status === "matched" ? {
        label: "Bezahlt durch Bankabgleich",
        date: transaction.matchedAt?.toISOString() ?? null,
        bankTransactionId: transaction.id
      } : null
    }
  })

  return { transactions: items, openInvoices }
}

export async function GET() {
  try {
    const user = await requireOpenBankingAdmin()
    const autoMatched = await applyAutomaticMatches(user.id)
    const data = await loadReconciliation()
    const suggested = data.transactions.filter((item) => item.suggestedInvoice && item.matchStatus !== "Automatisch zugeordnet").length
    if (suggested > 0) {
      await writeAuditLog({
        action: "payment.match_suggested",
        entity: "BankTransaction",
        reason: "Payment match suggestions prepared",
        data: { userId: user.id, suggested, autoMatched, tokensExposed: false }
      })
    }

    return NextResponse.json({ ok: true, autoMatched, ...data })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Payment reconciliation loading failed.", error)
    return NextResponse.json({ ok: false, error: "Zahlungsabgleich konnte nicht geladen werden." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOpenBankingAdmin()
    const payload = await request.json().catch(() => ({}))
    const transactionId = String(payload.transactionId ?? "")
    const invoiceId = String(payload.invoiceId ?? "")
    if (!transactionId || !invoiceId) {
      return NextResponse.json({ ok: false, error: "Bankbewegung und Rechnung sind erforderlich." }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const [transaction, invoice] = await Promise.all([
        tx.bankTransaction.findUnique({ where: { id: transactionId }, include: { openBankingAccount: true } }),
        tx.invoice.findUnique({ where: { id: invoiceId } })
      ])
      if (!transaction || !invoice) return { ok: false as const, status: 404, error: "Bankbewegung oder Rechnung wurde nicht gefunden." }
      if (!OPEN_INVOICE_STATUSES.includes(invoice.status)) return { ok: false as const, status: 409, error: "Rechnung ist nicht offen." }
      if (!isIncomingPayment(transaction)) return { ok: false as const, status: 400, error: "Bankbewegung ist kein Zahlungseingang." }

      await markInvoicePaidFromBankMatch(tx, transaction, invoice.id, "manual", 75, user.id)
      return { ok: true as const }
    })

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status })
    }

    return NextResponse.json({ ok: true, message: "Zuordnung bestaetigt. Rechnung wurde per Bankabgleich als bezahlt markiert.", ...await loadReconciliation() })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Payment reconciliation update failed.", error)
    return NextResponse.json({ ok: false, error: "Zuordnung konnte nicht bestaetigt werden." }, { status: 500 })
  }
}
