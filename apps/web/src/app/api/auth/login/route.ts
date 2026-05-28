import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { authenticateAppUser, mapAuthError } from "@/lib/auth/service"
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 8
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
}

function loginRateLimitKey(request: Request, body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim().toLowerCase()
  return clientAddress(request) + ":" + email
}

function assertLoginRateLimit(key: string) {
  const now = Date.now()
  const current = loginAttempts.get(key)

  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return
  }

  if (current.count >= MAX_LOGIN_ATTEMPTS) {
    throw new Error("rate_limited")
  }

  current.count += 1
}

function clearLoginRateLimit(key: string) {
  loginAttempts.delete(key)
}

async function parseBody(request: Request): Promise<Record<string, unknown>> {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  let rateLimitKey = ""

  try {
    const body = await parseBody(request)
    rateLimitKey = loginRateLimitKey(request, body)
    assertLoginRateLimit(rateLimitKey)

    const result = await authenticateAppUser(body)

    if (result.requiresTwoFactor) {
      clearLoginRateLimit(rateLimitKey)
      return NextResponse.json({
        ok: true,
        requiresTwoFactor: true,
        challengeToken: result.challengeToken,
        user: result.user
      })
    }

    clearLoginRateLimit(rateLimitKey)

    const { user, token } = result
    const response = NextResponse.json({ ok: true, requiresTwoFactor: false, user })
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())

    await writeAuditLog({
      action: "auth.login",
      entity: "user",
      entityId: user.id,
      data: { email: user.email, role: user.role }
    })

    return response
  } catch (error) {
    if (error instanceof Error && error.message === "rate_limited") {
      return NextResponse.json(
        { ok: false, error: "Zu viele Login-Versuche. Bitte spaeter erneut versuchen.", code: "rate_limited" },
        { status: 429 }
      )
    }

    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}
