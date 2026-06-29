-- Phase 8: Backend Audit Log Schema preparation.
-- Audit logs are designed as append-only records. No normal update/delete API is introduced.
-- TODO: immutable append-only storage pruefen.
-- TODO: retention policy pro Plan definieren.
-- TODO: PII minimization / DSGVO Loeschkonzept.
-- TODO: Export-Funktion CSV/PDF.

ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "tenantId" TEXT,
  ADD COLUMN IF NOT EXISTS "workspaceId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorId" TEXT,
  ADD COLUMN IF NOT EXISTS "actorName" TEXT NOT NULL DEFAULT 'System',
  ADD COLUMN IF NOT EXISTS "actorRole" TEXT,
  ADD COLUMN IF NOT EXISTS "actorEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS "severity" TEXT NOT NULL DEFAULT 'info',
  ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Audit Event',
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "moduleKey" TEXT,
  ADD COLUMN IF NOT EXISTS "integrationKey" TEXT,
  ADD COLUMN IF NOT EXISTS "marketplaceModuleKey" TEXT,
  ADD COLUMN IF NOT EXISTS "entityType" TEXT,
  ADD COLUMN IF NOT EXISTS "device" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "requestId" TEXT,
  ADD COLUMN IF NOT EXISTS "before" JSONB,
  ADD COLUMN IF NOT EXISTS "after" JSONB;

CREATE INDEX IF NOT EXISTS "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");
CREATE INDEX IF NOT EXISTS "AuditLog_workspaceId_idx" ON "AuditLog"("workspaceId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_type_idx" ON "AuditLog"("type");
CREATE INDEX IF NOT EXISTS "AuditLog_source_idx" ON "AuditLog"("source");
CREATE INDEX IF NOT EXISTS "AuditLog_severity_idx" ON "AuditLog"("severity");
CREATE INDEX IF NOT EXISTS "AuditLog_moduleKey_idx" ON "AuditLog"("moduleKey");
CREATE INDEX IF NOT EXISTS "AuditLog_integrationKey_idx" ON "AuditLog"("integrationKey");
CREATE INDEX IF NOT EXISTS "AuditLog_marketplaceModuleKey_idx" ON "AuditLog"("marketplaceModuleKey");
CREATE INDEX IF NOT EXISTS "AuditLog_requestId_idx" ON "AuditLog"("requestId");
