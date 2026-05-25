import { verifySignedLicenseDocument, getLicenseExpiry, getLicenseCustomerName, getLicenseUserLimit, type SignedLicensePayload } from "@dream-invoice/licensing/signed-license"

export type LicenseBillingCycle = "free" | "monthly" | "yearly" | "custom"

export type LicenseKeyPayload = {
  version: 1
  licenseId: string
  plan: string
  maxUsers: number
  billingCycle: LicenseBillingCycle
  issuedAt: string
  validUntil: string | null
  customerName?: string
  features?: SignedLicensePayload["features"]
}

export type LicenseKeyCheck =
  | {
      valid: true
      payload: LicenseKeyPayload
      signedPayload: SignedLicensePayload
    }
  | {
      valid: false
      reason: string
    }

function normalizeLicensePayload(payload: SignedLicensePayload): LicenseKeyPayload {
  return {
    version: 1,
    licenseId: payload.licenseId,
    plan: payload.plan,
    maxUsers: getLicenseUserLimit(payload),
    billingCycle: payload.billingCycle ?? "custom",
    issuedAt: payload.issuedAt,
    validUntil: getLicenseExpiry(payload),
    customerName: getLicenseCustomerName(payload) ?? undefined,
    features: payload.features
  }
}

export function verifyLicenseKey(licenseKey: string): LicenseKeyCheck {
  const publicKey = process.env.LICENSE_PUBLIC_KEY

  const result = verifySignedLicenseDocument(licenseKey, publicKey ?? "")

  if (!result.valid) {
    return {
      valid: false,
      reason: result.reason
    }
  }

  return {
    valid: true,
    payload: normalizeLicensePayload(result.payload),
    signedPayload: result.payload
  }
}
