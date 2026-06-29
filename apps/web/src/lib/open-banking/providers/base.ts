import type { BankAccount, BankProviderKey, BankTransaction, CreateBankConnectionInput, OpenBankingProvider, OpenBankingResult, PaymentMatch } from "../types"

function mockAccount(provider: BankProviderKey, input: CreateBankConnectionInput): BankAccount {
  return {
    id: `${provider}-mock-account`,
    provider,
    bankName: input.bankName ?? "PSD2 Sandbox Bank",
    ibanMasked: "DE** **** **** **** 0000 00",
    accountName: input.accountName ?? "Geschaeftskonto",
    balance: 0,
    currency: "EUR",
    connectionType: "psd2",
    syncStatus: "prepared",
    lastSyncAt: null,
    isActive: false
  }
}

function ok<T>(provider: BankProviderKey, data: T, message: string): OpenBankingResult<T> {
  return { ok: true, provider, data, message }
}

export function createOpenBankingProviderStub(key: BankProviderKey, name: string): OpenBankingProvider {
  return {
    key,
    name,
    async createBankConnection(input) {
      return ok(key, mockAccount(key, input), `${name} bank connection stub prepared. No live bank API was called.`)
    },
    async syncBankAccounts() {
      return ok(key, [], `${name} account sync stub prepared. No PSD2 request was sent.`)
    },
    async syncTransactions(bankAccountId) {
      const transactions: BankTransaction[] = []
      return ok(key, transactions, `${name} transaction sync stub prepared for ${bankAccountId}.`)
    },
    async matchPayments(transactions) {
      const matches: PaymentMatch[] = transactions
        .filter((transaction) => transaction.type === "income" && transaction.matchedInvoiceId)
        .map((transaction) => ({
          id: `${transaction.id}-match`,
          transactionId: transaction.id,
          invoiceId: transaction.matchedInvoiceId as string,
          confidence: 0.82,
          status: "suggested"
        }))

      return ok(key, matches, `${name} payment matching stub prepared.`)
    },
    async disconnectBank(bankAccountId) {
      return ok(key, { bankAccountId, disconnected: true }, `${name} disconnect stub prepared.`)
    },
    async refreshConsent(bankAccountId) {
      return ok(key, { bankAccountId, consentStatus: "refresh_prepared" }, `${name} consent refresh stub prepared.`)
    }
  }
}
