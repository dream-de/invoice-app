import assert from "node:assert/strict"
import test from "node:test"
import { getInstalledMarketplaceExtensions, hasFeature, normalizeFeatureKey, resolveSaasCompatibility } from "./compatibility"

test("normalizes feature aliases for central hasFeature checks", () => {
  assert.equal(normalizeFeatureKey("ocr"), "feature.ocr")
  assert.equal(normalizeFeatureKey("api_premium"), "feature.api_premium")
  assert.equal(normalizeFeatureKey("feature.datev"), "feature.datev")
  assert.equal(normalizeFeatureKey("unknown"), null)
})

test("keeps legacy premium customers on business features through fallback", () => {
  const snapshot = resolveSaasCompatibility({
    legacy: {
      premiumLicense: true,
      maxUsers: 25
    }
  })

  assert.equal(snapshot.plan, "business")
  assert.equal(snapshot.source, "legacy")
  assert.equal(hasFeature("ocr", { legacy: { premiumLicense: true } }), true)
  assert.equal(hasFeature("datev", { legacy: { premiumLicense: true } }), true)
  assert.equal(hasFeature("api_premium", { legacy: { premiumLicense: true } }), true)
})

test("lets new architecture take priority while retaining old fallback features", () => {
  const snapshot = resolveSaasCompatibility({
    newArchitecture: {
      plan: "starter",
      featureFlags: ["feature.banking"],
      marketplaceExtensionKeys: ["stripe"]
    },
    legacy: {
      premiumLicense: true
    }
  })

  assert.equal(snapshot.plan, "business")
  assert.equal(snapshot.source, "mixed")
  assert.deepEqual(snapshot.featureFlags, ["feature.api_premium", "feature.banking", "feature.datev", "feature.ocr"])
  assert.equal(hasFeature("banking", { newArchitecture: { featureFlags: ["feature.banking"] } }), true)
})

test("translates legacy premium roles into new permission actions without granting feature flags", () => {
  const snapshot = resolveSaasCompatibility({
    legacy: {
      premiumRole: true,
      role: "admin"
    }
  })

  assert.equal(snapshot.featureFlags.length, 0)
  assert.equal(snapshot.translatedPermissions.some((permission) => permission.scope === "billing" && permission.action === "approve"), true)
  assert.equal(snapshot.translatedPermissions.some((permission) => permission.scope === "marketplace" && permission.action === "export"), true)
})

test("resolves marketplace-compatible installed extensions from feature flags", () => {
  const extensions = getInstalledMarketplaceExtensions({
    newArchitecture: {
      featureFlags: ["feature.ocr", "feature.datev", "feature.api_premium"]
    }
  }).map((extension) => extension.name)

  assert.deepEqual(extensions, ["DATEV", "OCR KI", "API Premium"])
})
