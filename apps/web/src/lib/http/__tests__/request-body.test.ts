import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { RequestBodyError, readJsonBodyWithLimit } from "@/lib/http/request-body"

function jsonRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("https://invoice.test/api/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body
  })
}

describe("request body helper", () => {
  it("parses JSON bodies within the configured limit", async () => {
    const body = await readJsonBodyWithLimit<{ ok: boolean }>(
      jsonRequest(JSON.stringify({ ok: true })),
      { maxBytes: 1024 }
    )

    assert.equal(body.ok, true)
  })

  it("rejects bodies over the declared content-length limit", async () => {
    await assert.rejects(
      readJsonBodyWithLimit(jsonRequest("{}", { "content-length": "2048" }), { maxBytes: 1024 }),
      (error) => error instanceof RequestBodyError && error.code === "body_too_large" && error.status === 413
    )
  })

  it("rejects bodies over the actual byte limit", async () => {
    await assert.rejects(
      readJsonBodyWithLimit(jsonRequest(JSON.stringify({ value: "x".repeat(2048) })), { maxBytes: 256 }),
      (error) => error instanceof RequestBodyError && error.code === "body_too_large" && error.status === 413
    )
  })

  it("can throw on invalid JSON instead of falling back", async () => {
    await assert.rejects(
      readJsonBodyWithLimit(jsonRequest("{"), { invalidJson: "throw" }),
      (error) => error instanceof RequestBodyError && error.code === "invalid_json" && error.status === 400
    )
  })
})
