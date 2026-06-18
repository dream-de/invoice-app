import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { hashPassword } from "@/lib/auth/password"
import { createBackupCodes, verifyTotpCode } from "@/lib/auth/totp"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { appendNotification } from "@/lib/notifications/store"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const current = await requireCurrentUser()
    const body = await request.json().catch(() => ({}))
    const code = String(body.code ?? "")
    if (isDemoMode()) {
      return NextResponse.json(demoModeResponse({ ok: true, backupCodes: createBackupCodes() }))
    }

    const user = await prisma.user.findUnique({ where: { id: current.id } })

    if (!user?.twoFactorSecret) {
      return NextResponse.json({ ok: false, error: "Bitte 2FA zuerst vorbereiten." }, { status: 400 })
    }

    if (!verifyTotpCode(user.twoFactorSecret, code)) {
      return NextResponse.json({ ok: false, error: "Der Sicherheitscode ist ungueltig." }, { status: 400 })
    }

    const backupCodes = createBackupCodes()
    const backupCodeHashes = await Promise.all(backupCodes.map((backupCode) => hashPassword(backupCode)))
    await prisma.user.update({
      where: { id: current.id },
      data: {
        twoFactorEnabledAt: new Date(),
        twoFactorBackupCodes: backupCodeHashes
      }
    })

    await writeAuditLog({
      action: "account.2fa_enable",
      entity: "user",
      entityId: current.id,
      data: { email: current.email },
      requestMetadata: getAuditRequestMetadata(request)
    })
    await appendNotification({
      category: "security",
      tone: "success",
      title: "2FA aktiviert",
      message: current.email + " hat Zwei-Faktor-Authentifizierung aktiviert.",
      href: "/dashboard-v2/account/security",
      source: "2fa-enable:" + current.id + ":" + Date.now()
    }).catch(() => null)

    return NextResponse.json({ ok: true, backupCodes })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
