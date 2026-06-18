ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "preferredPaymentMethod" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "paymentTermsDays" INTEGER;

CREATE TABLE IF NOT EXISTS "BankAccount" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT,
  "bankName" TEXT NOT NULL,
  "accountHolder" TEXT NOT NULL,
  "iban" TEXT NOT NULL,
  "bic" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "qrEnabled" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentMethodConfig" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "prepared" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentMethodConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentTermConfig" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT,
  "label" TEXT NOT NULL,
  "days" INTEGER NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentTermConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReminderPreparation" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT,
  "level" INTEGER NOT NULL,
  "label" TEXT NOT NULL,
  "daysAfterDue" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "templateNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReminderPreparation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "bankAccountId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "bankNameSnapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "accountHolderSnapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "ibanSnapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "bicSnapshot" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "paymentTermsDays" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "qrPaymentPayload" TEXT;

CREATE INDEX IF NOT EXISTS "BankAccount_companySettingsId_idx" ON "BankAccount"("companySettingsId");
CREATE INDEX IF NOT EXISTS "BankAccount_isDefault_idx" ON "BankAccount"("isDefault");
CREATE INDEX IF NOT EXISTS "BankAccount_active_idx" ON "BankAccount"("active");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentMethodConfig_companySettingsId_key_key" ON "PaymentMethodConfig"("companySettingsId", "key");
CREATE INDEX IF NOT EXISTS "PaymentMethodConfig_enabled_idx" ON "PaymentMethodConfig"("enabled");
CREATE INDEX IF NOT EXISTS "PaymentTermConfig_companySettingsId_idx" ON "PaymentTermConfig"("companySettingsId");
CREATE INDEX IF NOT EXISTS "PaymentTermConfig_isDefault_idx" ON "PaymentTermConfig"("isDefault");
CREATE INDEX IF NOT EXISTS "PaymentTermConfig_active_idx" ON "PaymentTermConfig"("active");
CREATE INDEX IF NOT EXISTS "ReminderPreparation_companySettingsId_idx" ON "ReminderPreparation"("companySettingsId");
CREATE INDEX IF NOT EXISTS "ReminderPreparation_level_idx" ON "ReminderPreparation"("level");
CREATE INDEX IF NOT EXISTS "Invoice_bankAccountId_idx" ON "Invoice"("bankAccountId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BankAccount_companySettingsId_fkey') THEN
    ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentMethodConfig_companySettingsId_fkey') THEN
    ALTER TABLE "PaymentMethodConfig" ADD CONSTRAINT "PaymentMethodConfig_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PaymentTermConfig_companySettingsId_fkey') THEN
    ALTER TABLE "PaymentTermConfig" ADD CONSTRAINT "PaymentTermConfig_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReminderPreparation_companySettingsId_fkey') THEN
    ALTER TABLE "ReminderPreparation" ADD CONSTRAINT "ReminderPreparation_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Invoice_bankAccountId_fkey') THEN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "BankAccount" ("id", "companySettingsId", "bankName", "accountHolder", "iban", "bic", "isDefault", "qrEnabled", "active", "createdAt", "updatedAt")
SELECT concat('phase7-bank-', cs."id"), cs."id", COALESCE(NULLIF(cs."bankName", ''), 'Standardkonto'), COALESCE(NULLIF(cs."company", ''), 'Kontoinhaber'), cs."iban", NULLIF(cs."bic", ''), true, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "CompanySettings" cs
WHERE cs."iban" IS NOT NULL
  AND trim(cs."iban") <> ''
  AND NOT EXISTS (SELECT 1 FROM "BankAccount" ba WHERE ba."companySettingsId" = cs."id");

INSERT INTO "PaymentMethodConfig" ("id", "companySettingsId", "key", "label", "enabled", "prepared", "sortOrder", "createdAt", "updatedAt")
SELECT concat('phase7-method-', method.key, '-', COALESCE(cs."id", 'global')), cs."id", method.key, method.label, method.enabled, method.prepared, method.sort_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT "id" FROM "CompanySettings" ORDER BY "createdAt" DESC LIMIT 1) cs
CROSS JOIN (VALUES
  ('bank_transfer', 'Ueberweisung', true, false, 10),
  ('cash', 'Bar', true, false, 20),
  ('ec_card', 'EC-Karte', true, false, 30),
  ('credit_card', 'Kreditkarte', true, false, 40),
  ('paypal', 'PayPal', false, true, 50),
  ('stripe', 'Stripe', false, true, 60)
) AS method(key, label, enabled, prepared, sort_order)
ON CONFLICT ("companySettingsId", "key") DO NOTHING;

INSERT INTO "PaymentTermConfig" ("id", "companySettingsId", "label", "days", "isDefault", "active", "sortOrder", "createdAt", "updatedAt")
SELECT concat('phase7-term-', term.days, '-', COALESCE(cs."id", 'global')), cs."id", term.label, term.days, term.is_default, true, term.sort_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT "id", COALESCE("defaultPaymentTermsDays", 14) AS default_days FROM "CompanySettings" ORDER BY "createdAt" DESC LIMIT 1) cs
CROSS JOIN LATERAL (VALUES
  ('Sofort faellig', 0, cs.default_days = 0, 10),
  ('7 Tage', 7, cs.default_days = 7, 20),
  ('14 Tage', 14, cs.default_days = 14, 30),
  ('30 Tage', 30, cs.default_days = 30, 40)
) AS term(label, days, is_default, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM "PaymentTermConfig" pt WHERE pt."companySettingsId" = cs."id");

INSERT INTO "ReminderPreparation" ("id", "companySettingsId", "level", "label", "daysAfterDue", "active", "templateNote", "createdAt", "updatedAt")
SELECT concat('phase7-reminder-', reminder.level, '-', COALESCE(cs."id", 'global')), cs."id", reminder.level, reminder.label, reminder.days_after_due, false, reminder.template_note, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT "id" FROM "CompanySettings" ORDER BY "createdAt" DESC LIMIT 1) cs
CROSS JOIN (VALUES
  (1, 'Freundliche Erinnerung', 7, 'Vorlage fuer erste Zahlungserinnerung vorbereitet.'),
  (2, 'Mahnung', 14, 'Vorlage fuer Mahnstufe vorbereitet.'),
  (3, 'Letzte Mahnung', 30, 'Vorlage fuer letzte Mahnstufe vorbereitet.')
) AS reminder(level, label, days_after_due, template_note)
WHERE NOT EXISTS (SELECT 1 FROM "ReminderPreparation" rp WHERE rp."companySettingsId" = cs."id");
