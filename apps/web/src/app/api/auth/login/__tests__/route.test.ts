import assert from "node:assert/strict"
import { afterEach, describe, it } from "node:test"
import { envInt, loginRateLimitConfig } from "../route"

const ORIGINAL_ENV = {
  DREAM_INVOICE_LOGIN_WINDOW_MS: process.env.DREAM_INVOICE_LOGIN_WINDOW_MS,
  DREAM_INVOICE_LOGIN_MAX_ATTEMPTS: process.env.DREAM_INVOICE_LOGIN_MAX_ATTEMPTS
}

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe("login route configuration", () => {
  it("uses bounded integer environment values", () => {
    process.env.DREAM_INVOICE_LOGIN_WINDOW_MS = "120000"
    process.env.DREAM_INVOICE_LOGIN_MAX_ATTEMPTS = "3"

    assert.deepEqual(loginRateLimitConfig(), {
      windowMs: 120000,
      maxAttempts: 3
    })
  })

  it("falls back for invalid values and clamps out-of-range values", () => {
    process.env.DREAM_INVOICE_LOGIN_WINDOW_MS = "not-a-number"
    process.env.DREAM_INVOICE_LOGIN_MAX_ATTEMPTS = "999"

    assert.deepEqual(loginRateLimitConfig(), {
      windowMs: 15 * 60 * 1000,
      maxAttempts: 100
    })
  })

  it("clamps low values to the configured minimum", () => {
    process.env.DREAM_INVOICE_LOGIN_WINDOW_MS = "1"
    process.env.DREAM_INVOICE_LOGIN_MAX_ATTEMPTS = "0"

    assert.deepEqual(loginRateLimitConfig(), {
      windowMs: 60000,
      maxAttempts: 1
    })
  })

  it("keeps envInt fallback behavior explicit", () => {
    process.env.TEST_INT = "4.5"
    assert.equal(envInt("TEST_INT", 8, 1, 10), 8)
    delete process.env.TEST_INT
  })
})
