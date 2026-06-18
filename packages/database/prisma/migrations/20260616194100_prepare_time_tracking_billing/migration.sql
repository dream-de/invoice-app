ALTER TABLE "TimeEntry"
  ADD COLUMN IF NOT EXISTS "timeProjectId" TEXT,
  ADD COLUMN IF NOT EXISTS "articleId" TEXT,
  ADD COLUMN IF NOT EXISTS "billingStatus" TEXT NOT NULL DEFAULT 'not_billable';

CREATE TABLE IF NOT EXISTS "TimeProject" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "projectId" TEXT,
  "code" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "hourlyRate" DECIMAL(12,2),
  "capacityHours" DECIMAL(12,2),
  "billable" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TimeProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InvoiceTimeLink" (
  "id" TEXT NOT NULL,
  "invoiceId" TEXT NOT NULL,
  "timeEntryId" TEXT NOT NULL,
  "hours" DECIMAL(12,2) NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InvoiceTimeLink_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FeatureFlag" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TimeEntry_timeProjectId_idx" ON "TimeEntry"("timeProjectId");
CREATE INDEX IF NOT EXISTS "TimeEntry_articleId_idx" ON "TimeEntry"("articleId");
CREATE INDEX IF NOT EXISTS "TimeEntry_billingStatus_idx" ON "TimeEntry"("billingStatus");
CREATE INDEX IF NOT EXISTS "TimeProject_customerId_idx" ON "TimeProject"("customerId");
CREATE INDEX IF NOT EXISTS "TimeProject_projectId_idx" ON "TimeProject"("projectId");
CREATE INDEX IF NOT EXISTS "TimeProject_status_idx" ON "TimeProject"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "InvoiceTimeLink_invoiceId_timeEntryId_key" ON "InvoiceTimeLink"("invoiceId", "timeEntryId");
CREATE INDEX IF NOT EXISTS "InvoiceTimeLink_invoiceId_idx" ON "InvoiceTimeLink"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceTimeLink_timeEntryId_idx" ON "InvoiceTimeLink"("timeEntryId");
CREATE INDEX IF NOT EXISTS "InvoiceTimeLink_status_idx" ON "InvoiceTimeLink"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_key" ON "FeatureFlag"("key");
CREATE INDEX IF NOT EXISTS "FeatureFlag_module_idx" ON "FeatureFlag"("module");
CREATE INDEX IF NOT EXISTS "FeatureFlag_enabled_idx" ON "FeatureFlag"("enabled");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimeEntry_timeProjectId_fkey') THEN
    ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_timeProjectId_fkey" FOREIGN KEY ("timeProjectId") REFERENCES "TimeProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimeEntry_articleId_fkey') THEN
    ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimeProject_customerId_fkey') THEN
    ALTER TABLE "TimeProject" ADD CONSTRAINT "TimeProject_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TimeProject_projectId_fkey') THEN
    ALTER TABLE "TimeProject" ADD CONSTRAINT "TimeProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InvoiceTimeLink_invoiceId_fkey') THEN
    ALTER TABLE "InvoiceTimeLink" ADD CONSTRAINT "InvoiceTimeLink_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InvoiceTimeLink_timeEntryId_fkey') THEN
    ALTER TABLE "InvoiceTimeLink" ADD CONSTRAINT "InvoiceTimeLink_timeEntryId_fkey" FOREIGN KEY ("timeEntryId") REFERENCES "TimeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "FeatureFlag" ("id", "key", "module", "label", "description", "enabled", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'TIME_TRACKING', 'Zeiterfassung', 'Zeiterfassung', 'Vorbereitung fuer spaetere Zeiteintraege ohne aktiven Timer.', false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'TIME_BILLING', 'Fakturierung', 'Zeitbasierte Fakturierung', 'Vorbereitung fuer spaetere Rechnungsverknuepfung aus Zeitdaten.', false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'PROJECT_CAPACITY', 'Zeiterfassung', 'Projektkapazitaet', 'Vorbereitung fuer geplante Stunden und Kapazitaetswerte.', false, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'AUTO_INVOICE_FROM_TIME', 'Fakturierung', 'Automatische Zeitrechnung', 'Vorbereitung fuer spaetere automatische Rechnungsentwuerfe aus Zeiten.', false, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "module" = EXCLUDED."module",
    "label" = EXCLUDED."label",
    "description" = EXCLUDED."description",
    "enabled" = false,
    "updatedAt" = CURRENT_TIMESTAMP;
