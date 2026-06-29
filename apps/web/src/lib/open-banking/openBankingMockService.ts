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

  return {
    bankName,
    accountCount: selectedAccountIds.length,
    status: "Synchronisation läuft",
    connectedAt: new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date())
  }
}
