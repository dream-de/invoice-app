import { createVerify } from "node:crypto"
import { isFeatureEnabled } from "./entitlements"
import { defaultLicensePlan, isLicensePlan, type LicensePlan } from "./plans"
import type { LicenseFeature } from "./features"

export const signedLicenseVersion = 1
export const signedLicenseAlgorithms = ["RSA-SHA256"] as const

export type SignedLicenseAlgorithm = (typeof signedLicenseAlgorithms)[number]
export type LicenseBillingCycle = "free" | "monthly" | "yearly" | "custom"
export type LicenseEdition = "self-hosted" | "desktop" | "cloud"

export type LicenseLimits = {
  users?: number | null
  companies?: number | null
  documentsPerMonth?: number | null
}

export type LicenseCustomer = {
  id?: string
  name?: string
}

export type SignedLicensePayload = {
  version: 1
  licenseId: string
  plan: LicensePlan
  edition?: LicenseEdition
  billingCycle?: LicenseBillingCycle
  customer?: LicenseCustomer
  customerName?: string
  maxUsers?: number | null
  limits?: LicenseLimits
  features?: Partial<Record<LicenseFeature, boolean>>
  issuedAt: string
  expiresAt?: string | null
  validUntil?: string | null
  meta?: Record<string, unknown>
}

export type SignedLicenseEnvelope = {
  payload: SignedLicensePayload
  signature: string
  algorithm?: SignedLicenseAlgorithm
  keyId?: string
}

export type LicenseDocument =
  | SignedLicenseEnvelope
  | string

export type LicenseVerificationResult =
  | {
      valid: true
      payload: SignedLicensePayload
      format: "json" | "compact"
    }
  | {
      valid: false
      reason: string
      format?: "json" | "compact"
    }

function base64UrlToBuffer(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  )

  return Buffer.from(padded, "base64")
}

function decodeBase64Url(value: string) {
  return base64UrlToBuffer(value).toString("utf8")
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function canonicalizeLicensePayload(value: unknown): string {
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalizeLicensePayload(item)).join(",") + "]"
  }

  if (isPlainObject(value)) {
    return "{" + Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => JSON.stringify(key) + ":" + canonicalizeLicensePayload(value[key]))
      .join(",") + "}"
  }

  return JSON.stringify(value)
}

function normalizePayload(value: unknown): SignedLicensePayload | null {
  if (!isPlainObject(value)) return null

  const planValue = String(value.plan ?? "")
  const plan = isLicensePlan(planValue) ? planValue : null
  if (!plan) return null

  const version = Number(value.version)
  if (version !== signedLicenseVersion) return null

  const licenseId = String(value.licenseId ?? "").trim()
  if (!licenseId) return null

  const issuedAt = String(value.issuedAt ?? "").trim()
  if (!issuedAt || Number.isNaN(new Date(issuedAt).getTime())) return null

  const payload = value as SignedLicensePayload

  return {
    ...payload,
    version: signedLicenseVersion,
    licenseId,
    plan
  }
}

function parseJsonLicenseDocument(input: string): SignedLicenseEnvelope | null {
  try {
    const parsed = JSON.parse(input) as unknown
    if (!isPlainObject(parsed)) return null
    if (!("payload" in parsed) || !("signature" in parsed)) return null

    return parsed as SignedLicenseEnvelope
  } catch {
    return null
  }
}

function parseEnvelope(input: LicenseDocument): SignedLicenseEnvelope | null {
  if (typeof input !== "string") return input
  return parseJsonLicenseDocument(input)
}

function isExpired(payload: SignedLicensePayload, now = new Date()) {
  const expiresAt = payload.expiresAt ?? payload.validUntil ?? null
  if (!expiresAt) return false

  const expiry = new Date(expiresAt)
  if (Number.isNaN(expiry.getTime())) return true

  return expiry.getTime() < now.getTime()
}

function verifyRsaSha256(input: string, signature: string, publicKey: string) {
  const verifier = createVerify("RSA-SHA256")
  verifier.update(input)
  verifier.end()

  return verifier.verify(publicKey, base64UrlToBuffer(signature))
}

function verifyEnvelope(envelope: SignedLicenseEnvelope, publicKey: string): LicenseVerificationResult {
  const algorithm = envelope.algorithm ?? "RSA-SHA256"
  if (algorithm !== "RSA-SHA256") {
    return { valid: false, reason: "Lizenz-Algorithmus wird nicht unterstuetzt.", format: "json" }
  }

  const payload = normalizePayload(envelope.payload)
  if (!payload) {
    return { valid: false, reason: "Lizenzdaten konnten nicht gelesen werden.", format: "json" }
  }

  if (isExpired(payload)) {
    return { valid: false, reason: "Lizenz ist abgelaufen.", format: "json" }
  }

  const signingInput = canonicalizeLicensePayload(payload)
  const signatureValid = verifyRsaSha256(signingInput, envelope.signature, publicKey)

  if (!signatureValid) {
    return { valid: false, reason: "Lizenzsignatur ist ungueltig.", format: "json" }
  }

  return { valid: true, payload, format: "json" }
}

function verifyCompactLicense(licenseKey: string, publicKey: string): LicenseVerificationResult {
  const parts = licenseKey.trim().split(".")
  if (parts.length !== 3 || parts[0] !== "INV1") {
    return { valid: false, reason: "Lizenzschluessel Format ist ungueltig.", format: "compact" }
  }

  const [, payloadPart, signaturePart] = parts
  let parsed: unknown

  try {
    parsed = JSON.parse(decodeBase64Url(payloadPart))
  } catch {
    return { valid: false, reason: "Lizenzdaten konnten nicht gelesen werden.", format: "compact" }
  }

  const payload = normalizePayload(parsed)
  if (!payload) {
    return { valid: false, reason: "Lizenzdaten konnten nicht gelesen werden.", format: "compact" }
  }

  if (isExpired(payload)) {
    return { valid: false, reason: "Lizenz ist abgelaufen.", format: "compact" }
  }

  const signatureValid = verifyRsaSha256(payloadPart, signaturePart, publicKey)
  if (!signatureValid) {
    return { valid: false, reason: "Lizenzsignatur ist ungueltig.", format: "compact" }
  }

  return { valid: true, payload, format: "compact" }
}

export function verifySignedLicenseDocument(document: LicenseDocument, publicKey: string): LicenseVerificationResult {
  if (!publicKey.trim()) {
    return { valid: false, reason: "LICENSE_PUBLIC_KEY ist nicht konfiguriert." }
  }

  const envelope = parseEnvelope(document)
  if (envelope) return verifyEnvelope(envelope, publicKey)

  if (typeof document === "string") return verifyCompactLicense(document, publicKey)

  return { valid: false, reason: "Lizenzformat ist ungueltig." }
}

export function getLicenseExpiry(payload: SignedLicensePayload): string | null {
  return payload.expiresAt ?? payload.validUntil ?? null
}

export function getLicenseCustomerName(payload: SignedLicensePayload): string | null {
  return payload.customer?.name ?? payload.customerName ?? null
}

export function getLicenseUserLimit(payload: SignedLicensePayload, fallback = 5): number {
  const configured = payload.limits?.users ?? payload.maxUsers ?? fallback
  if (configured === null) return fallback
  if (!Number.isFinite(configured)) return fallback
  return Math.max(Math.trunc(configured), 1)
}

export function hasLicensedFeature(payload: SignedLicensePayload, feature: LicenseFeature): boolean {
  const explicit = payload.features?.[feature]
  if (typeof explicit === "boolean") return explicit
  return isFeatureEnabled(payload.plan ?? defaultLicensePlan, feature)
}

export function assertLicensedFeature(payload: SignedLicensePayload, feature: LicenseFeature): void {
  if (!hasLicensedFeature(payload, feature)) {
    throw new Error("Lizenz erlaubt diese Funktion nicht.")
  }
}

export function enforceUserLimit(activeUsers: number, maxUsers: number): void {
  if (activeUsers >= maxUsers) {
    throw new Error(`Benutzerlimit erreicht (${activeUsers}/${maxUsers}). Bitte Lizenz erweitern.`)
  }
}
