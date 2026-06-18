-- Phase 8: Customer portal login preparation
ALTER TABLE "Customer"
  ADD COLUMN "portalEmail" TEXT,
  ADD COLUMN "portalPasswordHash" TEXT,
  ADD COLUMN "portalInviteTokenHash" TEXT,
  ADD COLUMN "portalInviteExpiresAt" TIMESTAMP(3),
  ADD COLUMN "portalLastLoginAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Customer_portalEmail_key" ON "Customer"("portalEmail");
CREATE INDEX "Customer_portalInviteTokenHash_idx" ON "Customer"("portalInviteTokenHash");
