import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"
import { prisma } from "@dream-invoice/database"
import { assertStrongPassword, hashPassword, PasswordError, verifyPassword } from "@/lib/auth/password"

export const CUSTOMER_PORTAL_SESSION_COOKIE = "dream_invoice_customer_portal"
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14
const EMAIL_PATTERN = /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

type PortalPayload = {
  customerId: string
  issuedAt: number
  expiresAt: number
  purpose: "customer_portal"
}

export type PortalCustomer = {
  id: string
  number: string
  name: string
  contact: string | null
  email: string | null
  phone: string | null
  street: string | null
  zip: string | null
  city: string | null
  country: string
  portalEmail: string | null
}

export class CustomerPortalAuthError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "CustomerPortalAuthError"
    this.code = code
    this.status = status
  }
}

function getSecret() {
  const secret = String(process.env.AUTH_SECRET ?? "").trim()
  if (!secret) {
    throw new CustomerPortalAuthError("missing_secret", "Portal-Sitzung ist nicht konfiguriert.", 503)
  }
  return secret
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

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url")
}

function matches(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    throw new CustomerPortalAuthError("invalid_credentials", "E-Mail oder Passwort ist ungueltig.", 401)
  }
  return email
}

function normalizePassword(value: unknown) {
  const password = String(value ?? "")
  if (!password) {
    throw new CustomerPortalAuthError("invalid_credentials", "E-Mail oder Passwort ist ungueltig.", 401)
  }
  return password
}

function customerSelect() {
  return {
    id: true,
    number: true,
    name: true,
    contact: true,
    email: true,
    phone: true,
    street: true,
    zip: true,
    city: true,
    country: true,
    portalEmail: true
  } as const
}

export function createInviteToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, tokenHash: hashInviteToken(token) }
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function createCustomerPortalSessionToken(customerId: string) {
  const issuedAt = Math.floor(Date.now() / 1000)
  const payload: PortalPayload = {
    customerId,
    issuedAt,
    expiresAt: issuedAt + SESSION_DURATION_SECONDS,
    purpose: "customer_portal"
  }
  const encoded = encodeJson(payload)
  return `${encoded}.${sign(encoded)}`
}

export function verifyCustomerPortalSessionToken(token: string | null | undefined) {
  if (!token) return null
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature || !matches(signature, sign(encoded))) return null
  const payload = decodeJson<PortalPayload>(encoded)
  if (!payload || payload.purpose !== "customer_portal" || typeof payload.customerId !== "string") return null
  if (payload.expiresAt <= Math.floor(Date.now() / 1000)) return null
  return payload
}

export function customerPortalCookieOptions() {
  const secure = String(process.env.AUTH_COOKIE_SECURE ?? "").toLowerCase() === "true"
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  }
}

export async function setCustomerPortalSession(customerId: string) {
  const cookieStore = await cookies()
  cookieStore.set(CUSTOMER_PORTAL_SESSION_COOKIE, createCustomerPortalSessionToken(customerId), customerPortalCookieOptions())
}

export async function clearCustomerPortalSession() {
  const cookieStore = await cookies()
  cookieStore.set(CUSTOMER_PORTAL_SESSION_COOKIE, "", { ...customerPortalCookieOptions(), maxAge: 0 })
}

export async function getCurrentPortalCustomer(): Promise<PortalCustomer | null> {
  const cookieStore = await cookies()
  const payload = verifyCustomerPortalSessionToken(cookieStore.get(CUSTOMER_PORTAL_SESSION_COOKIE)?.value)
  if (!payload) return null

  return prisma.customer.findFirst({
    where: {
      id: payload.customerId,
      status: "active",
      portalPasswordHash: { not: null }
    },
    select: customerSelect()
  })
}

export async function requirePortalCustomer() {
  const customer = await getCurrentPortalCustomer()
  if (!customer) {
    throw new CustomerPortalAuthError("session_required", "Kundenanmeldung erforderlich.", 401)
  }
  return customer
}

export async function authenticatePortalCustomer(input: { email?: unknown; password?: unknown }) {
  const email = normalizeEmail(input.email)
  const password = normalizePassword(input.password)
  const customer = await prisma.customer.findFirst({
    where: {
      status: "active",
      OR: [{ portalEmail: email }, { email }]
    }
  })

  if (!customer?.portalPasswordHash || !await verifyPassword(password, customer.portalPasswordHash)) {
    throw new CustomerPortalAuthError("invalid_credentials", "E-Mail oder Passwort ist ungueltig.", 401)
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      portalEmail: customer.portalEmail ?? email,
      portalLastLoginAt: new Date()
    }
  })

  return customer.id
}

export async function acceptCustomerPortalInvite(input: { token?: unknown; password?: unknown }) {
  const token = String(input.token ?? "").trim()
  if (!token) {
    throw new CustomerPortalAuthError("invalid_invite", "Einladungslink ist ungueltig.", 400)
  }

  let password: string
  try {
    password = assertStrongPassword(input.password)
  } catch (error) {
    if (error instanceof PasswordError) {
      throw new CustomerPortalAuthError(error.code, error.message, 400)
    }
    throw error
  }

  const customer = await prisma.customer.findFirst({
    where: {
      status: "active",
      portalInviteTokenHash: hashInviteToken(token),
      portalInviteExpiresAt: { gt: new Date() }
    }
  })

  if (!customer?.email && !customer?.portalEmail) {
    throw new CustomerPortalAuthError("invalid_invite", "Einladungslink ist ungueltig oder abgelaufen.", 400)
  }

  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: {
      portalEmail: customer.portalEmail ?? customer.email,
      portalPasswordHash: await hashPassword(password),
      portalInviteTokenHash: null,
      portalInviteExpiresAt: null,
      portalLastLoginAt: new Date()
    }
  })

  return updated.id
}

export async function changePortalPassword(customerId: string, currentPassword: unknown, nextPassword: unknown) {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!customer?.portalPasswordHash || !await verifyPassword(normalizePassword(currentPassword), customer.portalPasswordHash)) {
    throw new CustomerPortalAuthError("invalid_credentials", "Aktuelles Passwort ist ungueltig.", 401)
  }

  let password: string
  try {
    password = assertStrongPassword(nextPassword)
  } catch (error) {
    if (error instanceof PasswordError) {
      throw new CustomerPortalAuthError(error.code, error.message, 400)
    }
    throw error
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: { portalPasswordHash: await hashPassword(password) }
  })
}

export function portalAuthErrorResponse(error: unknown) {
  if (error instanceof CustomerPortalAuthError) {
    return Response.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
  }
  return null
}
