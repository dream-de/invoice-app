import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { verifyTotpCode } from "@/lib/auth/totp"
import { SESSION_COOKIE_NAME, createSessionToken, getSessionCookieOptions, verifyTwoFactorChallengeToken } from "@/lib/auth/session"
import { verifyPassword } from "@/lib/auth/password"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function parseBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

function parseBackupCodes(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

export async function POST(request: Request) {
  const body = await parseBody(request)
  const challengeToken = typeof body.challengeToken === "string" ? body.challengeToken : ""
  const code = typeof body.code === "string" ? body.code.trim() : ""
  const payload = verifyTwoFactorChallengeToken(challengeToken)

  if (!payload) {
    return NextResponse.json({ ok: false, error: "2FA-Anmeldung ist abgelaufen. Bitte erneut anmelden." }, { status: 401 })
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
    data: { email: user.email, role: user.role, twoFactor: true }
  })

  return response
}
