import { createHmac, timingSafeEqual } from "node:crypto"

export const SESSION_COOKIE_NAME = "dream_invoice_session"
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7
export const TWO_FACTOR_CHALLENGE_DURATION_SECONDS = 60 * 5

type SessionPayload = {
  userId: string
  issuedAt: number
  expiresAt: number
  purpose?: "session" | "two_factor"
}

type SessionOptions = {
  now?: Date
  secret?: string
}

export class SessionError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "SessionError"
    this.code = code
  }
}

const INSECURE_SESSION_SECRETS = new Set([
  "change-this-secret-before-production",
  "dream-invoice-change-this-secret",
  "CHANGE_ME_GENERATE_RANDOM_AUTH_SECRET",
  "CHANGEME_GENERATE_WITH_OPENSSL_RAND_HEX_32"
])

function getSessionSecret(secret = process.env.AUTH_SECRET) {
  const value = String(secret ?? "").trim()
  if (
    !value ||
    value.startsWith("CHANGE_ME_") ||
    value.startsWith("CHANGEME_") ||
    INSECURE_SESSION_SECRETS.has(value)
  ) {
    throw new SessionError("missing_secret", "AUTH_SECRET ist nicht konfiguriert.")
  }

  if (process.env.NODE_ENV === "production" && value.length < 32) {
    throw new SessionError("weak_secret", "AUTH_SECRET muss in Production mindestens 32 Zeichen lang sein.")
  }

  return value
}

function encodeJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url")
}

function decodeJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T
  } catch {
    return null
  }
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url")
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export function assertSessionConfigured(options: SessionOptions = {}) {
  getSessionSecret(options.secret)
}

export function createSessionToken(userId: string, options: SessionOptions = {}) {
  const secret = getSessionSecret(options.secret)
  const now = options.now ?? new Date()
  const issuedAt = Math.floor(now.getTime() / 1000)
  const payload: SessionPayload = {
    userId,
    issuedAt,
    expiresAt: issuedAt + SESSION_DURATION_SECONDS,
    purpose: "session"
  }
  const encoded = encodeJson(payload)

  return `${encoded}.${sign(encoded, secret)}`
}

export function createTwoFactorChallengeToken(userId: string, options: SessionOptions = {}) {
  const secret = getSessionSecret(options.secret)
  const now = options.now ?? new Date()
  const issuedAt = Math.floor(now.getTime() / 1000)
  const payload: SessionPayload = {
    userId,
    issuedAt,
    expiresAt: issuedAt + TWO_FACTOR_CHALLENGE_DURATION_SECONDS,
    purpose: "two_factor"
  }
  const encoded = encodeJson(payload)

  return `${encoded}.${sign(encoded, secret)}`
}

export function verifySessionToken(token: string | null | undefined, options: SessionOptions = {}): SessionPayload | null {
  if (!token) return null

  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null

  const secret = getSessionSecret(options.secret)
  const expectedSignature = sign(encoded, secret)
  if (!signaturesMatch(signature, expectedSignature)) return null

  const payload = decodeJson<SessionPayload>(encoded)
  if (!payload || typeof payload.userId !== "string" || typeof payload.expiresAt !== "number") return null
  if (payload.purpose && payload.purpose !== "session") return null

  const now = Math.floor((options.now ?? new Date()).getTime() / 1000)
  if (payload.expiresAt <= now) return null

  return payload
}

export function verifyTwoFactorChallengeToken(token: string | null | undefined, options: SessionOptions = {}): SessionPayload | null {
  if (!token) return null

  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null

  const secret = getSessionSecret(options.secret)
  const expectedSignature = sign(encoded, secret)
  if (!signaturesMatch(signature, expectedSignature)) return null

  const payload = decodeJson<SessionPayload>(encoded)
  if (!payload || payload.purpose !== "two_factor" || typeof payload.userId !== "string" || typeof payload.expiresAt !== "number") return null

  const now = Math.floor((options.now ?? new Date()).getTime() / 1000)
  if (payload.expiresAt <= now) return null

  return payload
}

function envFlag(value: string | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) return true
  if (["0", "false", "no", "off"].includes(normalized)) return false
  return null
}

function shouldUseSecureSessionCookie() {
  const configured = envFlag(process.env.AUTH_COOKIE_SECURE)
  if (configured !== null) return configured

  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? process.env.ORIGIN ?? "").trim()
  return appUrl.startsWith("https://")
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureSessionCookie(),
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  }
}
