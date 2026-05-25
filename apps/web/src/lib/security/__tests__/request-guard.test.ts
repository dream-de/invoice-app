import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { evaluateRequestGuard } from "@dream-invoice/auth"

function headers(values: Record<string, string> = {}) {
  const normalized = new Map(
    Object.entries(values).map(([key, value]) => [key.toLowerCase(), value])
  )

  return {
    get(name: string) {
      return normalized.get(name.toLowerCase()) ?? null
    }
  }
}

function basic(user: string, password: string) {
  return "Basic " + Buffer.from(user + ":" + password, "utf8").toString("base64")
}

describe("request guard", () => {
  it("allows normal requests when deployment auth is not configured", () => {
    const decision = evaluateRequestGuard({
      method: "GET",
      url: "https://invoice.test/dashboard",
      headers: headers(),
      env: {}
    })

    assert.equal(decision.allowed, true)
  })

  it("requires basic auth when a deployment password is configured", () => {
    const denied = evaluateRequestGuard({
      method: "GET",
      url: "https://invoice.test/dashboard",
      headers: headers(),
      env: { DREAM_INVOICE_AUTH_PASSWORD: "secret" },
      basicAuthUserEnv: "DREAM_INVOICE_AUTH_USER",
      basicAuthPasswordEnv: "DREAM_INVOICE_AUTH_PASSWORD"
    })

    assert.equal(denied.allowed, false)
    assert.equal(denied.status, 401)

    const allowed = evaluateRequestGuard({
      method: "GET",
      url: "https://invoice.test/dashboard",
      headers: headers({ authorization: basic("admin", "secret") }),
      env: { DREAM_INVOICE_AUTH_PASSWORD: "secret" },
      basicAuthUserEnv: "DREAM_INVOICE_AUTH_USER",
      basicAuthPasswordEnv: "DREAM_INVOICE_AUTH_PASSWORD"
    })

    assert.equal(allowed.allowed, true)
  })

  it("fails closed when auth is required but no password is configured", () => {
    const decision = evaluateRequestGuard({
      method: "GET",
      url: "https://invoice.test/dashboard",
      headers: headers(),
      env: { DREAM_INVOICE_AUTH_REQUIRED: "true" },
      basicAuthRequiredEnv: "DREAM_INVOICE_AUTH_REQUIRED",
      basicAuthPasswordEnv: "DREAM_INVOICE_AUTH_PASSWORD"
    })

    assert.equal(decision.allowed, false)
    assert.equal(decision.status, 503)
  })

  it("blocks cross-origin mutating API requests", () => {
    const decision = evaluateRequestGuard({
      method: "POST",
      url: "https://invoice.test/api/articles/create",
      headers: headers({ origin: "https://evil.test" }),
      env: {}
    })

    assert.equal(decision.allowed, false)
    assert.equal(decision.status, 403)
  })

  it("allows same-origin mutating API requests", () => {
    const decision = evaluateRequestGuard({
      method: "POST",
      url: "https://invoice.test/api/articles/create",
      headers: headers({ origin: "https://invoice.test" }),
      env: {}
    })

    assert.equal(decision.allowed, true)
  })
})
