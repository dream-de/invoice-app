import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { evaluateAppRequestGuard, evaluateRequestGuard } from "@dream-invoice/auth"
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/session"

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

  it("allows local setup requests through loopback aliases", () => {
    const decision = evaluateRequestGuard({
      method: "POST",
      url: "http://localhost:3000/api/auth/setup",
      headers: headers({ origin: "http://127.0.0.1:3000" }),
      env: {}
    })

    assert.equal(decision.allowed, true)
  })

  it("allows setup requests when the proxy host is the LXC address", () => {
    const decision = evaluateRequestGuard({
      method: "POST",
      url: "http://localhost:3000/api/auth/setup",
      headers: headers({
        host: "192.168.20.25:3000",
        origin: "http://192.168.20.25:3000"
      }),
      env: {}
    })

    assert.equal(decision.allowed, true)
  })

  it("allows public login and auth endpoints without an app session", async () => {
    const login = await evaluateAppRequestGuard({
      method: "GET",
      url: "https://invoice.test/login",
      headers: headers(),
      env: { AUTH_SECRET: "test-secret" },
      protectAppSession: true
    })

    const auth = await evaluateAppRequestGuard({
      method: "POST",
      url: "https://invoice.test/api/auth/login",
      headers: headers({ origin: "https://invoice.test" }),
      env: { AUTH_SECRET: "test-secret" },
      protectAppSession: true
    })

    assert.equal(login.allowed, true)
    assert.equal(auth.allowed, true)
  })

  it("requires a valid app session for protected pages and APIs", async () => {
    const page = await evaluateAppRequestGuard({
      method: "GET",
      url: "https://invoice.test/dashboard",
      headers: headers(),
      env: { AUTH_SECRET: "test-secret" },
      protectAppSession: true
    })

    const api = await evaluateAppRequestGuard({
      method: "GET",
      url: "https://invoice.test/api/invoice/list",
      headers: headers(),
      env: { AUTH_SECRET: "test-secret" },
      protectAppSession: true
    })

    assert.equal(page.allowed, false)
    assert.equal(page.status, 401)
    assert.equal(page.redirectTo, "/login")
    assert.equal(api.allowed, false)
    assert.equal(api.status, 401)
  })

  it("accepts a signed non-expired app session", async () => {
    const token = createSessionToken("user_1", {
      secret: "test-secret"
    })

    const decision = await evaluateAppRequestGuard({
      method: "GET",
      url: "https://invoice.test/dashboard",
      headers: headers({ cookie: `${SESSION_COOKIE_NAME}=${token}` }),
      env: { AUTH_SECRET: "test-secret" },
      protectAppSession: true
    })

    assert.equal(decision.allowed, true)
  })
})
