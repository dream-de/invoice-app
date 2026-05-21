import test from "node:test"
import assert from "node:assert/strict"

import {
  defaultProDesktopTenantScope,
  describeProDesktopProduct,
  proDesktopProductProfile
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
