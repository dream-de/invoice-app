import assert from 'node:assert/strict'

export function assertAbsoluteHttpUrl(value, label) {
  const url = new URL(value)
  assert(['http:', 'https:'].includes(url.protocol), label + ' must use http or https')
  assert(url.hostname.length > 0, label + ' must include a hostname')
  return url
}

export function describeFlowTarget(name, url) {
  return name + ': ' + url.origin
}

export function shouldRunLiveFlowTests() {
  return process.env.DREAM_INVOICE_FLOW_LIVE === '1'
}

export async function assertReachableHtml(url) {
  const response = await fetch(url)
  assert.equal(response.ok, true, 'Expected ' + url.href + ' to respond successfully')
  const contentType = response.headers.get('content-type') || ''
  assert(contentType.includes('text/html'), 'Expected HTML response, got ' + contentType)
  return response.text()
}

export async function assertReachableHtmlPath(baseUrl, path, expectedPattern) {
  const url = new URL(path, baseUrl)
  const html = await assertReachableHtml(url)
  assert.match(html, expectedPattern)
  return html
}
