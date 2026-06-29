import assert from "node:assert/strict"
import test from "node:test"

import { appRegistry } from "./appRegistry"
import { getLockedModules, getMarketplaceModules, getSidebarModules, getVisibleModules, isModuleUsable, requireModuleAccess } from "./moduleEngine"
import { businessDatevModuleContext, enterpriseAllExtensionsModuleContext, expiredModuleContext, freeModuleContext } from "./mockLicenseContext"

test("registry contains the requested phase 3 module catalog", () => {
  const expectedKeys = [
    "dashboard",
    "customers",
    "offers",
    "invoices",
    "documents",
    "email",
    "reports",
    "finance",
    "settings",
    "projects",
    "time_tracking",
    "rest_api",
    "webhooks",
    "open_banking_basic",
    "payment_matching",
    "multi_company",
    "sso",
    "white_label",
    "cashflow",
    "forecast",
    "bank_rules",
    "multi_banking",
    "advanced_audit_logs",
    "open_banking",
    "datev",
    "ocr",
    "warehouse",
    "shopify",
    "woocommerce",
    "nextcloud",
    "paperless_ngx",
    "google_drive",
    "openai",
    "whatsapp",
    "slack",
    "microsoft_teams"
  ]

  assert.deepEqual(appRegistry.map((module) => module.key), expectedKeys)
})

test("free context sees default core modules and hides business sidebar modules", () => {
  const visibleKeys = getVisibleModules(freeModuleContext).map((module) => module.key)
  const sidebarKeys = getSidebarModules(freeModuleContext).map((module) => module.key)

  assert.equal(visibleKeys.includes("dashboard"), true)
  assert.equal(visibleKeys.includes("projects"), false)
  assert.equal(sidebarKeys.includes("settings"), true)
})

test("installed marketplace extensions are exposed through the marketplace catalog", () => {
  const datev = getMarketplaceModules(businessDatevModuleContext).find((module) => module.key === "datev")

  assert.equal(datev?.status, "installed")
})

test("enterprise with all extensions can use enterprise and marketplace modules", () => {
  const lockedKeys = getLockedModules(enterpriseAllExtensionsModuleContext).map((module) => module.key)
  const openAi = appRegistry.find((module) => module.key === "openai")

  assert.ok(openAi)
  assert.equal(isModuleUsable(openAi, enterpriseAllExtensionsModuleContext), true)
  assert.equal(lockedKeys.includes("advanced_audit_logs"), false)
})

test("expired licenses keep modules visible but not usable", () => {
  const dashboard = appRegistry.find((module) => module.key === "dashboard")

  assert.ok(dashboard)
  assert.equal(getVisibleModules(expiredModuleContext).some((module) => module.key === "dashboard"), true)
  assert.equal(isModuleUsable(dashboard, expiredModuleContext), false)
})

test("module gates resolve string keys for frontend access checks", () => {
  assert.equal(isModuleUsable("open_banking", businessDatevModuleContext), true)

  const unknownAccess = requireModuleAccess("missing_module", businessDatevModuleContext)
  const expiredAccess = requireModuleAccess("open_banking", expiredModuleContext)

  assert.equal(unknownAccess.reason, "not_found")
  assert.equal(expiredAccess.visible, true)
  assert.equal(expiredAccess.usable, false)
  assert.equal(expiredAccess.reason, "license_inactive")
})
