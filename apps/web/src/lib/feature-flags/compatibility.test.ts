import assert from "node:assert/strict"
import test from "node:test"
import { getVisiblePremiumModules, marketplaceCategories, marketplaceModules, resolveMarketplaceModules } from "@/lib/saas-license-architecture"
import { getInstalledMarketplaceExtensions, hasFeature, normalizeFeatureKey, resolveSaasCompatibility } from "./compatibility"

test("normalizes canonical feature aliases for central hasFeature checks", () => {
  assert.equal(normalizeFeatureKey("ocr"), "feature.ocr")
  assert.equal(normalizeFeatureKey("api"), "feature.api")
  assert.equal(normalizeFeatureKey("feature.datev"), "feature.datev")
  assert.equal(normalizeFeatureKey("time_tracking_pro"), "feature.time_tracking_pro")
  assert.equal(normalizeFeatureKey("archive_pro"), "feature.archive_pro")
  assert.equal(normalizeFeatureKey("unknown"), null)
})

test("keeps old premium flag names as compatibility aliases", () => {
  assert.equal(normalizeFeatureKey("api_premium"), "feature.api")
  assert.equal(normalizeFeatureKey("feature.api_premium"), "feature.api")
  assert.equal(normalizeFeatureKey("time_pro"), "feature.time_tracking_pro")
  assert.equal(normalizeFeatureKey("feature.time_pro"), "feature.time_tracking_pro")
  assert.equal(normalizeFeatureKey("document_ai"), "feature.archive_pro")
  assert.equal(normalizeFeatureKey("portal_pro"), "feature.archive_pro")
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
  assert.equal(hasFeature("api", { legacy: { premiumLicense: true } }), true)
  assert.equal(hasFeature("api_premium", { legacy: { premiumLicense: true } }), true)
})

test("lets new architecture take priority while retaining old fallback features", () => {
  const snapshot = resolveSaasCompatibility({
    newArchitecture: {
      plan: "starter",
      featureFlags: ["feature.banking"],
      marketplaceExtensionKeys: ["banking"]
    },
    legacy: {
      premiumLicense: true
    }
  })

  assert.equal(snapshot.plan, "business")
  assert.equal(snapshot.source, "mixed")
  assert.deepEqual(snapshot.featureFlags, ["feature.api", "feature.banking", "feature.datev", "feature.ocr"])
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
      featureFlags: ["feature.ocr", "feature.datev", "feature.api"]
    }
  }).map((extension) => extension.name)

  assert.deepEqual(extensions, ["DATEV", "OCR", "API Erweiterung"])
})


test("exposes dynamic marketplace modules with prepared runtime statuses", () => {
  assert.equal(marketplaceModules.length, 16)
  assert.deepEqual(marketplaceCategories.map((group) => group.category), ["Finanzen", "KI", "E-Commerce", "Projektmanagement", "Produktion", "Business"])

  const modules = resolveMarketplaceModules({
    installedExtensionKeys: ["banking", "api-premium"],
    activeExtensionKeys: ["api-premium"]
  })

  assert.equal(modules.find((module) => module.key === "banking")?.runtimeStatus, "Installiert")
  assert.equal(modules.find((module) => module.key === "api-premium")?.runtimeStatus, "Aktiv")
  assert.equal(modules.find((module) => module.key === "multi-tenant")?.runtimeStatus, "Nicht verfuegbar")
  assert.equal(modules.find((module) => module.key === "api-premium")?.featureFlag, "feature.api_premium")
  assert.deepEqual(getVisiblePremiumModules({ activeExtensionKeys: ["api-premium"] }).map((module) => module.key), ["api-premium"])
})
