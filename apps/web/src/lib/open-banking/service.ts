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
  return providerFor(input.provider).createBankConnection(input)
}

export async function syncBankAccounts(provider: BankProviderKey = "finapi") {
  return providerFor(provider).syncBankAccounts()
}

export async function syncTransactions(bankAccountId: string, provider: BankProviderKey = "finapi") {
  return providerFor(provider).syncTransactions(bankAccountId)
}

export async function matchPayments(transactions: readonly BankTransaction[], provider: BankProviderKey = "finapi") {
  return providerFor(provider).matchPayments(transactions)
}

export async function disconnectBank(bankAccountId: string, provider: BankProviderKey = "finapi") {
  return providerFor(provider).disconnectBank(bankAccountId)
}

export async function refreshConsent(bankAccountId: string, provider: BankProviderKey = "finapi") {
  return providerFor(provider).refreshConsent(bankAccountId)
}

export const openBankingProviders = providers
