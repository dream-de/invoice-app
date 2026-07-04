import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { auditActor, requestContext, safeJson } from "@/lib/audit/audit-event-helpers"
import { logBackendAuditEvent } from "@/lib/audit/backendAuditEventWriter"
import { FINAPI_CALLBACK_PATH, FINAPI_PROVIDER, authErrorResponse, requireOpenBankingAdmin } from "../_shared"

export const dynamic = "force-dynamic"

function hasActiveFinApiProvider(config: { enabled?: boolean | null; apiKey?: string | null; secretKey?: string | null } | null) {
  return Boolean(config?.enabled && config.apiKey?.trim() && config.secretKey?.trim())
}

export async function GET(request: Request) {
  try {
    const user = await requireOpenBankingAdmin()
    const configured = await prisma.paymentProviderConfig.findFirst({ where: { provider: FINAPI_PROVIDER } })
    const providerConfigured = hasActiveFinApiProvider(configured)
    const connections = providerConfigured ? await prisma.bankConnection.count({ where: { provider: FINAPI_PROVIDER } }) : 0
    await writeAuditLog({
      action: "open_banking.status_check",
      entity: "BankConnection",
      reason: "finAPI status checked",
      data: { provider: FINAPI_PROVIDER, actorUserId: user.id, configured: providerConfigured, connections },
      outcome: providerConfigured ? "success" : "blocked",
      requestMetadata: getAuditRequestMetadata(request)
    })
    await logBackendAuditEvent({
      type: providerConfigured ? "open_banking_sync_success" : "open_banking.connection_blocked",
      source: "open_banking",
      severity: providerConfigured ? "info" : "warning",
      title: "Open-Banking-Status geprueft",
      description: "finAPI Status wurde geprueft.",
      actor: auditActor(user),
      requestContext: requestContext(request, user),
      integrationKey: "open_banking",
      moduleKey: "open_banking",
      metadata: safeJson({ provider: FINAPI_PROVIDER, configured: providerConfigured, connectionCount: connections, syncStatus: "status_checked" })
    })

    const url = new URL(request.url)
    return NextResponse.json({
      ok: true,
      provider: FINAPI_PROVIDER,
      configured: providerConfigured,
      credentialsPrepared: providerConfigured,
      connectionCount: connections,
      callbackUrl: new URL(FINAPI_CALLBACK_PATH, url.origin).toString(),
      mode: providerConfigured ? "active" : "not_configured",
      storesBankCredentials: false,
      exposesTokensToFrontend: false
    })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Open banking status failed.", error)
    return NextResponse.json({ ok: false, error: "finAPI Status konnte nicht geprueft werden." }, { status: 500 })
  }
}
