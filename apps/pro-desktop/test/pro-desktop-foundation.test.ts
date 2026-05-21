import test from "node:test"
import assert from "node:assert/strict"

import {
  defaultProDesktopTenantScope,
  describeProDesktopProduct,
  findProDesktopService,
  proDesktopEinvoiceServices,
  proDesktopProductProfile,
  proDesktopServiceCatalog,
  proDesktopServiceDomains
} from "../src/index"

test("pro desktop product profile is stable and planned", () => {
  assert.equal(proDesktopProductProfile.productName, "Dream Invoice Pro Desktop")
  assert.equal(proDesktopProductProfile.appId, "com.dreaminvoice.pro-desktop")
  assert.equal(proDesktopProductProfile.includesAccountingWorkspace, true)
  assert.equal(describeProDesktopProduct(), "Dream Invoice Pro Desktop (pro, planned)")
})

test("pro desktop tenant scope has a safe local default", () => {
  assert.equal(defaultProDesktopTenantScope.tenantId, "local-demo")
  assert.equal(defaultProDesktopTenantScope.mode, "single-tenant")
})

test("pro desktop service catalog defines the planned service families", () => {
  assert.deepEqual(
    proDesktopServiceDomains.sort(),
    ["accounting", "audit", "documents", "email", "finance", "imports", "portal", "recurring"].sort()
  )
  assert.equal(findProDesktopService("datev-export")?.domain, "finance")
  assert.equal(findProDesktopService("recurring")?.proOnly, false)
})

test("pro desktop e-invoice services are isolated from the general catalog", () => {
  assert.deepEqual(
    proDesktopEinvoiceServices.map((service) => service.id),
    ["embed-zugferd-pdf", "normalize-invoice-einvoice", "zugferd-xml"]
  )
  assert.equal(proDesktopEinvoiceServices.every((service) => service.domain === "einvoice"), true)
  assert.equal(proDesktopServiceCatalog.some((service) => service.domain === "einvoice"), false)
})


test("service labels use EUR without umlaut", () => {
  const labels = [
    ...proDesktopServiceCatalog.map((service) => service.label),
    ...proDesktopEinvoiceServices.map((service) => service.label)
  ]

  const disallowed = "E" + String.fromCharCode(220) + "R"
  assert.equal(labels.some((label) => label.includes(disallowed)), false)
  assert.equal(findProDesktopService("eur-report")?.label, "EUR Report")
})
