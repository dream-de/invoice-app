ALTER TABLE "AuditLog"
  ADD COLUMN "accessHost" TEXT,
  ADD COLUMN "accessProtocol" TEXT,
  ADD COLUMN "accessOrigin" TEXT;
