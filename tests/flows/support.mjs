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
