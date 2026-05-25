import assert from "node:assert/strict"
import { createSign, generateKeyPairSync } from "node:crypto"
import { describe, it } from "node:test"
import {
  canonicalizeLicensePayload,
  enforceUserLimit,
  getLicenseUserLimit,
  hasLicensedFeature,
  verifySignedLicenseDocument,
  type SignedLicensePayload
} from "../signed-license"

function signPayload(payload: SignedLicensePayload, privateKey: string) {
  const signer = createSign("RSA-SHA256")
  signer.update(canonicalizeLicensePayload(payload))
  signer.end()
  return signer.sign(privateKey).toString("base64url")
}

describe("signed license verification", () => {
  it("verifies a JSON license envelope and exposes limits/features", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" }
    })

    const payload: SignedLicensePayload = {
      version: 1,
      licenseId: "lic_test",
      plan: "pro",
      billingCycle: "yearly",
      issuedAt: "2026-05-25T00:00:00.000Z",
      expiresAt: "2027-05-25T00:00:00.000Z",
      limits: { users: 12 },
      features: { ocrImport: false } as never
    }

    const result = verifySignedLicenseDocument(
      { payload, signature: signPayload(payload, privateKey) },
      publicKey
    )

    assert.equal(result.valid, true)
    if (!result.valid) return
    assert.equal(result.payload.plan, "pro")
    assert.equal(getLicenseUserLimit(result.payload), 12)
    assert.equal(hasLicensedFeature(result.payload, "datevExport"), true)
  })

  it("rejects changed payloads after signing", () => {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" }
    })

    const payload: SignedLicensePayload = {
      version: 1,
      licenseId: "lic_test",
      plan: "free",
      issuedAt: "2026-05-25T00:00:00.000Z",
      limits: { users: 5 }
    }

    const signature = signPayload(payload, privateKey)
    const tampered: SignedLicensePayload = { ...payload, limits: { users: 50 } }
    const result = verifySignedLicenseDocument({ payload: tampered, signature }, publicKey)

    assert.equal(result.valid, false)
  })

  it("enforces user limits centrally", () => {
    assert.throws(() => enforceUserLimit(5, 5), /Benutzerlimit erreicht/)
    assert.doesNotThrow(() => enforceUserLimit(4, 5))
  })
})
