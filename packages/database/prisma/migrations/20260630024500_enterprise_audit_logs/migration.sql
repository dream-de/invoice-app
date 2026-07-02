-- Extend the existing AuditLog table to the Enterprise Logs schema.
-- Existing legacy audit columns are preserved for compatibility and data recovery.

ALTER TABLE "AuditLog"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "module" TEXT,
  ADD COLUMN IF NOT EXISTS "level" TEXT,
  ADD COLUMN IF NOT EXISTS "status" TEXT,
  ADD COLUMN IF NOT EXISTS "browserName" TEXT,
  ADD COLUMN IF NOT EXISTS "browserVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "osName" TEXT,
  ADD COLUMN IF NOT EXISTS "osVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "sessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "traceId" TEXT,
  ADD COLUMN IF NOT EXISTS "referer" TEXT,
  ADD COLUMN IF NOT EXISTS "method" TEXT,
  ADD COLUMN IF NOT EXISTS "endpoint" TEXT,
  ADD COLUMN IF NOT EXISTS "duration" INTEGER,
  ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "archived" BOOLEAN,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "searchableText" TEXT;

UPDATE "AuditLog"
SET
  "updatedAt" = COALESCE("updatedAt", "createdAt"),
  "module" = COALESCE(
    "module",
    CASE
      WHEN LOWER(COALESCE("source", '')) = 'auth' THEN 'authentication'
      WHEN LOWER(COALESCE("source", '')) = 'api' THEN 'api'
      WHEN LOWER(COALESCE("source", '')) = 'system' THEN 'system'
      WHEN "moduleKey" IS NOT NULL AND "moduleKey" <> '' THEN "moduleKey"
      ELSE 'system'
    END
  ),
  "level" = COALESCE(
    "level",
    CASE
      WHEN LOWER(COALESCE("severity", '')) IN ('success', 'info', 'warning', 'error') THEN LOWER("severity")
      WHEN LOWER(COALESCE("severity", '')) IN ('warn', 'warning') THEN 'warning'
      WHEN LOWER(COALESCE("severity", '')) IN ('danger', 'critical', 'fatal') THEN 'error'
      ELSE 'info'
    END
  ),
  "status" = COALESCE("status", 'active'),
  "browserName" = COALESCE("browserName", "browser"),
  "osName" = COALESCE("osName", "operatingSystem"),
  "archived" = COALESCE("archived", false),
  "tags" = COALESCE("tags", ARRAY[]::TEXT[]),
  "searchableText" = COALESCE(
    "searchableText",
    LOWER(CONCAT_WS(' ',
      "title",
      "description",
      "action",
      "type",
      "source",
      "severity",
      "moduleKey",
      "actorName",
      "actorEmail",
      "actorRole",
      "ipAddress",
      "publicIp",
      "privateIp",
      "requestId"
    ))
  );

ALTER TABLE "AuditLog"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "module" SET DEFAULT 'system',
  ALTER COLUMN "module" SET NOT NULL,
  ALTER COLUMN "level" SET DEFAULT 'info',
  ALTER COLUMN "level" SET NOT NULL,
  ALTER COLUMN "status" SET DEFAULT 'active',
  ALTER COLUMN "status" SET NOT NULL,
  ALTER COLUMN "archived" SET DEFAULT false,
  ALTER COLUMN "archived" SET NOT NULL,
  ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "tags" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "LogSettings" (
  "id" TEXT NOT NULL,
  "retention" TEXT NOT NULL DEFAULT '365',
  "autoArchive" BOOLEAN NOT NULL DEFAULT true,
  "archiveDayOfWeek" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LogSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "LogSettings" ("id", "retention", "autoArchive", "archiveDayOfWeek")
SELECT 'default', '365', true, 0
WHERE NOT EXISTS (SELECT 1 FROM "LogSettings");

CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_module_idx" ON "AuditLog"("module");
CREATE INDEX IF NOT EXISTS "AuditLog_level_idx" ON "AuditLog"("level");
CREATE INDEX IF NOT EXISTS "AuditLog_status_idx" ON "AuditLog"("status");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_actorEmail_idx" ON "AuditLog"("actorEmail");
CREATE INDEX IF NOT EXISTS "AuditLog_ipAddress_idx" ON "AuditLog"("ipAddress");
CREATE INDEX IF NOT EXISTS "AuditLog_requestId_idx" ON "AuditLog"("requestId");
CREATE INDEX IF NOT EXISTS "AuditLog_archived_idx" ON "AuditLog"("archived");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_archived_idx" ON "AuditLog"("createdAt", "archived");
CREATE INDEX IF NOT EXISTS "AuditLog_module_level_idx" ON "AuditLog"("module", "level");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
