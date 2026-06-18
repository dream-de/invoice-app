ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS "provider" TEXT,
  ADD COLUMN IF NOT EXISTS "providerPaymentId" TEXT,
  ADD COLUMN IF NOT EXISTS "checkoutUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "failureReason" TEXT,
  ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "PaymentProviderConfig" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT,
  "provider" TEXT NOT NULL,
  "apiKey" TEXT,
  "secretKey" TEXT,
  "webhookUrl" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "connectedAt" TIMESTAMP(3),
  "lastStatus" TEXT NOT NULL DEFAULT 'open',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentProviderConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentLink" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "checkoutUrl" TEXT NOT NULL,
  "providerPaymentId" TEXT,
  "metadata" JSONB,
  "expiresAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentLink_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentProviderConfig_companySettingsId_provider_key" ON "PaymentProviderConfig"("companySettingsId", "provider");
CREATE INDEX IF NOT EXISTS "PaymentProviderConfig_provider_idx" ON "PaymentProviderConfig"("provider");
CREATE INDEX IF NOT EXISTS "PaymentProviderConfig_enabled_idx" ON "PaymentProviderConfig"("enabled");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentLink_invoiceId_provider_key" ON "PaymentLink"("invoiceId", "provider");
CREATE INDEX IF NOT EXISTS "PaymentLink_provider_idx" ON "PaymentLink"("provider");
CREATE INDEX IF NOT EXISTS "PaymentLink_status_idx" ON "PaymentLink"("status");
CREATE INDEX IF NOT EXISTS "PaymentLink_providerPaymentId_idx" ON "PaymentLink"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_provider_idx" ON "Payment"("provider");
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentProviderConfig_companySettingsId_fkey') THEN
    ALTER TABLE "PaymentProviderConfig" ADD CONSTRAINT "PaymentProviderConfig_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentLink_invoiceId_fkey') THEN
    ALTER TABLE "PaymentLink" ADD CONSTRAINT "PaymentLink_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "PaymentProviderConfig" ("id", "companySettingsId", "provider", "enabled", "lastStatus", "updatedAt")
SELECT concat('phase9-provider-', provider.key, '-', COALESCE(cs."id", 'global')), cs."id", provider.key, false, 'open', CURRENT_TIMESTAMP
FROM (SELECT "id" FROM "CompanySettings" ORDER BY "createdAt" DESC LIMIT 1) cs
CROSS JOIN (VALUES ('paypal'), ('stripe')) AS provider(key)
ON CONFLICT ("companySettingsId", "provider") DO NOTHING;
