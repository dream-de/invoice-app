export type AuditRequestMetadata = {
  ipAddress: string | null
  publicIp: string | null
  privateIp: string | null
  accessHost: string | null
  accessProtocol: string | null
  accessOrigin: string | null
  userAgent: string | null
  browser: string | null
  operatingSystem: string | null
  deviceType: string | null
  country: string | null
  region: string | null
  city: string | null
  timezone: string | null
  geoProvider: string | null
}

function normalizeIp(value: string | null) {
  if (!value) return null
  const cleaned = value.trim().replace(/^for=/i, "").replace(/^"|"$/g, "")
  if (!cleaned || cleaned.toLowerCase() === "unknown") return null
  if (cleaned.startsWith("[") && cleaned.includes("]")) {
    return cleaned.slice(1, cleaned.indexOf("]")).trim() || null
  }
  return cleaned
}

function firstHeaderValue(value: string | null) {
  if (!value) return null
  return value.split(",")[0]?.trim() || null
}

function normalizeHost(value: string | null) {
  const cleaned = firstHeaderValue(value)
  if (!cleaned) return null
  return cleaned.replace(/^"|"$/g, "").trim() || null
}

function normalizeProtocol(value: string | null) {
  const cleaned = firstHeaderValue(value)?.toLowerCase().replace(/:$/, "") ?? null
  if (cleaned === "http" || cleaned === "https") return cleaned
  return null
}

function isIPv4(value: string) {
  return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(value)
}

function isIPv6(value: string) {
  return /^[0-9a-fA-F:]+$/.test(value) && value.includes(":")
}

export function isPrivateIp(value: string | null) {
  const ip = normalizeIp(value)
  if (!ip) return false

  if (isIPv4(ip)) {
    const [a, b] = ip.split(".").map((part) => Number.parseInt(part, 10))
    if (a === 10) return true
    if (a === 127) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    return false
  }

  if (isIPv6(ip)) {
    const lower = ip.toLowerCase()
    if (lower === "::1") return true
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true
    if (lower.startsWith("fe80")) return true
  }

  return false
}

function isPublicIp(value: string | null) {
  const ip = normalizeIp(value)
  if (!ip) return false
  return !isPrivateIp(ip)
}

export function parseForwardedFor(value: string | null) {
  const values = (value ?? "")
    .split(",")
    .map((part) => normalizeIp(part))
    .filter((part): part is string => Boolean(part))

  let publicIp: string | null = null
  let privateIp: string | null = null

  for (const entry of values) {
    if (!publicIp && isPublicIp(entry)) publicIp = entry
    if (!privateIp && isPrivateIp(entry)) privateIp = entry
    if (publicIp && privateIp) break
  }

  return {
    publicIp,
    privateIp,
    ipAddress: publicIp ?? privateIp ?? values[0] ?? null
  }
}

export function getClientIpFromHeaders(headers: Headers) {
  return getClientIpMetadataFromHeaders(headers).ipAddress
}

export function getClientIpMetadataFromHeaders(headers: Headers) {
  const candidates = [
    normalizeIp(headers.get("cf-connecting-ip")),
    normalizeIp(headers.get("x-real-ip")),
    ...((headers.get("x-forwarded-for") ?? "")
      .split(",")
      .map((part) => normalizeIp(part))
      .filter((part): part is string => Boolean(part)))
  ]

  let publicIp: string | null = null
  let privateIp: string | null = null

  for (const candidate of candidates) {
    if (!publicIp && isPublicIp(candidate)) publicIp = candidate
    if (!privateIp && isPrivateIp(candidate)) privateIp = candidate
    if (publicIp && privateIp) break
  }

  return {
    publicIp,
    privateIp,
    ipAddress: publicIp ?? privateIp ?? candidates[0] ?? null
  }
}

export function getAccessMetadataFromRequest(request: Request) {
  const requestUrl = new URL(request.url)
  const protocol = normalizeProtocol(request.headers.get("x-forwarded-proto")) ?? requestUrl.protocol.replace(/:$/, "")
  const host =
    normalizeHost(request.headers.get("x-forwarded-host")) ??
    normalizeHost(request.headers.get("host")) ??
    requestUrl.host

  return {
    accessHost: host,
    accessProtocol: protocol || null,
    accessOrigin: host && protocol ? `${protocol}://${host}` : requestUrl.origin
  }
}

export function parseBrowser(userAgent: string | null) {
  const value = userAgent ?? ""
  if (!value) return null
  if (/Edg\//.test(value)) return "Edge"
  if (/CriOS\//.test(value)) return "Chrome"
  if (/FxiOS\//.test(value)) return "Firefox"
  if (/Chrome\//.test(value) && !/Chromium\//.test(value)) return "Chrome"
  if (/Firefox\//.test(value)) return "Firefox"
  if (/Version\/[\d.]+.*Mobile\/.*Safari\//.test(value)) return "Mobile Safari"
  if (/Safari\//.test(value) && !/Chrome\//.test(value)) return "Safari"
  return "Unknown"
}

export function parseOperatingSystem(userAgent: string | null) {
  const value = userAgent ?? ""
  if (!value) return null
  if (/Windows NT/.test(value)) return "Windows"
  if (/iPhone|iPad|iPod/.test(value)) return "iOS"
  if (/Android/.test(value)) return "Android"
  if (/Mac OS X|Macintosh/.test(value)) return "macOS"
  if (/Linux/.test(value)) return "Linux"
  return "Unknown"
}

export function parseDeviceType(userAgent: string | null) {
  const value = userAgent ?? ""
  if (!value) return null
  if (/iPad|Tablet/i.test(value)) return "Tablet"
  if (/Mobi|Android|iPhone|iPod/i.test(value)) return "Mobile"
  if (/Windows NT|Macintosh|Mac OS X|Linux/i.test(value)) return "Desktop"
  return "Unknown"
}

export function getAuditRequestMetadata(request: Request): AuditRequestMetadata {
  const userAgent = request.headers.get("user-agent")?.trim() || null
  const ipMetadata = getClientIpMetadataFromHeaders(request.headers)
  const accessMetadata = getAccessMetadataFromRequest(request)
  return {
    ipAddress: ipMetadata.ipAddress,
    publicIp: ipMetadata.publicIp,
    privateIp: ipMetadata.privateIp,
    accessHost: accessMetadata.accessHost,
    accessProtocol: accessMetadata.accessProtocol,
    accessOrigin: accessMetadata.accessOrigin,
    userAgent,
    browser: parseBrowser(userAgent),
    operatingSystem: parseOperatingSystem(userAgent),
    deviceType: parseDeviceType(userAgent),
    country: null,
    region: null,
    city: null,
    timezone: null,
    geoProvider: null
  }
}

export type GeoLookupResult = {
  country: string | null
  region: string | null
  city: string | null
  timezone: string | null
  geoProvider: string | null
}

function readTextValue(payload: Record<string, unknown> | null, keys: string[]) {
  if (!payload) return null
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return null
}

function getGeoEndpoint() {
  const enabled = process.env.GEOIP_ENABLED === "true"
  if (!enabled) return null
  const endpoint = process.env.GEOIP_URL || process.env.GEOIP_ENDPOINT
  if (!endpoint) return null
  return endpoint
}

export async function resolveGeoLookup(publicIp: string | null, fetchImpl: typeof fetch = fetch): Promise<GeoLookupResult | null> {
  const endpoint = getGeoEndpoint()
  if (!publicIp || !endpoint) return null

  const url = new URL(endpoint)
  url.searchParams.set("ip", publicIp)

  const timeoutMs = Number.parseInt(process.env.GEOIP_TIMEOUT_MS ?? "", 10)
  const controller = new AbortController()
  const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 1500
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: { accept: "application/json" }
    })
    if (!response.ok) return null

    const payload = await response.json().catch(() => null)
    if (!payload || typeof payload !== "object") return null

    const body = payload as Record<string, unknown>
    const nested = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : null
    const source = nested ?? body

    const country = readTextValue(source, ["country", "countryName", "country_name"])
    const region = readTextValue(source, ["region", "regionName", "region_name", "state", "stateName"])
    const city = readTextValue(source, ["city", "cityName"])
    const timezone = readTextValue(source, ["timezone", "time_zone", "timezoneName"])
    const configuredProvider = process.env.GEOIP_PROVIDER?.trim() || null
    const geoProvider = readTextValue(body, ["provider", "source"]) ?? readTextValue(source, ["provider", "source"]) ?? configuredProvider ?? new URL(endpoint).hostname

    return {
      country,
      region,
      city,
      timezone,
      geoProvider
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
