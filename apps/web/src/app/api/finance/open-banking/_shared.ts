import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"

export const FINAPI_PROVIDER = "finapi"
export const FINAPI_CALLBACK_PATH = "/api/finance/open-banking/callback"

export function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }

  return null
}

export async function requireOpenBankingAdmin() {
  return requireCurrentUserRole(["admin"])
}

export async function ensureCompanySettings() {
  const existing = await prisma.companySettings.findFirst({ orderBy: { createdAt: "desc" } })
  if (existing) return existing

  return prisma.companySettings.create({
    data: {
      company: "Dream Ledger GmbH",
      country: "Deutschland"
    }
  })
}

export function publicConnection(connection: {
  id: string
  provider: string
  displayName: string
  status: string
  consentStatus: string
  webhookUrl: string | null
  lastSyncedAt: Date | null
  connectedAt?: Date | null
  createdAt: Date
}) {
  return {
    id: connection.id,
    provider: connection.provider,
    bankName: connection.displayName,
    status: connection.status,
    consentStatus: connection.consentStatus,
    webhookUrl: connection.webhookUrl,
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    connectedAt: connection.connectedAt?.toISOString() ?? null,
    createdAt: connection.createdAt.toISOString()
  }
}

export function publicAccount(account: {
  id: string
  accountName: string
  bankName: string | null
  ibanMasked: string | null
  currency: string
  currentBalance: unknown
  status: string
  isDefault?: boolean
  lastSyncedAt: Date | null
  connectionId: string | null
}) {
  return {
    id: account.id,
    connectionId: account.connectionId,
    accountName: account.accountName,
    bankName: account.bankName,
    iban: account.ibanMasked,
    currency: account.currency,
    balance: account.currentBalance === null || account.currentBalance === undefined ? null : Number(account.currentBalance),
    status: account.status,
    isDefault: Boolean(account.isDefault),
    lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null
  }
}
