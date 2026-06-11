CREATE TABLE IF NOT EXISTS "LicenseIssue" (
  "id" TEXT NOT NULL,
  "licenseId" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "keyPreview" TEXT NOT NULL,
  "plan" TEXT NOT NULL,
  "billingCycle" TEXT NOT NULL,
  "maxUsers" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'issued',
  "customerId" TEXT,
  "customerName" TEXT,
  "validUntil" TIMESTAMP(3),
  "features" JSONB,
  "issuedByUserId" TEXT,
  "activatedAt" TIMESTAMP(3),
  "activatedLicenseId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LicenseIssue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LicenseIssue_licenseId_key" ON "LicenseIssue" ("licenseId");
CREATE UNIQUE INDEX IF NOT EXISTS "LicenseIssue_keyHash_key" ON "LicenseIssue" ("keyHash");
CREATE INDEX IF NOT EXISTS "LicenseIssue_status_validUntil_updatedAt_idx" ON "LicenseIssue" ("status", "validUntil", "updatedAt");
CREATE INDEX IF NOT EXISTS "LicenseIssue_customerName_idx" ON "LicenseIssue" ("customerName");

ALTER TABLE "LicenseIssue" DROP CONSTRAINT IF EXISTS license_issue_plan_allowed;
ALTER TABLE "LicenseIssue"
ADD CONSTRAINT license_issue_plan_allowed
CHECK ("plan" IN ('free', 'starter', 'pro', 'team', 'business', 'enterprise', 'unlimited'));

ALTER TABLE "LicenseIssue" DROP CONSTRAINT IF EXISTS license_issue_billing_cycle_allowed;
ALTER TABLE "LicenseIssue"
ADD CONSTRAINT license_issue_billing_cycle_allowed
CHECK ("billingCycle" IN ('free', 'monthly', 'yearly', 'custom'));

ALTER TABLE "LicenseIssue" DROP CONSTRAINT IF EXISTS license_issue_status_allowed;
ALTER TABLE "LicenseIssue"
ADD CONSTRAINT license_issue_status_allowed
CHECK ("status" IN ('issued', 'activated', 'revoked'));

ALTER TABLE "LicenseIssue" DROP CONSTRAINT IF EXISTS license_issue_user_limit_allowed;
ALTER TABLE "LicenseIssue"
ADD CONSTRAINT license_issue_user_limit_allowed
CHECK ("maxUsers" BETWEEN 1 AND 1000000);
