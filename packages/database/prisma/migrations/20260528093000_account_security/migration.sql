ALTER TABLE "User"
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "emailVerificationTokenHash" TEXT,
  ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "twoFactorSecret" TEXT,
  ADD COLUMN "twoFactorEnabledAt" TIMESTAMP(3),
  ADD COLUMN "twoFactorBackupCodes" JSONB;

UPDATE "User"
SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW())
WHERE "status" = 'active';

CREATE INDEX "User_emailVerificationTokenHash_idx" ON "User"("emailVerificationTokenHash");
