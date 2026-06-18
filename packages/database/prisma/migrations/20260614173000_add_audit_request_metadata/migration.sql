ALTER TABLE "AuditLog"
  ADD COLUMN "ipAddress" TEXT,
  ADD COLUMN "userAgent" TEXT,
  ADD COLUMN "browser" TEXT,
  ADD COLUMN "operatingSystem" TEXT,
  ADD COLUMN "deviceType" TEXT,
  ADD COLUMN "metadata" JSONB;
