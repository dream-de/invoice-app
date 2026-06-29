import {
  createOpenBankingBankConnectedEvent,
  createOpenBankingBankDisconnectedEvent,
  createOpenBankingConsentRefreshedEvent,
  createOpenBankingPaymentMatchedEvent,
  createOpenBankingSyncFailedEvent,
  createOpenBankingSyncStartedEvent,
  createOpenBankingSyncSuccessEvent
} from "@/lib/audit/auditEventFactory"
import { logAuditEvent as logCentralAuditEvent } from "@/lib/audit/auditLogger"

export type BankConnectAuditEvent = {
  type: "bank_connected"
  module: "Finanzen"
  provider: "open_banking"
  bankName: string
  status: "success"
}

export type MockBankAccount = {
  id: string
  name: string
  ibanMasked: string
  balance: string
}

export type MockBankConnectionResult = {
  bankName: string
  accountCount: number
  status: "Synchronisation läuft"
  connectedAt: string
}

export const mockBankAccounts: readonly MockBankAccount[] = [
  { id: "business", name: "Geschäftskonto", ibanMasked: "DE12 5001 0517 5407 3249 31", balance: "12.480,32 €" },
  { id: "tax", name: "Steuerrücklage", ibanMasked: "DE12 5001 0517 5407 3249 32", balance: "2.780,00 €" },
  { id: "savings", name: "Tagesgeldkonto", ibanMasked: "DE12 5001 0517 5407 3249 33", balance: "15.230,45 €" }
] as const

export function logAuditEvent(event: BankConnectAuditEvent) {
  return {
    ok: true,
    event,
    message: "Audit event stub prepared. No backend log was written."
  }
}

export function createMockBankConnection(bankName: string, selectedAccountIds: readonly string[]): MockBankConnectionResult {
  logAuditEvent({
    type: "bank_connected",
    module: "Finanzen",
    provider: "open_banking",
    bankName,
    status: "success"
  })
  logCentralAuditEvent(createOpenBankingBankConnectedEvent(bankName, undefined, { accountCount: selectedAccountIds.length }))

  return {
    bankName,
    accountCount: selectedAccountIds.length,
    status: "Synchronisation läuft",
    connectedAt: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date())
  }
}

export function createBankConnection(bankName: string, selectedAccountIds: readonly string[] = []) {
  return createMockBankConnection(bankName, selectedAccountIds)
}

export async function syncBankAccounts() {
  logCentralAuditEvent(createOpenBankingSyncStartedEvent("bank_accounts"))
  logCentralAuditEvent(createOpenBankingSyncSuccessEvent("bank_accounts", undefined, { accountCount: mockBankAccounts.length }))

  return {
    ok: true,
    provider: "mock" as const,
    data: mockBankAccounts,
    message: "Mock-Bankkonten synchronisiert."
  }
}

export async function syncTransactions(bankAccountId: string) {
  logCentralAuditEvent(createOpenBankingSyncStartedEvent("transactions", undefined, { bankAccountId }))
  logCentralAuditEvent(createOpenBankingSyncSuccessEvent("transactions", undefined, { bankAccountId, transactionCount: 3 }))

  return {
    ok: true,
    provider: "mock" as const,
    data: [
      { id: `${bankAccountId}-tx-1`, amount: 248.9, description: "Mock-Zahlung Eingang" },
      { id: `${bankAccountId}-tx-2`, amount: -49, description: "Mock-Gebuehr" },
      { id: `${bankAccountId}-tx-3`, amount: 1190, description: "Mock-Rechnung bezahlt" }
    ],
    message: "Mock-Transaktionen synchronisiert."
  }
}

export async function matchPayments(transactionIds: readonly string[]) {
  logCentralAuditEvent(createOpenBankingSyncStartedEvent("payment_matching", undefined, { transactionCount: transactionIds.length }))
  transactionIds.forEach((transactionId) => {
    logCentralAuditEvent(createOpenBankingPaymentMatchedEvent(transactionId, undefined, { confidence: 0.92 }))
  })

  return {
    ok: true,
    provider: "mock" as const,
    data: transactionIds.map((transactionId) => ({ transactionId, matched: true, confidence: 0.92 })),
    message: "Mock-Zahlungen wurden zugeordnet."
  }
}

export async function disconnectBank(bankAccountId: string) {
  logCentralAuditEvent(createOpenBankingBankDisconnectedEvent(bankAccountId))

  return {
    ok: true,
    provider: "mock" as const,
    data: { bankAccountId, disconnected: true },
    message: "Mock-Bankverbindung getrennt."
  }
}

export async function refreshConsent(bankAccountId: string) {
  logCentralAuditEvent(createOpenBankingConsentRefreshedEvent(bankAccountId))

  return {
    ok: true,
    provider: "mock" as const,
    data: { bankAccountId, consentStatus: "valid" },
    message: "Mock-Consent erneuert."
  }
}

export function logOpenBankingSyncFailure(scope: string, reason: string) {
  return logCentralAuditEvent(createOpenBankingSyncFailedEvent(scope, undefined, { reason }))
}
