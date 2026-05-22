import test from 'node:test'
import assert from 'node:assert/strict'

import { flowTestConfig } from '../global-setup.mjs'
import { assertAbsoluteHttpUrl, assertReachableHtml, describeFlowTarget, shouldRunLiveFlowTests } from '../support.mjs'

test('web flow smoke target is configured', () => {
  const url = assertAbsoluteHttpUrl(flowTestConfig.webBaseUrl, 'webBaseUrl')
  assert.equal(describeFlowTarget('web', url), 'web: ' + url.origin)
})

test('web app responds with HTML when live flow tests are enabled', async (t) => {
  if (!shouldRunLiveFlowTests()) {
    t.skip('Set DREAM_INVOICE_FLOW_LIVE=1 to run against a live web app')
    return
  }

  const url = assertAbsoluteHttpUrl(flowTestConfig.webBaseUrl, 'webBaseUrl')
  const html = await assertReachableHtml(url)
  assert.match(html, /Dream Invoice|Invoice/i)
})
