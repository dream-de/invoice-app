-- Keep existing installs migratable even if a previous local import created
-- payment rows with invoice ids that no longer exist.
UPDATE "Payment"
SET "invoiceId" = NULL
WHERE "invoiceId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "Invoice"
    WHERE "Invoice"."id" = "Payment"."invoiceId"
  );

CREATE INDEX IF NOT EXISTS "Payment_invoiceId_idx" ON "Payment"("invoiceId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_invoiceId_fkey"
FOREIGN KEY ("invoiceId")
REFERENCES "Invoice"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
