-- Phase 15 + 16: AI assistant provider preparation and document management.

CREATE TABLE "AiProviderConfig" (
  "id" TEXT NOT NULL,
  "companySettingsId" TEXT,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "endpoint" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "localOnly" BOOLEAN NOT NULL DEFAULT false,
  "apiKeyConfigured" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiProviderConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentAsset" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "storagePath" TEXT NOT NULL,
  "checksum" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "version" INTEGER NOT NULL DEFAULT 1,
  "changeLog" JSONB,
  "customerId" TEXT,
  "projectId" TEXT,
  "invoiceId" TEXT,
  "offerInvoiceId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiProviderConfig_companySettingsId_provider_model_key" ON "AiProviderConfig"("companySettingsId", "provider", "model");
CREATE INDEX "AiProviderConfig_provider_idx" ON "AiProviderConfig"("provider");
CREATE INDEX "AiProviderConfig_enabled_idx" ON "AiProviderConfig"("enabled");
CREATE INDEX "DocumentAsset_name_idx" ON "DocumentAsset"("name");
CREATE INDEX "DocumentAsset_documentType_idx" ON "DocumentAsset"("documentType");
CREATE INDEX "DocumentAsset_status_idx" ON "DocumentAsset"("status");
CREATE INDEX "DocumentAsset_customerId_idx" ON "DocumentAsset"("customerId");
CREATE INDEX "DocumentAsset_projectId_idx" ON "DocumentAsset"("projectId");
CREATE INDEX "DocumentAsset_invoiceId_idx" ON "DocumentAsset"("invoiceId");
CREATE INDEX "DocumentAsset_offerInvoiceId_idx" ON "DocumentAsset"("offerInvoiceId");
CREATE INDEX "DocumentAsset_createdAt_idx" ON "DocumentAsset"("createdAt");

ALTER TABLE "AiProviderConfig" ADD CONSTRAINT "AiProviderConfig_companySettingsId_fkey" FOREIGN KEY ("companySettingsId") REFERENCES "CompanySettings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentAsset" ADD CONSTRAINT "DocumentAsset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentAsset" ADD CONSTRAINT "DocumentAsset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentAsset" ADD CONSTRAINT "DocumentAsset_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
