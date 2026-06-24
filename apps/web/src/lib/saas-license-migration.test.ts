import assert from "node:assert/strict"
import test from "node:test"
import { mapLegacyLicenseToSaasEntitlements, newFeatureFlags, newMarketplaceExtensions } from "./saas-license-migration"

test("defines the requested Phase 3 feature flags", () => {
  assert.deepEqual(newFeatureFlags, [
    "feature.ocr",
    "feature.datev",
    "feature.banking",
    "feature.api_premium",
    "feature.multitenant",
    "feature.portal_pro",
    "feature.shopify",
    "feature.woocommerce",
    "feature.ai_assistant",
    "feature.document_ai",
    "feature.warehouse",
    "feature.inventory",
    "feature.time_pro",
    "feature.resource_planning"
  ])
})

test("maps premium_license compatibility to business plus core feature flags", () => {
  const result = mapLegacyLicenseToSaasEntitlements({
    premiumLicense: true,
    maxUsers: 25
  })

  assert.equal(result.plan, "business")
  assert.equal(result.seats, 25)
  assert.deepEqual(result.featureFlags, ["feature.api_premium", "feature.datev", "feature.ocr"])
  assert.deepEqual(result.marketplaceExtensionKeys, ["api-premium", "datev", "ocr-ai"])
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
    "feature.api_premium",
    "feature.banking",
    "feature.datev",
    "feature.multitenant"
  ])
  assert.deepEqual(result.marketplaceExtensionKeys, ["api-premium", "banking", "datev", "multitenant"])
})

test("keeps marketplace catalog aligned with requested categories", () => {
  assert.equal(newMarketplaceExtensions.length, 16)
  assert.equal(newMarketplaceExtensions.some((item) => item.name === "Kundenportal Pro" && item.featureFlag === "feature.portal_pro"), true)
})
