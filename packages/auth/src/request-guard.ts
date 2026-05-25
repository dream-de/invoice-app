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
}

export type RequestGuardDecision =
  | { allowed: true }
  | {
      allowed: false
      status: 401 | 403 | 503
      message: string
      headers?: Record<string, string>
    }

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

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

  if (!required && !password) return { allowed: true }

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

function isSameOrigin(requestUrl: URL, value: string): boolean {
  if (value === "null") return false

  try {
    const parsed = new URL(value)
    return parsed.protocol === requestUrl.protocol && parsed.host === requestUrl.host
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
  if (origin && !isSameOrigin(requestUrl, origin)) {
    return {
      allowed: false,
      status: 403,
      message: "Cross-origin write requests are not allowed."
    }
  }

  const referer = input.headers.get("referer")
  if (!origin && referer && !isSameOrigin(requestUrl, referer)) {
    return {
      allowed: false,
      status: 403,
      message: "Cross-origin write requests are not allowed."
    }
  }

  return { allowed: true }
}

export function evaluateRequestGuard(input: RequestGuardInput): RequestGuardDecision {
  const auth = basicAuthDecision(input)
  if (!auth.allowed) return auth

  return sameOriginDecision(input)
}
