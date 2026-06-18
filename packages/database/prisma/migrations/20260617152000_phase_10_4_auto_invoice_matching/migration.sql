-- Phase 10.4: automatic invoice matching metadata.

ALTER TABLE "Invoice"
  ADD COLUMN IF NOT EXISTS "bankTransactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "matchedBy" TEXT;

ALTER TABLE "BankTransactions"
  ADD COLUMN IF NOT EXISTS "linkedInvoiceId" TEXT,
  ADD COLUMN IF NOT EXISTS "matchedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "matchedBy" TEXT;

CREATE INDEX IF NOT EXISTS "Invoice_bankTransactionId_idx" ON "Invoice"("bankTransactionId");
CREATE INDEX IF NOT EXISTS "Invoice_matchedBy_idx" ON "Invoice"("matchedBy");
CREATE INDEX IF NOT EXISTS "BankTransactions_linkedInvoiceId_idx" ON "BankTransactions"("linkedInvoiceId");
CREATE INDEX IF NOT EXISTS "BankTransactions_matchedAt_idx" ON "BankTransactions"("matchedAt");
CREATE INDEX IF NOT EXISTS "BankTransactions_matchedBy_idx" ON "BankTransactions"("matchedBy");
