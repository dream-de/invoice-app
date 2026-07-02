export interface ParsedUserAgent {
  browserName: string | null
  browserVersion: string | null
  osName: string | null
  osVersion: string | null
}

export interface RequestAuditContext extends ParsedUserAgent {
  ipAddress: string | null
  userAgent: string | null
  requestId: string | null
  method: string
  endpoint: string
  referer: string | null
  sessionId: string | null
  traceId: string | null
}

const FORWARDED_HEADER = "x-forwarded-for"

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || null
}

function header(request: Request, name: string) {
  return request.headers.get(name)
}

function matchVersion(userAgent: string, pattern: RegExp) {
  return userAgent.match(pattern)?.[1]?.replaceAll("_", ".") ?? null
}

export function parseUserAgent(userAgent: string | null | undefined): ParsedUserAgent {
  const value = userAgent ?? ""
  const browser =
    value.includes("Edg/")
      ? ["Edge", matchVersion(value, /Edg\/([\d.]+)/)]
      : value.includes("Chrome/")
        ? ["Chrome", matchVersion(value, /Chrome\/([\d.]+)/)]
        : value.includes("Firefox/")
          ? ["Firefox", matchVersion(value, /Firefox\/([\d.]+)/)]
          : value.includes("Safari/") && value.includes("Version/")
            ? ["Safari", matchVersion(value, /Version\/([\d.]+)/)]
            : value.includes("PostmanRuntime/")
              ? ["Postman", matchVersion(value, /PostmanRuntime\/([\d.]+)/)]
              : [null, null]

  const os =
    value.includes("Windows NT")
      ? ["Windows", matchVersion(value, /Windows NT ([\d.]+)/)]
      : value.includes("Mac OS X")
        ? ["macOS", matchVersion(value, /Mac OS X ([\d_]+)/)]
        : value.includes("Android")
          ? ["Android", matchVersion(value, /Android ([\d.]+)/)]
          : value.includes("iPhone OS") || value.includes("CPU OS")
            ? ["iOS", matchVersion(value, /(?:iPhone OS|CPU OS) ([\d_]+)/)]
            : value.includes("Linux")
              ? ["Linux", null]
              : [null, null]

  return {
    browserName: browser[0],
    browserVersion: browser[1],
    osName: os[0],
    osVersion: os[1]
  }
}

export function getClientIp(request: Request) {
  return firstHeaderValue(header(request, FORWARDED_HEADER))
    ?? header(request, "x-real-ip")
    ?? header(request, "cf-connecting-ip")
    ?? header(request, "x-client-ip")
}

export function getRequestId(request: Request) {
  return header(request, "x-request-id")
    ?? header(request, "x-correlation-id")
    ?? header(request, "request-id")
}

export function getRequestAuditContext(request: Request): RequestAuditContext {
  const userAgent = header(request, "user-agent")
  const parsed = parseUserAgent(userAgent)
  const url = new URL(request.url)

  return {
    ...parsed,
    ipAddress: getClientIp(request),
    userAgent,
    requestId: getRequestId(request),
    method: request.method,
    endpoint: `${url.pathname}${url.search}`,
    referer: header(request, "referer"),
    sessionId: header(request, "x-session-id"),
    traceId: header(request, "traceparent") ?? header(request, "x-trace-id")
  }
}

export function buildAuditMetadata(request: Request, extraMetadata: Record<string, unknown> = {}) {
  const context = getRequestAuditContext(request)

  return {
    ...extraMetadata,
    request: {
      method: context.method,
      endpoint: context.endpoint,
      referer: context.referer,
      requestId: context.requestId,
      traceId: context.traceId,
      userAgent: context.userAgent
    }
  }
}
