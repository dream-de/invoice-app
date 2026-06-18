CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "Tenant" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Company" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "logoUrl" TEXT,
  "street" TEXT,
  "zip" TEXT,
  "city" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Deutschland',
  "taxNumber" TEXT,
  "vatId" TEXT,
  "iban" TEXT,
  "bic" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Company_tenantId_slug_key" UNIQUE ("tenantId", "slug")
);

CREATE TABLE IF NOT EXISTS "CompanyLocation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "street" TEXT,
  "zip" TEXT,
  "city" TEXT,
  "country" TEXT NOT NULL DEFAULT 'Deutschland',
  "email" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "UserCompanyMembership" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "companyId" TEXT REFERENCES "Company"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'employee',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserCompanyMembership_userId_companyId_key" UNIQUE ("userId", "companyId")
);

CREATE TABLE IF NOT EXISTS "ApiKey" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "companyId" TEXT REFERENCES "Company"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL UNIQUE,
  "keyPreview" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "scopes" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "lastUsedAt" TIMESTAMP(3),
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "WebhookEndpoint" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "companyId" TEXT REFERENCES "Company"("id") ON DELETE CASCADE,
  "event" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "secretPreview" TEXT,
  "lastDeliveryAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "IntegrationConnection" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE,
  "companyId" TEXT REFERENCES "Company"("id") ON DELETE CASCADE,
  "provider" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'automation',
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "config" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "IntegrationConnection_tenantId_provider_companyId_key" UNIQUE ("tenantId", "provider", "companyId")
);

INSERT INTO "Tenant" ("slug", "name") VALUES ('default', 'DreamInvoice Mandant') ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "Company" ("tenantId", "name", "slug", "street", "zip", "city", "country", "taxNumber", "vatId", "iban", "bic", "email", "phone", "logoUrl")
SELECT t."id", COALESCE(cs."company", 'Standard Firma'), 'default-company', cs."street", cs."zip", cs."city", COALESCE(cs."country", 'Deutschland'), cs."taxNumber", cs."vatId", cs."iban", cs."bic", cs."email", cs."phone", cs."logoUrl"
FROM "Tenant" t LEFT JOIN "CompanySettings" cs ON true
WHERE t."slug" = 'default'
ON CONFLICT ("tenantId", "slug") DO NOTHING;

DO $$
DECLARE default_tenant TEXT; default_company TEXT;
BEGIN
  SELECT "id" INTO default_tenant FROM "Tenant" WHERE "slug" = 'default' LIMIT 1;
  SELECT "id" INTO default_company FROM "Company" WHERE "tenantId" = default_tenant ORDER BY "createdAt" LIMIT 1;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Customer' AND column_name = 'companyId') THEN ALTER TABLE "Customer" ADD COLUMN "companyId" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Project' AND column_name = 'companyId') THEN ALTER TABLE "Project" ADD COLUMN "companyId" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Invoice' AND column_name = 'companyId') THEN ALTER TABLE "Invoice" ADD COLUMN "companyId" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'BankAccount' AND column_name = 'companyId') THEN ALTER TABLE "BankAccount" ADD COLUMN "companyId" TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'DocumentAsset' AND column_name = 'companyId') THEN ALTER TABLE "DocumentAsset" ADD COLUMN "companyId" TEXT; END IF;
  UPDATE "Customer" SET "companyId" = default_company WHERE "companyId" IS NULL;
  UPDATE "Project" SET "companyId" = default_company WHERE "companyId" IS NULL;
  UPDATE "Invoice" SET "companyId" = default_company WHERE "companyId" IS NULL;
  UPDATE "BankAccount" SET "companyId" = default_company WHERE "companyId" IS NULL;
  UPDATE "DocumentAsset" SET "companyId" = default_company WHERE "companyId" IS NULL;
  INSERT INTO "UserCompanyMembership" ("userId", "tenantId", "companyId", "role")
  SELECT u."id", default_tenant, default_company, CASE WHEN u."role" IN ('admin', 'owner') THEN 'super_admin' ELSE 'employee' END FROM "User" u
  ON CONFLICT ("userId", "companyId") DO NOTHING;
END $$;

CREATE INDEX IF NOT EXISTS "Customer_companyId_idx" ON "Customer"("companyId");
CREATE INDEX IF NOT EXISTS "Project_companyId_idx" ON "Project"("companyId");
CREATE INDEX IF NOT EXISTS "Invoice_companyId_idx" ON "Invoice"("companyId");
CREATE INDEX IF NOT EXISTS "BankAccount_companyId_idx" ON "BankAccount"("companyId");
CREATE INDEX IF NOT EXISTS "DocumentAsset_companyId_idx" ON "DocumentAsset"("companyId");
CREATE INDEX IF NOT EXISTS "Company_tenantId_idx" ON "Company"("tenantId");
CREATE INDEX IF NOT EXISTS "CompanyLocation_companyId_idx" ON "CompanyLocation"("companyId");
CREATE INDEX IF NOT EXISTS "UserCompanyMembership_userId_idx" ON "UserCompanyMembership"("userId");
CREATE INDEX IF NOT EXISTS "ApiKey_tenantId_companyId_idx" ON "ApiKey"("tenantId", "companyId");
CREATE INDEX IF NOT EXISTS "WebhookEndpoint_tenantId_companyId_event_idx" ON "WebhookEndpoint"("tenantId", "companyId", "event");
