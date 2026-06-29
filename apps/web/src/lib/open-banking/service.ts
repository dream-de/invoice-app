import {
  createOpenBankingBankConnectedEvent,
  createOpenBankingBankDisconnectedEvent,
  createOpenBankingConsentRefreshedEvent,
  createOpenBankingPaymentMatchedEvent,
  createOpenBankingSyncFailedEvent,
  createOpenBankingSyncStartedEvent,
  createOpenBankingSyncSuccessEvent
} from "@/lib/audit/auditEventFactory"
import { logAuditEvent } from "@/lib/audit/auditLogger"
import { FinApiProvider } from "./providers/finapi"
import { GoCardlessProvider } from "./providers/gocardless"
import { TinkProvider } from "./providers/tink"
import { YapilyProvider } from "./providers/yapily"
import type { BankProviderKey, BankTransaction, CreateBankConnectionInput, OpenBankingProvider } from "./types"

const providers: Record<BankProviderKey, OpenBankingProvider> = {
  finapi: FinApiProvider,
  tink: TinkProvider,
  gocardless: GoCardlessProvider,
  yapily: YapilyProvider
}

function providerFor(key: BankProviderKey = "finapi") {
  return providers[key]
}

export async function createBankConnection(input: CreateBankConnectionInput) {
  try {
    const result = await providerFor(input.provider).createBankConnection(input)
    logAuditEvent(createOpenBankingBankConnectedEvent(result.data.bankName, undefined, { provider: input.provider, bankAccountId: result.data.id }))
    return result
  } catch (error) {
    logAuditEvent(createOpenBankingSyncFailedEvent("bank_connection", undefined, { provider: input.provider, reason: error instanceof Error ? error.message : "unknown_error" }))
    throw error
  }
}

export async function syncBankAccounts(provider: BankProviderKey = "finapi") {
  logAuditEvent(createOpenBankingSyncStartedEvent("bank_accounts", undefined, { provider }))
  try {
    const result = await providerFor(provider).syncBankAccounts()
    logAuditEvent(createOpenBankingSyncSuccessEvent("bank_accounts", undefined, { provider, accountCount: result.data.length }))
    return result
  } catch (error) {
    logAuditEvent(createOpenBankingSyncFailedEvent("bank_accounts", undefined, { provider, reason: error instanceof Error ? error.message : "unknown_error" }))
    throw error
  }
}

export async function syncTransactions(bankAccountId: string, provider: BankProviderKey = "finapi") {
  logAuditEvent(createOpenBankingSyncStartedEvent("transactions", undefined, { provider, bankAccountId }))
  try {
    const result = await providerFor(provider).syncTransactions(bankAccountId)
    logAuditEvent(createOpenBankingSyncSuccessEvent("transactions", undefined, { provider, bankAccountId, transactionCount: result.data.length }))
    return result
  } catch (error) {
    logAuditEvent(createOpenBankingSyncFailedEvent("transactions", undefined, { provider, bankAccountId, reason: error instanceof Error ? error.message : "unknown_error" }))
    throw error
  }
}

export async function matchPayments(transactions: readonly BankTransaction[], provider: BankProviderKey = "finapi") {
  logAuditEvent(createOpenBankingSyncStartedEvent("payment_matching", undefined, { provider, transactionCount: transactions.length }))
  try {
    const result = await providerFor(provider).matchPayments(transactions)
    result.data.forEach((match) => {
      logAuditEvent(createOpenBankingPaymentMatchedEvent(match.transactionId, undefined, { provider, invoiceId: match.invoiceId, confidence: match.confidence }))
    })
    logAuditEvent(createOpenBankingSyncSuccessEvent("payment_matching", undefined, { provider, matchCount: result.data.length }))
    return result
  } catch (error) {
    logAuditEvent(createOpenBankingSyncFailedEvent("payment_matching", undefined, { provider, reason: error instanceof Error ? error.message : "unknown_error" }))
    throw error
  }
}

export async function disconnectBank(bankAccountId: string, provider: BankProviderKey = "finapi") {
  const result = await providerFor(provider).disconnectBank(bankAccountId)
  logAuditEvent(createOpenBankingBankDisconnectedEvent(bankAccountId, undefined))
  return result
}

export async function refreshConsent(bankAccountId: string, provider: BankProviderKey = "finapi") {
  const result = await providerFor(provider).refreshConsent(bankAccountId)
  logAuditEvent(createOpenBankingConsentRefreshedEvent(bankAccountId, undefined))
  return result
}

export const openBankingProviders = providers
