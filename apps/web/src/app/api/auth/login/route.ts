import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { authenticateAppUser, mapAuthError } from "@/lib/auth/service"
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session"
import { RateLimitError, assertRateLimit, clearRateLimit, clientAddress } from "@/lib/auth/rate-limit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 8

function loginRateLimitKey(request: Request, body: Record<string, unknown>) {
  const email = String(body.email ?? "").trim().toLowerCase()
  return "login:" + clientAddress(request) + ":" + email
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
    assertRateLimit({
      key: rateLimitKey,
      windowMs: LOGIN_WINDOW_MS,
      maxAttempts: MAX_LOGIN_ATTEMPTS
    })

    const result = await authenticateAppUser(body)

    if (result.requiresTwoFactor) {
      clearRateLimit(rateLimitKey)
      return NextResponse.json({
        ok: true,
        requiresTwoFactor: true,
        challengeToken: result.challengeToken,
        user: result.user
      })
    }

    clearRateLimit(rateLimitKey)

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
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { ok: false, error: "Zu viele Login-Versuche. Bitte spaeter erneut versuchen.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
      )
    }

    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}
