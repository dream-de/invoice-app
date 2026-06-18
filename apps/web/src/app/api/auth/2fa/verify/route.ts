import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { verifyTotpCode } from "@/lib/auth/totp"
import { SESSION_COOKIE_NAME, createSessionToken, getSessionCookieOptions, verifyTwoFactorChallengeToken } from "@/lib/auth/session"
import { verifyPassword } from "@/lib/auth/password"
import { RateLimitError, assertRateLimit, clearRateLimit, clientAddress } from "@/lib/auth/rate-limit"
import { appendNotification } from "@/lib/notifications/store"
import { demoSessionUser, isDemoMode } from "@/lib/demo-mode"
import { RequestBodyError, readJsonBodyWithLimit } from "@/lib/http/request-body"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TWO_FACTOR_WINDOW_MS = 10 * 60 * 1000
const MAX_TWO_FACTOR_ATTEMPTS = 6

async function parseBody(request: Request) {
  return readJsonBodyWithLimit<Record<string, unknown>>(request)
}

function parseBackupCodes(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function rateLimitResponse(error: RateLimitError) {
  return NextResponse.json(
    { ok: false, error: "Zu viele Sicherheitscode-Versuche. Bitte spaeter erneut versuchen.", code: "rate_limited" },
    { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } }
  )
}

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, user: demoSessionUser, mode: "demo" })
  }

  let body: Record<string, unknown>
  try {
    body = await parseBody(request)
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }
    throw error
  }

  const challengeToken = typeof body.challengeToken === "string" ? body.challengeToken : ""
  const code = typeof body.code === "string" ? body.code.trim() : ""
  const payload = verifyTwoFactorChallengeToken(challengeToken)

  if (!payload) {
    return NextResponse.json({ ok: false, error: "2FA-Anmeldung ist abgelaufen. Bitte erneut anmelden." }, { status: 401 })
  }

  const rateLimitKey = "2fa:" + clientAddress(request) + ":" + payload.userId
  try {
    assertRateLimit({
      key: rateLimitKey,
      windowMs: TWO_FACTOR_WINDOW_MS,
      maxAttempts: MAX_TWO_FACTOR_ATTEMPTS
    })
  } catch (error) {
    if (error instanceof RateLimitError) return rateLimitResponse(error)
    throw error
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || user.status !== "active" || !user.emailVerifiedAt || !user.twoFactorSecret || !user.twoFactorEnabledAt) {
    return NextResponse.json({ ok: false, error: "2FA ist fuer dieses Konto nicht aktiv." }, { status: 400 })
  }

  let valid = verifyTotpCode(user.twoFactorSecret, code)
  const backupCodes = parseBackupCodes(user.twoFactorBackupCodes)

  if (!valid && backupCodes.length) {
    const remainingCodes: string[] = []
    for (const backupCodeHash of backupCodes) {
      if (!valid && await verifyPassword(code.toUpperCase(), backupCodeHash)) {
        valid = true
        continue
      }
      remainingCodes.push(backupCodeHash)
    }

    if (valid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: remainingCodes }
      })
    }
  }

  if (!valid) {
    return NextResponse.json({ ok: false, error: "Der Sicherheitscode ist ungueltig." }, { status: 401 })
  }

  clearRateLimit(rateLimitKey)

  const token = createSessionToken(user.id)
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  })
  const response = NextResponse.json({
    ok: true,
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      status: updated.status
    }
  })
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())

  await writeAuditLog({
    action: "auth.login",
    entity: "user",
    entityId: user.id,
    data: { email: user.email, role: user.role, twoFactor: true },
    requestMetadata: getAuditRequestMetadata(request)
  })
  await appendNotification({
    category: "security",
    tone: "info",
    title: "2FA-Anmeldung erkannt",
    message: user.email + " hat sich mit zweitem Faktor angemeldet.",
    href: "/dashboard-v2/account/security",
    source: "auth-login-2fa:" + user.id + ":" + Date.now()
  }).catch(() => null)

  return response
}
