import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { assertRuntimeEnv, validateRuntimeEnv } from "../runtime"

const VALID_ENV = {
  AUTH_SECRET: "a".repeat(32),
  AUTH_COOKIE_SECURE: "false",
  NODE_ENV: "production"
}

describe("runtime env validation", () => {
  it("accepts the minimal local production environment", () => {
    assert.equal(validateRuntimeEnv(VALID_ENV).valid, true)
  })

  it("rejects missing, weak, and placeholder auth secrets", () => {
    assert.equal(validateRuntimeEnv({}).valid, false)
    assert.equal(validateRuntimeEnv({ AUTH_SECRET: "short" }).valid, false)
    assert.equal(validateRuntimeEnv({ AUTH_SECRET: "CHANGE_ME_GENERATE_RANDOM_AUTH_SECRET" }).valid, false)
    assert.equal(validateRuntimeEnv({ AUTH_SECRET: "CHANGEME_GENERATE_WITH_OPENSSL_RAND_HEX_32" }).valid, false)
  })

  it("requires secure cookies for HTTPS public URLs", () => {
    const validation = validateRuntimeEnv({
      ...VALID_ENV,
      NEXT_PUBLIC_APP_URL: "https://invoice.example.com",
      AUTH_COOKIE_SECURE: "false"
    })

    assert.equal(validation.valid, false)
    assert.equal(validation.issues.some((issue) => issue.code === "https_requires_secure_cookie"), true)
  })

  it("validates login rate limit environment values", () => {
    const validation = validateRuntimeEnv({
      ...VALID_ENV,
      DREAM_INVOICE_LOGIN_WINDOW_MS: "1",
      DREAM_INVOICE_LOGIN_MAX_ATTEMPTS: "many"
    })

    assert.equal(validation.valid, false)
    assert.equal(validation.issues.filter((issue) => issue.code === "invalid_login_rate_limit").length, 2)
  })

  it("rejects demo mode against a configured database", () => {
    const validation = validateRuntimeEnv({
      ...VALID_ENV,
      DREAM_INVOICE_DEMO_MODE: "true",
      DATABASE_URL: "postgresql://user:pass@db:5432/app"
    })

    assert.equal(validation.valid, false)
    assert.equal(validation.issues.some((issue) => issue.code === "demo_mode_with_database"), true)
  })

  it("throws a compact startup error for invalid environments", () => {
    assert.throws(
      () => assertRuntimeEnv({ AUTH_SECRET: "short" }),
      /Runtime environment validation failed/
    )
  })
})
