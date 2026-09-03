export type HeaderReader = {
  get(name: string): string | null
}

export type RequestGuardEnv = Record<string, string | undefined>

export type RequestGuardInput = {
  method: string
  url: string
  headers: HeaderReader
  env?: RequestGuardEnv
  basicAuthUserEnv?: string
  basicAuthPasswordEnv?: string
  basicAuthRequiredEnv?: string
  fallbackBasicAuthUserEnv?: string
  fallbackBasicAuthPasswordEnv?: string
  defaultBasicAuthRequired?: boolean
  protectMutatingApiSameOrigin?: boolean
  protectAppSession?: boolean
  sessionCookieName?: string
  sessionSecretEnv?: string
  publicPaths?: string[]
}

export type RequestGuardDecision =
  | { allowed: true }
  | {
      allowed: false
      status: 401 | 403 | 503
      message: string
      headers?: Record<string, string>
      redirectTo?: string
    }

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])
const DEFAULT_SESSION_COOKIE_NAME = "dream_invoice_session"
const DEFAULT_PUBLIC_PATHS = ["/login", "/api/auth"]

function envValue(env: RequestGuardEnv, key: string | undefined): string | undefined {
  if (!key) return undefined
  const value = env[key]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function envFlag(env: RequestGuardEnv, key: string | undefined, fallback = false): boolean {
  const value = envValue(env, key)
  if (!value) return fallback
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

function decodeBasicCredentials(header: string): { user: string; password: string } | null {
  const [scheme, encoded] = header.split(" ")
  if (scheme?.toLowerCase() !== "basic" || !encoded) return null

  try {
    const decoded =
      typeof globalThis.atob === "function"
        ? globalThis.atob(encoded)
        : Buffer.from(encoded, "base64").toString("utf8")
    const separator = decoded.indexOf(":")
    if (separator < 0) return null
    return {
      user: decoded.slice(0, separator),
      password: decoded.slice(separator + 1)
    }
  } catch {
    return null
  }
}

function basicAuthDecision(input: RequestGuardInput): RequestGuardDecision {
  const env = input.env ?? {}
  const required = envFlag(
    env,
    input.basicAuthRequiredEnv,
    input.defaultBasicAuthRequired ?? false
  )
  const password =
    envValue(env, input.basicAuthPasswordEnv) ??
    envValue(env, input.fallbackBasicAuthPasswordEnv)

  if (!required) return { allowed: true }

  if (!password) {
    return {
      allowed: false,
      status: 503,
      message: "Deployment authentication is required but no password is configured."
    }
  }

  const user =
    envValue(env, input.basicAuthUserEnv) ??
    envValue(env, input.fallbackBasicAuthUserEnv) ??
    "admin"
  const credentials = decodeBasicCredentials(input.headers.get("authorization") ?? "")

  if (credentials?.user === user && credentials.password === password) {
    return { allowed: true }
  }

  return {
    allowed: false,
    status: 401,
    message: "Authentication required.",
    headers: {
      "WWW-Authenticate": 'Basic realm="Dream Invoice", charset="UTF-8"'
    }
  }
}

function isLoopbackHostname(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname.toLowerCase())
}

function externalRequestOrigins(requestUrl: URL, headers: HeaderReader): URL[] {
  const origins = [new URL(requestUrl.origin)]
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim()
  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim()
  const host = forwardedHost || headers.get("host")?.trim()

  if (host) {
    const protocol = forwardedProto || requestUrl.protocol.replace(":", "")
    try {
      origins.push(new URL(protocol + "://" + host))
    } catch {
      // Ignore malformed proxy headers and keep checking the request URL origin.
    }
  }

  return origins
}

function isSameOrigin(requestUrl: URL, headers: HeaderReader, value: string): boolean {
  if (value === "null") return false

  try {
    const parsed = new URL(value)
    return externalRequestOrigins(requestUrl, headers).some((allowed) => {
      if (parsed.protocol !== allowed.protocol) return false
      if (parsed.host === allowed.host) return true
      return parsed.port === allowed.port && isLoopbackHostname(parsed.hostname) && isLoopbackHostname(allowed.hostname)
    })
  } catch {
    return false
  }
}

function sameOriginDecision(input: RequestGuardInput): RequestGuardDecision {
  if (input.protectMutatingApiSameOrigin === false) return { allowed: true }

  const requestUrl = new URL(input.url)
  const method = input.method.toUpperCase()

  if (!requestUrl.pathname.startsWith("/api/") || !MUTATING_METHODS.has(method)) {
    return { allowed: true }
  }

  const env = input.env ?? {}
  if (envFlag(env, "DREAM_INVOICE_DISABLE_SAME_ORIGIN_GUARD")) {
    return { allowed: true }
  }

  const origin = input.headers.get("origin")
  if (origin && !isSameOrigin(requestUrl, input.headers, origin)) {
    return {
      allowed: false,
      status: 403,
      message: "Cross-origin write requests are not allowed."
    }
  }

  const referer = input.headers.get("referer")
  if (!origin && referer && !isSameOrigin(requestUrl, input.headers, referer)) {
    return {
      allowed: false,
      status: 403,
      message: "Cross-origin write requests are not allowed."
    }
  }

  return { allowed: true }
}

function getCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=")
    if (rawName === name) return rawValue.join("=") || null
  }

  return null
}

function isPublicPath(pathname: string, publicPaths: string[]) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"))
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  const decoded = typeof globalThis.atob === "function"
    ? globalThis.atob(padded)
    : Buffer.from(padded, "base64").toString("binary")
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0))
}

function bytesToBase64Url(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")
  const encoded = typeof globalThis.btoa === "function"
    ? globalThis.btoa(binary)
    : Buffer.from(binary, "binary").toString("base64")
  return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function safeEqual(actual: string, expected: string) {
  if (actual.length !== expected.length) return false

  let diff = 0
  for (let index = 0; index < actual.length; index += 1) {
    diff |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  }

  return diff === 0
}

async function signSessionPayload(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  return bytesToBase64Url(new Uint8Array(signature))
}

async function hasValidSessionToken(token: string | null, secret: string) {
  if (!token) return false

  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false

  const expectedSignature = await signSessionPayload(payload, secret)
  if (!safeEqual(signature, expectedSignature)) return false

  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)))
    const now = Math.floor(Date.now() / 1000)
    return typeof parsed.userId === "string" && typeof parsed.expiresAt === "number" && parsed.expiresAt > now
  } catch {
    return false
  }
}

async function appSessionDecision(input: RequestGuardInput): Promise<RequestGuardDecision> {
  if (!input.protectAppSession) return { allowed: true }

  const requestUrl = new URL(input.url)
  const pathname = requestUrl.pathname
  const publicPaths = input.publicPaths ?? DEFAULT_PUBLIC_PATHS

  if (isPublicPath(pathname, publicPaths)) return { allowed: true }

  const secret = envValue(input.env ?? {}, input.sessionSecretEnv ?? "AUTH_SECRET")
  if (!secret || secret === "change-this-secret-before-production") {
    return {
      allowed: false,
      status: 503,
      message: "App session authentication is required but AUTH_SECRET is not configured."
    }
  }

  const token = getCookieValue(input.headers.get("cookie"), input.sessionCookieName ?? DEFAULT_SESSION_COOKIE_NAME)
  if (await hasValidSessionToken(token, secret)) return { allowed: true }

  return {
    allowed: false,
    status: 401,
    message: "App session required.",
    redirectTo: "/login"
  }
}

export function evaluateRequestGuard(input: RequestGuardInput): RequestGuardDecision {
  const auth = basicAuthDecision(input)
  if (!auth.allowed) return auth

  return sameOriginDecision(input)
}

export async function evaluateAppRequestGuard(input: RequestGuardInput): Promise<RequestGuardDecision> {
  const guard = evaluateRequestGuard(input)
  if (!guard.allowed) return guard

  return appSessionDecision(input)
}
