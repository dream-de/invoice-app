import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { FINAPI_PROVIDER, authErrorResponse, ensureCompanySettings, publicAccount, publicConnection, requireOpenBankingAdmin } from "../_shared"

export const dynamic = "force-dynamic"

function hasActiveFinApiProvider(config: { enabled?: boolean | null; apiKey?: string | null; secretKey?: string | null } | null) {
  return Boolean(config?.enabled && config.apiKey?.trim() && config.secretKey?.trim())
}

async function loadConnections() {
  const configured = await prisma.paymentProviderConfig.findFirst({ where: { provider: FINAPI_PROVIDER } })
  if (!hasActiveFinApiProvider(configured)) {
    return { connections: [], accounts: [] }
  }

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
    await writeAuditLog({
      action: "open_banking.connection_start",
      entity: "BankConnection",
      reason: "Banking connection start requested",
      data: { provider: FINAPI_PROVIDER, actorUserId: user.id, demo: false },
      requestMetadata: getAuditRequestMetadata(request)
    })
    const providerConfig = await prisma.paymentProviderConfig.findFirst({ where: { companySettingsId: settings.id, provider: FINAPI_PROVIDER } })
    if (!hasActiveFinApiProvider(providerConfig)) {
      await writeAuditLog({
        action: "open_banking.connection_blocked",
        entity: "BankConnection",
        reason: "finAPI provider not configured",
        data: { provider: FINAPI_PROVIDER, actorUserId: user.id, configured: false },
        outcome: "blocked",
        requestMetadata: getAuditRequestMetadata(request)
      })
      return NextResponse.json({
        ok: false,
        code: "provider_not_configured",
        error: "Open Banking noch nicht konfiguriert. Für echte PSD2-Bankverbindungen muss ein Banking-Provider konfiguriert werden."
      }, { status: 409 })
    }

    await writeAuditLog({
      action: "open_banking.connection_requires_live_provider",
      entity: "BankConnection",
      reason: "finAPI live consent flow not implemented",
      data: { provider: FINAPI_PROVIDER, actorUserId: user.id, configured: true },
      outcome: "failed",
      requestMetadata: getAuditRequestMetadata(request)
    })
    return NextResponse.json({
      ok: false,
      code: "live_provider_flow_required",
      error: "Open Banking Provider ist konfiguriert, aber der echte PSD2-Consent-Flow ist noch nicht angebunden. Es wurde keine Bankverbindung gespeichert."
    }, { status: 501 })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Open banking connection start failed.", error)
    return NextResponse.json({ ok: false, error: "Bankverbindung konnte nicht gestartet werden." }, { status: 500 })
  }
}
