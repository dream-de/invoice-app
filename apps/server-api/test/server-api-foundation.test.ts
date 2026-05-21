import assert from "node:assert/strict"
import test from "node:test"

import { previewLicenseActivation, previewLicenseVerification, serverApiLicenseRoutes, serverApiProfile } from "../src/index"

test("server api profile is scoped to Dream Invoice", () => {
  assert.equal(serverApiProfile.id, "server-api")
  assert.equal(serverApiProfile.label, "Dream Invoice Server API")
  assert.equal(serverApiProfile.plannedDomains.includes("license"), true)
})

test("license API exposes activate and verify routes", () => {
  assert.deepEqual(
    serverApiLicenseRoutes.map((route) => route.method + " " + route.path),
    ["POST /license/activate", "POST /license/verify"]
  )
})

test("license previews keep free inactive without a key and pro active with a key", () => {
  const inactive = previewLicenseActivation("")
  assert.equal(inactive.snapshot.plan, "free")
  assert.equal(inactive.snapshot.status, "inactive")
  assert.equal(inactive.enabledFeatures.length, 0)

  const pro = previewLicenseActivation("DI-PRO-DEMO-KEY", "pro")
  assert.equal(pro.snapshot.plan, "pro")
  assert.equal(pro.snapshot.status, "active")
  assert.equal(pro.canUseProFeatures, true)
  assert.equal(pro.enabledFeatures.includes("eInvoice"), true)
})

test("license verification preview defaults to a safe free snapshot", () => {
  const verification = previewLicenseVerification()
  assert.equal(verification.snapshot.plan, "free")
  assert.equal(verification.canUseProFeatures, false)
  assert.equal(verification.enabledFeatures.includes("pdfExport"), true)
})
