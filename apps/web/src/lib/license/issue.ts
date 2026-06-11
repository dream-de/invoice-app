import { createSign, randomUUID } from "node:crypto"
import { prisma, type Prisma } from "@dream-invoice/database"
import { isLicensePlan, licenseFeatures, type LicenseFeature, type LicensePlan } from "@dream-invoice/licensing"
import { type LicenseBillingCycle, type LicenseEdition, type SignedLicensePayload } from "@dream-invoice/licensing/signed-license"
import { hashLicenseKey, previewLicenseKey } from "./keys"

const defaultUsersByPlan: Record<LicensePlan, number> = {
  free: 5,
  starter: 10,
  pro: 15,
  team: 25,
  business: 50,
  enterprise: 100,
  unlimited: 1_000_000
}

const billingCycles = ["free", "monthly", "yearly", "custom"] as const satisfies readonly LicenseBillingCycle[]
const editions = ["self-hosted", "desktop", "cloud"] as const satisfies readonly LicenseEdition[]

export type GenerateLicenseKeyInput = {
  plan?: unknown
  billingCycle?: unknown
  edition?: unknown
  days?: unknown
  maxUsers?: unknown
  customerName?: unknown
  customerId?: unknown
  features?: unknown
}

export type GeneratedLicenseKey = {
  licenseKey: string
  license: {
    licenseId: string
    keyPreview: string
    plan: LicensePlan
    billingCycle: LicenseBillingCycle
    maxUsers: number
    customerId: string | null
    customerName: string | null
    validUntil: string | null
    features: Partial<Record<LicenseFeature, boolean>>
    status: string
  }
}

function normalizePem(value: string | undefined) {
  return value?.replace(/\\n/g, "\n") ?? ""
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function normalizeString(value: unknown, fallback: string | null = null) {
  const text = String(value ?? "").trim()
  return text || fallback
}

function normalizePlan(value: unknown): LicensePlan {
  const plan = String(value ?? "starter").trim()
  if (!isLicensePlan(plan)) {
    throw new Error("Lizenzplan ist ungueltig.")
  }

  return plan
}

function normalizeBillingCycle(value: unknown, plan: LicensePlan): LicenseBillingCycle {
  const fallback = plan === "free" ? "free" : "monthly"
  const billingCycle = String(value ?? fallback).trim()
  if (!billingCycles.includes(billingCycle as LicenseBillingCycle)) {
    throw new Error("Abrechnungszyklus ist ungueltig.")
  }

  return billingCycle as LicenseBillingCycle
}

function normalizeEdition(value: unknown): LicenseEdition {
  const edition = String(value ?? "self-hosted").trim()
  if (!editions.includes(edition as LicenseEdition)) {
    throw new Error("Lizenz-Edition ist ungueltig.")
  }

  return edition as LicenseEdition
}

function normalizePositiveInteger(value: unknown, fallback: number, fieldName: string) {
  if (value === undefined || value === null || value === "") return fallback

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} muss eine positive Ganzzahl sein.`)
  }

  return parsed
}

function normalizeFeatures(value: unknown): Partial<Record<LicenseFeature, boolean>> {
  if (!value) return {}

  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .map((feature) => String(feature).trim())
        .filter((feature): feature is LicenseFeature => licenseFeatures.includes(feature as LicenseFeature))
        .map((feature) => [feature, true])
    )
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([feature]) => licenseFeatures.includes(feature as LicenseFeature))
        .map(([feature, enabled]) => [feature, Boolean(enabled)])
    ) as Partial<Record<LicenseFeature, boolean>>
  }

  return {}
}

function sign(input: string, privateKey: string) {
  const signer = createSign("RSA-SHA256")
  signer.update(input)
  signer.end()

  return base64Url(signer.sign(privateKey))
}

export async function generateLicenseKey(input: GenerateLicenseKeyInput, issuedByUserId: string): Promise<GeneratedLicenseKey> {
  const privateKey = normalizePem(process.env.LICENSE_PRIVATE_KEY)
  if (!privateKey.trim()) {
    throw new Error("LICENSE_PRIVATE_KEY ist nicht konfiguriert.")
  }

  const plan = normalizePlan(input.plan)
  const billingCycle = normalizeBillingCycle(input.billingCycle, plan)
  const edition = normalizeEdition(input.edition)
  const maxUsers = normalizePositiveInteger(input.maxUsers, defaultUsersByPlan[plan], "Benutzerlimit")
  const defaultDays = billingCycle === "yearly" ? 365 : billingCycle === "monthly" ? 30 : 365
  const days = normalizePositiveInteger(input.days, defaultDays, "Laufzeit")
  const customerName = normalizeString(input.customerName, "Premium Kunde")
  const customerId = normalizeString(input.customerId)
  const features = normalizeFeatures(input.features)
  const now = new Date()
  const validUntilDate = plan === "unlimited" && billingCycle === "custom" ? null : addDays(now, days)
  const validUntil = validUntilDate?.toISOString() ?? null
  const licenseId = randomUUID()

  const payload: SignedLicensePayload = {
    version: 1,
    licenseId,
    plan,
    edition,
    billingCycle,
    customer: {
      id: customerId ?? undefined,
      name: customerName ?? undefined
    },
    customerName: customerName ?? undefined,
    maxUsers,
    limits: {
      users: maxUsers
    },
    features,
    issuedAt: now.toISOString(),
    expiresAt: validUntil,
    validUntil,
    meta: {
      issuedBy: "dream-invoice-premium-admin"
    }
  }

  const payloadPart = base64Url(JSON.stringify(payload))
  const signaturePart = sign(payloadPart, privateKey)
  const licenseKey = `INV1.${payloadPart}.${signaturePart}`
  const keyHash = hashLicenseKey(licenseKey)
  const keyPreview = previewLicenseKey(licenseKey)

  await prisma.licenseIssue.create({
    data: {
      licenseId,
      keyHash,
      keyPreview,
      plan,
      billingCycle,
      maxUsers,
      customerId,
      customerName,
      validUntil: validUntilDate,
      features: features as Prisma.InputJsonValue,
      issuedByUserId,
      status: "issued"
    }
  })

  return {
    licenseKey,
    license: {
      licenseId,
      keyPreview,
      plan,
      billingCycle,
      maxUsers,
      customerId,
      customerName,
      validUntil,
      features,
      status: "issued"
    }
  }
}
