ALTER TABLE "InvoicePosition"
  ADD COLUMN IF NOT EXISTS "customerId" TEXT,
  ADD COLUMN IF NOT EXISTS "projectId" TEXT,
  ADD COLUMN IF NOT EXISTS "articleId" TEXT,
  ADD COLUMN IF NOT EXISTS "hours" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "hourlyRate" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "amount" DECIMAL(12,2);

UPDATE "InvoicePosition"
SET "amount" = "quantity" * "netPrice"
WHERE "amount" IS NULL;

CREATE INDEX IF NOT EXISTS "InvoicePosition_customerId_idx" ON "InvoicePosition"("customerId");
CREATE INDEX IF NOT EXISTS "InvoicePosition_projectId_idx" ON "InvoicePosition"("projectId");
CREATE INDEX IF NOT EXISTS "InvoicePosition_articleId_idx" ON "InvoicePosition"("articleId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InvoicePosition_customerId_fkey') THEN
    ALTER TABLE "InvoicePosition" ADD CONSTRAINT "InvoicePosition_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InvoicePosition_projectId_fkey') THEN
    ALTER TABLE "InvoicePosition" ADD CONSTRAINT "InvoicePosition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InvoicePosition_articleId_fkey') THEN
    ALTER TABLE "InvoicePosition" ADD CONSTRAINT "InvoicePosition_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
