import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { createSessionToken, getSessionCookieOptions, verifySessionToken } from "../session"

const secret = "test-secret-with-enough-entropy"

describe("session tokens", () => {
  it("creates signed session tokens", () => {
    const token = createSessionToken("user_1", {
      secret,
      now: new Date("2026-05-26T10:00:00.000Z")
    })

    const payload = verifySessionToken(token, {
      secret,
      now: new Date("2026-05-26T10:05:00.000Z")
    })

    assert.equal(payload?.userId, "user_1")
  })

  it("uses the production-derived secure cookie setting", () => {
    assert.equal(getSessionCookieOptions().secure, process.env.NODE_ENV === "production")
  })

  it("rejects tampered and expired tokens", () => {
    const token = createSessionToken("user_1", {
      secret,
      now: new Date("2026-05-26T10:00:00.000Z")
    })
    const [payload, signature] = token.split(".")
    const tampered = Buffer.from(JSON.stringify({ userId: "user_2", issuedAt: 1, expiresAt: 9999999999 })).toString("base64url")

    assert.equal(verifySessionToken(`${tampered}.${signature}`, { secret }), null)
    assert.equal(
      verifySessionToken(token, {
        secret,
        now: new Date("2026-06-05T10:00:00.000Z")
      }),
      null
    )
    assert.equal(verifySessionToken(`${payload}.bad-signature`, { secret }), null)
  })
})
