import { NextResponse } from "next/server"
import { z } from "zod"
import { writeAuditLog } from "@/lib/audit/log"
import { authenticateAppUser, mapAuthError } from "@/lib/auth/service"
import { SESSION_COOKIE_NAME, createSessionToken, getSessionCookieOptions } from "@/lib/auth/session"
import { RateLimitError, assertRateLimit, clearRateLimit, clientAddress } from "@/lib/auth/rate-limit"
import { appendNotification } from "@/lib/notifications/store"
import { demoSessionUser, isDemoMode, isValidDemoLogin } from "@/lib/demo-mode"
import { RequestBodyError, readJsonBodyWithLimit } from "@/lib/http/request-body"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const loginSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1)
})

type LoginBody = z.infer<typeof loginSchema>

export function envInt(name: string, fallback: number, min: number, max: number) {
  const parsed = Number(process.env[name])
  if (!Number.isInteger(parsed)) return fallback
  return Math.min(Math.max(parsed, min), max)
}

export function loginRateLimitConfig() {
  return {
    windowMs: envInt("DREAM_INVOICE_LOGIN_WINDOW_MS", 15 * 60 * 1000, 60_000, 60 * 60 * 1000),
    maxAttempts: envInt("DREAM_INVOICE_LOGIN_MAX_ATTEMPTS", 8, 1, 100)
  }
}

function loginRateLimitKey(request: Request, body: LoginBody) {
  return "login:" + clientAddress(request) + ":" + body.email
}

async function parseBody(request: Request): Promise<LoginBody> {
  const body = await readJsonBodyWithLimit<Record<string, unknown>>(request, {
    invalidJson: "throw"
  })
  return loginSchema.parse(body)
}

export async function POST(request: Request) {
  let rateLimitKey = ""

  try {
    const body = await parseBody(request)

    if (isDemoMode()) {
      if (!isValidDemoLogin(body.email, body.password)) {
        return NextResponse.json(
          { ok: false, error: "Demo-Zugangsdaten sind ungueltig.", code: "invalid_credentials" },
          { status: 401 }
        )
      }

      const response = NextResponse.json({ ok: true, requiresTwoFactor: false, user: demoSessionUser, mode: "demo" })
      response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(demoSessionUser.id), getSessionCookieOptions())
      return response
    }

    rateLimitKey = loginRateLimitKey(request, body)
    assertRateLimit({
      key: rateLimitKey,
      ...loginRateLimitConfig()
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
    await appendNotification({
      category: "security",
      tone: "info",
      title: "Anmeldung erkannt",
      message: user.email + " hat sich angemeldet.",
      href: "/account/security",
      source: "auth-login:" + user.id + ":" + Date.now()
    }).catch(() => null)

    return response
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "E-Mail oder Passwort ist ungueltig.", code: "invalid_credentials" },
        { status: 401 }
      )
    }

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
