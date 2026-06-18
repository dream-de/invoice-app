-- Phase 11 + 12: automation persistence and analytics-ready reporting surfaces
CREATE TABLE IF NOT EXISTS "AutomationWorkflow" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationWorkflow_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AutomationWorkflow_trigger_idx" ON "AutomationWorkflow"("trigger");
CREATE INDEX IF NOT EXISTS "AutomationWorkflow_status_idx" ON "AutomationWorkflow"("status");

CREATE TABLE IF NOT EXISTS "RecurringInvoiceRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "frequency" TEXT NOT NULL,
  "interval" INTEGER NOT NULL DEFAULT 1,
  "nextRunAt" TIMESTAMP(3),
  "customerId" TEXT,
  "projectId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecurringInvoiceRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RecurringInvoiceRule_frequency_idx" ON "RecurringInvoiceRule"("frequency");
CREATE INDEX IF NOT EXISTS "RecurringInvoiceRule_status_idx" ON "RecurringInvoiceRule"("status");
CREATE INDEX IF NOT EXISTS "RecurringInvoiceRule_nextRunAt_idx" ON "RecurringInvoiceRule"("nextRunAt");

CREATE TABLE IF NOT EXISTS "PaymentReminderRule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "timing" TEXT NOT NULL,
  "offsetDays" INTEGER NOT NULL DEFAULT 0,
  "reminderLevel" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'prepared',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentReminderRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PaymentReminderRule_timing_idx" ON "PaymentReminderRule"("timing");
CREATE INDEX IF NOT EXISTS "PaymentReminderRule_reminderLevel_idx" ON "PaymentReminderRule"("reminderLevel");
CREATE INDEX IF NOT EXISTS "PaymentReminderRule_status_idx" ON "PaymentReminderRule"("status");
