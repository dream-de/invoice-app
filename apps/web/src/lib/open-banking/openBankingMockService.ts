import { createOpenBankingSyncFailedEvent } from "@/lib/audit/auditEventFactory"
import { logAuditEvent as logCentralAuditEvent } from "@/lib/audit/auditLogger"

export type BankConnectAuditEvent = {
  type: "bank_connection_blocked"
  module: "Finanzen"
  provider: "open_banking"
  bankName: string
  status: "provider_not_configured"
}

export type MockBankAccount = {
  id: string
  name: string
  ibanMasked: string
  balance: string
  mode: "demo"
  notice: "Keine echte Bankverbindung"
}

export type MockBankConnectionResult = {
  bankName: string
  accountCount: number
  status: "Provider nicht eingerichtet"
  connectedAt: null
  message: string
}

export const mockBankAccounts: readonly MockBankAccount[] = [] as const

export function logAuditEvent(event: BankConnectAuditEvent) {
  return {
    ok: true,
    event,
    message: "Open Banking ist nicht konfiguriert. Es wurde keine Bankverbindung gespeichert."
  }
}

export function createMockBankConnection(bankName: string, selectedAccountIds: readonly string[]): MockBankConnectionResult {
  logAuditEvent({
    type: "bank_connection_blocked",
    module: "Finanzen",
    provider: "open_banking",
    bankName,
    status: "provider_not_configured"
  })
  logCentralAuditEvent(createOpenBankingSyncFailedEvent("bank_connection", undefined, {
    provider: "mock",
    selectedAccountCount: selectedAccountIds.length,
    reason: "provider_not_configured"
  }))

  return {
    bankName,
    accountCount: 0,
    status: "Provider nicht eingerichtet",
    connectedAt: null,
    message: "Für echte PSD2-Bankverbindungen muss ein Banking-Provider konfiguriert werden."
  }
}

export function createBankConnection(bankName: string, selectedAccountIds: readonly string[] = []) {
  return createMockBankConnection(bankName, selectedAccountIds)
}

export async function syncBankAccounts() {
  return {
    ok: true,
    provider: "mock" as const,
    data: mockBankAccounts,
    mode: "demo" as const,
    message: "Demo-Modus: Keine echte Bankverbindung. Nur Beispieldaten, keine Synchronisation."
  }
}

export async function syncTransactions(bankAccountId: string) {
  return {
    ok: true,
    provider: "mock" as const,
    data: [],
    mode: "demo" as const,
    message: "Demo-Modus: Keine echte Bankverbindung fuer " + bankAccountId + ". Nur Beispieldaten, keine Synchronisation."
  }
}

export async function matchPayments(transactionIds: readonly string[]) {
  return {
    ok: true,
    provider: "mock" as const,
    data: transactionIds.map((transactionId) => ({ transactionId, matched: false, confidence: 0 })),
    mode: "demo" as const,
    message: "Demo-Modus: Keine echte Bankverbindung. Zahlungsabgleich wurde nicht produktiv ausgefuehrt."
  }
}

export async function disconnectBank(bankAccountId: string) {
  return {
    ok: true,
    provider: "mock" as const,
    data: { bankAccountId, disconnected: false },
    mode: "demo" as const,
    message: "Keine echte Bankverbindung vorhanden."
  }
}

export async function refreshConsent(bankAccountId: string) {
  return {
    ok: true,
    provider: "mock" as const,
    data: { bankAccountId, consentStatus: "provider_not_configured" },
    mode: "demo" as const,
    message: "Kein echter PSD2-Consent vorhanden."
  }
}

export function logOpenBankingSyncFailure(scope: string, reason: string) {
  return logCentralAuditEvent(createOpenBankingSyncFailedEvent(scope, undefined, { reason }))
}
