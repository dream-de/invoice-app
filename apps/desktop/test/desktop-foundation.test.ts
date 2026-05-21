import test from "node:test"
import assert from "node:assert/strict"

import {
  canOpenDesktopRoute,
  createDesktopShellState,
  describeDesktopProduct,
  desktopIpcChannels,
  desktopProductProfile,
  desktopRoutes,
  findDesktopRoute
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
