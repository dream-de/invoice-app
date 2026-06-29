export type BankConnectionType = "manual" | "csv" | "psd2"
export type BankTransactionType = "income" | "expense"
export type BankTransactionStatus = "pending" | "booked" | "ignored"
export type BankTransactionSource = "manual" | "csv" | "psd2"
export type PaymentMatchStatus = "suggested" | "confirmed" | "rejected"

export type OpenBankingFeatureFlag =
  | "open_banking.enabled"
  | "open_banking.psd2"
  | "open_banking.bank_sync"
  | "open_banking.payment_matching"
  | "open_banking.bank_rules"
  | "open_banking.cashflow_forecast"

export const openBankingFeatureFlags: readonly OpenBankingFeatureFlag[] = [
  "open_banking.enabled",
  "open_banking.psd2",
  "open_banking.bank_sync",
  "open_banking.payment_matching",
  "open_banking.bank_rules",
  "open_banking.cashflow_forecast"
] as const

export type BankAccount = {
  id: string
  provider: string
  bankName: string
  ibanMasked: string
  accountName: string
  balance: number
  currency: string
  connectionType: BankConnectionType
  syncStatus: string
  lastSyncAt: string | null
  isActive: boolean
}

export type BankTransaction = {
  id: string
  bankAccountId: string
  date: string
  description: string
  amount: number
  currency: string
  type: BankTransactionType
  category: string
  matchedInvoiceId: string | null
  status: BankTransactionStatus
  source: BankTransactionSource
}

export type PaymentMatch = {
  id: string
  transactionId: string
  invoiceId: string
  confidence: number
  status: PaymentMatchStatus
}

export type BankProviderKey = "finapi" | "tink" | "gocardless" | "yapily"

export type CreateBankConnectionInput = {
  provider: BankProviderKey
  bankName?: string
  accountName?: string
}

export type OpenBankingResult<T> = {
  ok: true
  provider: BankProviderKey | "mock"
  data: T
  message: string
}

export type OpenBankingProvider = {
  key: BankProviderKey
  name: string
  createBankConnection(input: CreateBankConnectionInput): Promise<OpenBankingResult<BankAccount>>
  syncBankAccounts(): Promise<OpenBankingResult<BankAccount[]>>
  syncTransactions(bankAccountId: string): Promise<OpenBankingResult<BankTransaction[]>>
  matchPayments(transactions: readonly BankTransaction[]): Promise<OpenBankingResult<PaymentMatch[]>>
  disconnectBank(bankAccountId: string): Promise<OpenBankingResult<{ bankAccountId: string; disconnected: boolean }>>
  refreshConsent(bankAccountId: string): Promise<OpenBankingResult<{ bankAccountId: string; consentStatus: string }>>
}

export type OpenBankingAuditAction =
  | "open_banking.bank_connected"
  | "open_banking.bank_disconnected"
  | "open_banking.sync_started"
  | "open_banking.sync_succeeded"
  | "open_banking.sync_failed"
  | "open_banking.payment_detected"
  | "open_banking.invoice_auto_marked_paid"

export const openBankingAuditActions: readonly OpenBankingAuditAction[] = [
  "open_banking.bank_connected",
  "open_banking.bank_disconnected",
  "open_banking.sync_started",
  "open_banking.sync_succeeded",
  "open_banking.sync_failed",
  "open_banking.payment_detected",
  "open_banking.invoice_auto_marked_paid"
] as const
