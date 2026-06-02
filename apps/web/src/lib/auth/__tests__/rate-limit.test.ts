import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { RateLimitError, assertRateLimit, clearRateLimit, clientAddress } from "../rate-limit"

describe("rate limit helper", () => {
  it("blocks after the configured attempt limit until the window resets", () => {
    const key = "test:rate-limit-window"
    clearRateLimit(key)
    let now = 1_000

    assert.doesNotThrow(() => assertRateLimit({ key, windowMs: 1_000, maxAttempts: 2, now: () => now }))
    assert.doesNotThrow(() => assertRateLimit({ key, windowMs: 1_000, maxAttempts: 2, now: () => now }))

    assert.throws(
      () => assertRateLimit({ key, windowMs: 1_000, maxAttempts: 2, now: () => now }),
      (error) => error instanceof RateLimitError && error.retryAfterSeconds === 1
    )

    now = 2_001
    assert.doesNotThrow(() => assertRateLimit({ key, windowMs: 1_000, maxAttempts: 2, now: () => now }))
    clearRateLimit(key)
  })

  it("uses the first forwarded address when present", () => {
    const request = new Request("https://example.test/login", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 198.51.100.5"
      }
    })

    assert.equal(clientAddress(request), "203.0.113.10")
  })
})
