ALTER TABLE "AuditLog"
  ADD COLUMN "publicIp" TEXT,
  ADD COLUMN "privateIp" TEXT,
  ADD COLUMN "accessHost" TEXT,
  ADD COLUMN "accessProtocol" TEXT,
  ADD COLUMN "accessOrigin" TEXT,
  ADD COLUMN "country" TEXT,
  ADD COLUMN "region" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "timezone" TEXT,
  ADD COLUMN "geoProvider" TEXT;
