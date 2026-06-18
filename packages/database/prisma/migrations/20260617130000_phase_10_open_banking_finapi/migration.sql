-- Phase 10: Open Banking foundation for finAPI without active bank connections.

CREATE TABLE IF NOT EXISTS "BankConnections" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'finapi',
  "providerConnectionId" TEXT,
  "displayName" TEXT NOT NULL DEFAULT 'finAPI Verbindung',
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "consentStatus" TEXT NOT NULL DEFAULT 'not_started',
  "encryptedAccessToken" TEXT,
  "encryptedRefreshToken" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "tokenMetadata" JSONB,
  "webhookUrl" TEXT,
  "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncedAt" TIMESTAMP(3),
  "lastSyncStatus" TEXT NOT NULL DEFAULT 'pending',
  "auditState" TEXT NOT NULL DEFAULT 'prepared',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankConnections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankAccounts" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT,
  "connectionId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'finapi',
  "providerAccountId" TEXT,
  "accountName" TEXT NOT NULL,
  "bankName" TEXT,
  "ibanMasked" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "currentBalance" DECIMAL(12,2),
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankAccounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BankTransactions" (
  "id" TEXT NOT NULL,
  "openBankingAccountId" TEXT NOT NULL,
  "matchedInvoiceId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'finapi',
  "providerTransactionId" TEXT,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "bookedAt" TIMESTAMP(3),
  "valueDate" TIMESTAMP(3),
  "purpose" TEXT,
  "counterpartyName" TEXT,
  "counterpartyIbanMasked" TEXT,
  "reference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'unmatched',
  "matchConfidence" DECIMAL(5,2),
  "paymentStatusAction" TEXT NOT NULL DEFAULT 'prepared',
  "rawData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankTransactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BankConnections_companySettingsId_idx" ON "BankConnections"("companySettingsId");
CREATE INDEX IF NOT EXISTS "BankConnections_provider_idx" ON "BankConnections"("provider");
CREATE INDEX IF NOT EXISTS "BankConnections_status_idx" ON "BankConnections"("status");
CREATE INDEX IF NOT EXISTS "BankConnections_consentStatus_idx" ON "BankConnections"("consentStatus");
CREATE INDEX IF NOT EXISTS "BankConnections_lastSyncedAt_idx" ON "BankConnections"("lastSyncedAt");
CREATE INDEX IF NOT EXISTS "BankAccounts_companySettingsId_idx" ON "BankAccounts"("companySettingsId");
CREATE INDEX IF NOT EXISTS "BankAccounts_connectionId_idx" ON "BankAccounts"("connectionId");
CREATE INDEX IF NOT EXISTS "BankAccounts_provider_idx" ON "BankAccounts"("provider");
CREATE INDEX IF NOT EXISTS "BankAccounts_status_idx" ON "BankAccounts"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "BankTransactions_openBankingAccountId_providerTransactionId_key" ON "BankTransactions"("openBankingAccountId", "providerTransactionId");
CREATE INDEX IF NOT EXISTS "BankTransactions_openBankingAccountId_idx" ON "BankTransactions"("openBankingAccountId");
CREATE INDEX IF NOT EXISTS "BankTransactions_matchedInvoiceId_idx" ON "BankTransactions"("matchedInvoiceId");
CREATE INDEX IF NOT EXISTS "BankTransactions_provider_idx" ON "BankTransactions"("provider");
CREATE INDEX IF NOT EXISTS "BankTransactions_status_idx" ON "BankTransactions"("status");
CREATE INDEX IF NOT EXISTS "BankTransactions_bookedAt_idx" ON "BankTransactions"("bookedAt");
CREATE INDEX IF NOT EXISTS "BankTransactions_valueDate_idx" ON "BankTransactions"("valueDate");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BankConnections_companySettingsId_fkey') THEN
    ALTER TABLE "BankConnections" ADD CONSTRAINT "BankConnections_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BankAccounts_companySettingsId_fkey') THEN
    ALTER TABLE "BankAccounts" ADD CONSTRAINT "BankAccounts_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BankAccounts_connectionId_fkey') THEN
    ALTER TABLE "BankAccounts" ADD CONSTRAINT "BankAccounts_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "BankConnections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BankTransactions_openBankingAccountId_fkey') THEN
    ALTER TABLE "BankTransactions" ADD CONSTRAINT "BankTransactions_openBankingAccountId_fkey" FOREIGN KEY ("openBankingAccountId") REFERENCES "BankAccounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BankTransactions_matchedInvoiceId_fkey') THEN
    ALTER TABLE "BankTransactions" ADD CONSTRAINT "BankTransactions_matchedInvoiceId_fkey" FOREIGN KEY ("matchedInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "FeatureFlag" ("id", "key", "module", "label", "description", "enabled", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'OPEN_BANKING_FOUNDATION', 'Finanzen', 'Open Banking', 'PSD2/Open-Banking-Infrastruktur fuer finAPI vorbereitet. Keine direkte Bankanbindung aktiv.', false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'FINAPI_PROVIDER', 'Finanzen', 'finAPI Provider', 'Client-ID, Secret, Webhook, Token-Verwaltung und Audit-Log vorbereitet.', false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'BANK_PAYMENT_RECONCILIATION', 'Finanzen', 'Zahlungsabgleich', 'Vorbereitung fuer Rechnung -> Zahlung erkannt -> Status aktualisieren. Automatik bleibt deaktiviert.', false, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "module" = EXCLUDED."module",
    "label" = EXCLUDED."label",
    "description" = EXCLUDED."description",
    "enabled" = false,
    "updatedAt" = CURRENT_TIMESTAMP;
