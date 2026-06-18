-- Phase 10.2: finAPI bank connection flow metadata.

ALTER TABLE "BankConnections"
  ADD COLUMN IF NOT EXISTS "connectedAt" TIMESTAMP(3);

ALTER TABLE "BankAccounts"
  ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "BankAccounts_isDefault_idx" ON "BankAccounts"("isDefault");
