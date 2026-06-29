import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { auditActor, requestContext, safeJson } from "@/lib/audit/audit-event-helpers"
import { logBackendAuditEvent } from "@/lib/audit/backendAuditEventWriter"
import { FINAPI_CALLBACK_PATH, FINAPI_PROVIDER, authErrorResponse, ensureCompanySettings, publicAccount, publicConnection, requireOpenBankingAdmin } from "../_shared"

export const dynamic = "force-dynamic"

async function loadConnections() {
  const [connections, accounts] = await Promise.all([
    prisma.bankConnection.findMany({ where: { provider: FINAPI_PROVIDER }, orderBy: [{ connectedAt: "desc" }, { createdAt: "desc" }] }),
    prisma.openBankingAccount.findMany({ where: { provider: FINAPI_PROVIDER }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] })
  ])

  return {
    connections: connections.map(publicConnection),
    accounts: accounts.map(publicAccount)
  }
}

export async function GET() {
  try {
    await requireOpenBankingAdmin()
    return NextResponse.json({ ok: true, ...await loadConnections() })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Open banking connections loading failed.", error)
    return NextResponse.json({ ok: false, error: "Bankverbindungen konnten nicht geladen werden." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireOpenBankingAdmin()
    const settings = await ensureCompanySettings()
    const url = new URL(request.url)
    const callbackUrl = new URL(FINAPI_CALLBACK_PATH, url.origin).toString()
    const now = new Date()

    const saved = await prisma.$transaction(async (tx) => {
      const connection = await tx.bankConnection.create({
        data: {
          companySettingsId: settings.id,
          provider: FINAPI_PROVIDER,
          providerConnectionId: "finapi-prepared-" + now.getTime(),
          displayName: "finAPI Sandbox Bank",
          status: "connected",
          consentStatus: "prepared",
          webhookUrl: callbackUrl,
          syncEnabled: false,
          connectedAt: now,
          lastSyncedAt: null,
          lastSyncStatus: "pending",
          auditState: "connection_saved"
        }
      })

      const hasDefault = await tx.openBankingAccount.findFirst({ where: { provider: FINAPI_PROVIDER, isDefault: true } })
      const account = await tx.openBankingAccount.create({
        data: {
          companySettingsId: settings.id,
          connectionId: connection.id,
          provider: FINAPI_PROVIDER,
          providerAccountId: "finapi-account-prepared-" + now.getTime(),
          accountName: "Geschaeftskonto finAPI",
          bankName: "finAPI Sandbox Bank",
          ibanMasked: "DE** **** **** **** 0130 00",
          currency: "EUR",
          currentBalance: 0,
          isDefault: !hasDefault,
          status: "prepared",
          lastSyncedAt: null
        }
      })

      const openInvoice = await tx.invoice.findFirst({
        where: { type: "invoice", status: { in: ["open", "sent", "overdue"] } },
        include: { customer: true },
        orderBy: { issueDate: "desc" }
      })

      if (openInvoice) {
        await tx.bankTransaction.create({
          data: {
            openBankingAccountId: account.id,
            provider: FINAPI_PROVIDER,
            providerTransactionId: "finapi-transaction-prepared-" + now.getTime(),
            amount: openInvoice.grossTotal,
            currency: "EUR",
            bookedAt: now,
            valueDate: now,
            purpose: "Zahlung " + openInvoice.number,
            counterpartyName: openInvoice.customer?.name || "Kunde",
            counterpartyIbanMasked: "DE** **** **** **** 0000 00",
            reference: openInvoice.number,
            status: "unmatched",
            paymentStatusAction: "prepared",
            rawData: { source: "phase10_3_prepared_preview", autoPaid: false }
          }
        })
      }

      return { connection, account }
    })

    await writeAuditLog({
      action: "open_banking.connection_start",
      entity: "BankConnection",
      entityId: saved.connection.id,
      reason: "finAPI bank connection prepared and saved",
      data: {
        provider: FINAPI_PROVIDER,
        userId: user.id,
        connectionId: saved.connection.id,
        accountId: saved.account.id,
        callbackPrepared: true,
        storesBankCredentials: false,
        tokensExposed: false
      }
    })
    await logBackendAuditEvent({
      type: "open_banking_bank_connected",
      source: "open_banking",
      severity: "success",
      title: "Bank verbunden",
      description: "finAPI Bankverbindung wurde vorbereitet und gespeichert.",
      actor: auditActor(user),
      requestContext: requestContext(request, user),
      integrationKey: "open_banking",
      moduleKey: "open_banking",
      entityType: "BankConnection",
      entityId: saved.connection.id,
      metadata: safeJson({
        provider: FINAPI_PROVIDER,
        bankName: saved.account.bankName,
        ibanMasked: saved.account.ibanMasked,
        accountName: saved.account.accountName,
        syncStatus: saved.connection.lastSyncStatus,
        storesBankCredentials: false,
        tokensExposed: false
      }),
      after: safeJson({ status: saved.connection.status, consentStatus: saved.connection.consentStatus })
    })
    await logBackendAuditEvent({
      type: "open_banking_consent_created",
      source: "open_banking",
      severity: "success",
      title: "Bank-Consent erstellt",
      description: "Open-Banking-Consent wurde vorbereitet.",
      actor: auditActor(user),
      requestContext: requestContext(request, user),
      integrationKey: "open_banking",
      moduleKey: "open_banking",
      entityType: "BankConnection",
      entityId: saved.connection.id,
      metadata: safeJson({ provider: FINAPI_PROVIDER, consentStatus: saved.connection.consentStatus })
    })

    return NextResponse.json({
      ok: true,
      message: "finAPI Verbindung vorbereitet und gespeichert.",
      redirectUrl: callbackUrl + "?connectionId=" + encodeURIComponent(saved.connection.id) + "&status=connected",
      connection: publicConnection(saved.connection),
      account: publicAccount(saved.account),
      ...await loadConnections()
    })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Open banking connection start failed.", error)
    return NextResponse.json({ ok: false, error: "Bankverbindung konnte nicht vorbereitet werden." }, { status: 500 })
  }
}
