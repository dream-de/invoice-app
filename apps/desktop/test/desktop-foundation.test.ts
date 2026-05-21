import test from "node:test"
import { desktopLicenseProfile } from "../src/license-profile"
import assert from "node:assert/strict"

import {
  canOpenDesktopRoute,
  createDesktopDownloadPlan,
  createDesktopNotificationPlan,
  createDesktopShellState,
  describeDesktopMainProcess,
  describeDesktopProduct,
  desktopIpcChannels,
  desktopMainProcessPlan,
  desktopPreloadApi,
  desktopProductProfile,
  desktopRoutes,
  desktopWindowOptions,
  findDesktopRoute,
  isSupportedDesktopPlatform
} from "../src/index"

test("desktop product profile is stable and planned", () => {
  assert.equal(desktopProductProfile.productName, "Dream Invoice Desktop")
  assert.equal(desktopProductProfile.runtime, "planned")
  assert.equal(describeDesktopProduct(), "Dream Invoice Desktop (planned)")
})

test("desktop routes include core app areas", () => {
  assert.deepEqual(
    desktopRoutes.map((route) => route.id),
    ["dashboard", "customers", "projects", "documents", "finance", "articles", "settings"]
  )
  assert.equal(findDesktopRoute("/documents")?.label, "Documents")
})

test("offline shell blocks routes that require online services", () => {
  const offlineState = createDesktopShellState({ online: false })
  assert.equal(canOpenDesktopRoute("documents", offlineState), true)
  assert.equal(canOpenDesktopRoute("finance", offlineState), false)
})

test("ipc channels are namespaced", () => {
  for (const channel of Object.values(desktopIpcChannels)) {
    assert.match(channel, /:/)
  }
})

test("desktop Electron foundation is ready to wire", () => {
  assert.equal(describeDesktopMainProcess(), "com.dreaminvoice.desktop via electron (dreamInvoice)")
  assert.equal(desktopMainProcessPlan.singleInstanceLock, true)
  assert.equal(desktopWindowOptions.title, "Dream Invoice Desktop")
  assert.equal(desktopPreloadApi.methods.exportPdf, desktopIpcChannels.exportPdf)
})

test("desktop native service plans stay browser independent", () => {
  assert.equal(createDesktopDownloadPlan({ kind: "pdf", suggestedName: "invoice.pdf" }).mimeType, "application/pdf")
  assert.equal(createDesktopNotificationPlan({ title: "Done", body: "PDF exported", tone: "info" }).silent, true)
  assert.equal(isSupportedDesktopPlatform("darwin"), true)
  assert.equal(isSupportedDesktopPlatform("freebsd"), false)
})


test("desktop license profile keeps the normal app on the free plan", () => {
  assert.equal(desktopLicenseProfile.plan, "free")
  assert.equal(desktopLicenseProfile.enabledFeatures.includes("desktopShell"), false)
})
