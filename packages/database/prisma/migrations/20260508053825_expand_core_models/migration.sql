-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "netPrice" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "CompanySettings" ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bic" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Deutschland',
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "taxNumber" TEXT,
ADD COLUMN     "vatId" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Deutschland';

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ALTER COLUMN "netTotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "vatTotal" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "grossTotal" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "InvoicePosition" ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "netPrice" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "budget" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "method" TEXT,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberRange" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextValue" INTEGER NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 4,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "reason" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NumberRange_type_key" ON "NumberRange"("type");
