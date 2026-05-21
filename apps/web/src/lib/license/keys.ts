import { createVerify } from "node:crypto"
import { getPlanByKey, type LicensePlanKey } from "./plans"

export type LicenseBillingCycle = "free" | "monthly" | "yearly" | "custom"

export type LicenseKeyPayload = {
  version: 1
  licenseId: string
  plan: LicensePlanKey
  maxUsers: number | null
  billingCycle: LicenseBillingCycle
  issuedAt: string
  validUntil: string | null
  customerName?: string
}

export type LicenseKeyCheck =
  | {
      valid: true
      payload: LicenseKeyPayload
    }
  | {
      valid: false
      reason: string
    }

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  )

  return Buffer.from(padded, "base64").toString("utf8")
}

function parsePayload(value: string): LicenseKeyPayload | null {
  try {
    const payload = JSON.parse(decodeBase64Url(value)) as LicenseKeyPayload

    if (payload.version !== 1) return null
    if (!payload.licenseId) return null
    if (!payload.plan) return null

    const plan = getPlanByKey(payload.plan)
    if (plan.key !== payload.plan) return null

    return payload
  } catch {
    return null
  }
}

function isExpired(validUntil: string | null) {
  if (!validUntil) return false

  const expiresAt = new Date(validUntil)
  if (Number.isNaN(expiresAt.getTime())) return true

  return expiresAt.getTime() < Date.now()
}

export function verifyLicenseKey(licenseKey: string): LicenseKeyCheck {
  const publicKey = process.env.LICENSE_PUBLIC_KEY

  if (!publicKey) {
    return {
      valid: false,
      reason: "LICENSE_PUBLIC_KEY ist nicht konfiguriert."
    }
  }

  const parts = licenseKey.trim().split(".")
  if (parts.length !== 3 || parts[0] !== "INV1") {
    return {
      valid: false,
      reason: "Lizenzschluessel Format ist ungueltig."
    }
  }

  const [, payloadPart, signaturePart] = parts
  const payload = parsePayload(payloadPart)

  if (!payload) {
    return {
      valid: false,
      reason: "Lizenzdaten konnten nicht gelesen werden."
    }
  }

  if (isExpired(payload.validUntil)) {
    return {
      valid: false,
      reason: "Lizenz ist abgelaufen."
    }
  }

  const verifier = createVerify("RSA-SHA256")
  verifier.update(payloadPart)
  verifier.end()

  const signature = Buffer.from(signaturePart.replace(/-/g, "+").replace(/_/g, "/"), "base64")
  const signatureValid = verifier.verify(publicKey, signature)

  if (!signatureValid) {
    return {
      valid: false,
      reason: "Lizenzsignatur ist ungueltig."
    }
  }

  return {
    valid: true,
    payload
  }
}
