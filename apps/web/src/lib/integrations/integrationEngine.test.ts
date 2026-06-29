import assert from "node:assert/strict"
import test from "node:test"

import { businessDatevModuleContext, freeModuleContext } from "@/lib/modules/mockLicenseContext"
import { getAvailableIntegrations, getConnectedIntegrations, getIntegrationMarketplaceStatus, getIntegrationStatus, getInstalledIntegrations } from "./integrationEngine"
import { integrationRegistry } from "./integrationRegistry"
import type { IntegrationContext } from "./types"

function context(moduleContext = businessDatevModuleContext): IntegrationContext {
  return {
    moduleContext,
    installedIntegrations: ["datev"],
    configuredIntegrations: ["datev"],
    connectedIntegrations: ["datev"]
  }
}

test("registers the phase 5 integration catalog", () => {
  assert.deepEqual(integrationRegistry.map((integration) => integration.key), [
    "open_banking",
    "datev",
    "paypal",
    "stripe",
    "shopify",
    "woocommerce",
    "amazon",
    "ebay",
    "nextcloud",
    "paperless_ngx",
    "google_drive",
    "onedrive",
    "smtp",
    "whatsapp",
    "slack",
    "microsoft_teams",
    "openai",
    "claude",
    "gemini"
  ])
})

test("uses module engine context for available and installed integrations", () => {
  const runtime = context()
  const availableKeys = getAvailableIntegrations(runtime).map((integration) => integration.key)
  const installedKeys = getInstalledIntegrations(runtime).map((integration) => integration.key)
  const connectedKeys = getConnectedIntegrations(runtime).map((integration) => integration.key)

  assert.equal(availableKeys.includes("datev"), true)
  assert.equal(availableKeys.includes("open_banking"), true)
  assert.deepEqual(installedKeys, ["datev"])
  assert.deepEqual(connectedKeys, ["datev"])
  assert.equal(getIntegrationStatus("datev", runtime), "connected")
})

test("keeps free context limited to free-plan integrations", () => {
  const availableKeys = getAvailableIntegrations(context(freeModuleContext)).map((integration) => integration.key)

  assert.deepEqual(availableKeys, ["smtp"])
})

test("maps marketplace lifecycle status to UI actions", () => {
  assert.deepEqual(getIntegrationMarketplaceStatus("datev", {
    ...context(),
    installedIntegrations: [],
    configuredIntegrations: [],
    connectedIntegrations: []
  }), { status: "installed", button: "Konfigurieren" })

  assert.deepEqual(getIntegrationMarketplaceStatus("shopify", {
    ...context(),
    installedIntegrations: [],
    configuredIntegrations: [],
    connectedIntegrations: []
  }), { status: "available", button: "Installieren" })

  assert.deepEqual(getIntegrationMarketplaceStatus("shopify", {
    ...context(),
    installedIntegrations: ["shopify"],
    configuredIntegrations: [],
    connectedIntegrations: []
  }), { status: "installed", button: "Konfigurieren" })

  assert.deepEqual(getIntegrationMarketplaceStatus("shopify", {
    ...context(),
    installedIntegrations: ["shopify"],
    configuredIntegrations: ["shopify"],
    connectedIntegrations: []
  }), { status: "configured", button: "Verbinden" })

  assert.deepEqual(getIntegrationMarketplaceStatus("shopify", {
    ...context(),
    installedIntegrations: ["shopify"],
    configuredIntegrations: ["shopify"],
    connectedIntegrations: ["shopify"]
  }), { status: "connected", button: "Synchronisieren" })

  assert.deepEqual(getIntegrationMarketplaceStatus("shopify", {
    ...context(),
    installedIntegrations: ["shopify"],
    configuredIntegrations: ["shopify"],
    connectedIntegrations: [],
    errorIntegrations: ["shopify"]
  }), { status: "error", button: "Fehler prüfen" })

  assert.deepEqual(getIntegrationMarketplaceStatus("datev", context(freeModuleContext)), { status: "locked", button: "Upgrade" })
})
