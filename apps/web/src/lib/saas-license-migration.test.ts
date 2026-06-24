import assert from "node:assert/strict"
import test from "node:test"
import { mapLegacyLicenseToSaasEntitlements, newFeatureFlags, newMarketplaceExtensions } from "./saas-license-migration"

test("defines the requested Phase 5 and 6 feature flags", () => {
  assert.deepEqual(newFeatureFlags, [
    "feature.banking",
    "feature.datev",
    "feature.ocr",
    "feature.ai_assistant",
    "feature.inventory",
    "feature.shopify",
    "feature.woocommerce",
    "feature.api",
    "feature.time_tracking_pro",
    "feature.archive_pro"
  ])
})

test("maps premium_license compatibility to business plus core feature flags", () => {
  const result = mapLegacyLicenseToSaasEntitlements({
    premiumLicense: true,
    maxUsers: 25
  })

  assert.equal(result.plan, "business")
  assert.equal(result.seats, 25)
  assert.deepEqual(result.featureFlags, ["feature.api", "feature.datev", "feature.ocr"])
  assert.deepEqual(result.marketplaceExtensionKeys, ["api-extension", "datev", "ocr"])
})

test("maps old license package features to marketplace extensions", () => {
  const result = mapLegacyLicenseToSaasEntitlements({
    plan: "enterprise",
    features: {
      datevExport: true,
      financeAutomation: true,
      apiAccess: true,
      multiCompany: true
    }
  })

  assert.equal(result.plan, "enterprise")
  assert.deepEqual(result.featureFlags, [
    "feature.api",
    "feature.banking",
    "feature.datev"
  ])
  assert.deepEqual(result.marketplaceExtensionKeys, ["api-extension", "banking", "datev"])
})

test("keeps marketplace catalog aligned with requested Phase 5 and 6 modules", () => {
  assert.equal(newMarketplaceExtensions.length, 10)
  assert.equal(newMarketplaceExtensions.some((item) => item.name === "Banking" && item.featureFlag === "feature.banking"), true)
  assert.equal(newMarketplaceExtensions.some((item) => item.name === "API Erweiterung" && item.featureFlag === "feature.api"), true)
  assert.equal(newMarketplaceExtensions.some((item) => item.name === "Dokumentenarchiv Pro" && item.featureFlag === "feature.archive_pro"), true)
})
