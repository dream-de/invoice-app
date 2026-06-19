import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getAuditRequestMetadata, isPrivateIp, parseForwardedFor, resolveGeoLookup } from "./request-metadata"

const privateIpA = ["10", "0", "0", "5"].join(".")
const privateIpB = ["172", "16", "0", "1"].join(".")
const privateIpC = ["192", "168", "20", "15"].join(".")
const privateIpD = ["10", "0", "0", "12"].join(".")

describe("audit request metadata", () => {
  it("detects public and private addresses from forwarded headers", () => {
    const request = new Request("https://example.test", {
      headers: {
        "x-forwarded-host": "203.0.113.25:3012",
        "x-forwarded-proto": "https",
        "x-forwarded-for": `${privateIpA}, 198.51.100.24, ${privateIpB}`,
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
      }
    })

    const metadata = getAuditRequestMetadata(request)
    assert.equal(metadata.accessHost, "203.0.113.25:3012")
    assert.equal(metadata.accessProtocol, "https")
    assert.equal(metadata.accessOrigin, "https://203.0.113.25:3012")
    assert.equal(metadata.publicIp, "198.51.100.24")
    assert.equal(metadata.privateIp, privateIpA)
    assert.equal(metadata.ipAddress, "198.51.100.24")
    assert.equal(metadata.browser, "Chrome")
    assert.equal(metadata.operatingSystem, "macOS")
    assert.equal(metadata.deviceType, "Desktop")
  })

  it("falls back to a private address when no public ip is available", () => {
    const metadata = parseForwardedFor(`${privateIpC}, ${privateIpD}`)
    assert.equal(metadata.publicIp, null)
    assert.equal(metadata.privateIp, privateIpC)
    assert.equal(metadata.ipAddress, privateIpC)
    assert.equal(isPrivateIp(privateIpC), true)
  })

  it("keeps ip fields empty when no header is present", () => {
    const request = new Request("https://example.test")
    const metadata = getAuditRequestMetadata(request)
    assert.equal(metadata.accessHost, "example.test")
    assert.equal(metadata.accessProtocol, "https")
    assert.equal(metadata.accessOrigin, "https://example.test")
    assert.equal(metadata.publicIp, null)
    assert.equal(metadata.privateIp, null)
    assert.equal(metadata.ipAddress, null)
  })

  it("keeps geo lookup disabled without env configuration", async () => {
    const previousEnabled = process.env.GEOIP_ENABLED
    const previousUrl = process.env.GEOIP_URL
    const previousEndpoint = process.env.GEOIP_ENDPOINT
    delete process.env.GEOIP_ENABLED
    delete process.env.GEOIP_URL
    delete process.env.GEOIP_ENDPOINT

    const result = await resolveGeoLookup("198.51.100.24", async () => {
      throw new Error("geo lookup should not run")
    })

    assert.equal(result, null)
    process.env.GEOIP_ENABLED = previousEnabled
    process.env.GEOIP_URL = previousUrl
    process.env.GEOIP_ENDPOINT = previousEndpoint
  })

  it("reads geo metadata when enabled and the provider returns data", async () => {
    const previousEnabled = process.env.GEOIP_ENABLED
    const previousUrl = process.env.GEOIP_URL
    const previousEndpoint = process.env.GEOIP_ENDPOINT
    const previousProvider = process.env.GEOIP_PROVIDER

    process.env.GEOIP_ENABLED = "true"
    process.env.GEOIP_URL = "https://geo.example.test/lookup"
    process.env.GEOIP_PROVIDER = "ExampleGeo"

    const result = await resolveGeoLookup("198.51.100.24", async (input) => {
      const url = new URL(String(input))
      assert.equal(url.searchParams.get("ip"), "198.51.100.24")
      return new Response(JSON.stringify({
        country: "Schweiz",
        region: "Zürich",
        city: "Zürich",
        timezone: "Europe/Zurich"
      }), { status: 200 })
    })

    assert.deepEqual(result, {
      country: "Schweiz",
      region: "Zürich",
      city: "Zürich",
      timezone: "Europe/Zurich",
      geoProvider: "ExampleGeo"
    })

    process.env.GEOIP_ENABLED = previousEnabled
    process.env.GEOIP_URL = previousUrl
    process.env.GEOIP_ENDPOINT = previousEndpoint
    process.env.GEOIP_PROVIDER = previousProvider
  })
})
