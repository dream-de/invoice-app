import test from 'node:test'
import assert from 'node:assert/strict'

import { flowTestConfig } from '../global-setup.mjs'
import { assertAbsoluteHttpUrl, describeFlowTarget } from '../support.mjs'

test('web flow smoke target is configured', () => {
  const url = assertAbsoluteHttpUrl(flowTestConfig.webBaseUrl, 'webBaseUrl')
  assert.equal(describeFlowTarget('web', url), 'web: ' + url.origin)
})
