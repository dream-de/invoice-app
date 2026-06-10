import { NextResponse } from "next/server"
import { prisma, prismaDbNull } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { verifyPassword } from "@/lib/auth/password"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { appendNotification } from "@/lib/notifications/store"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const current = await requireCurrentUser()
    const body = await request.json().catch(() => ({}))
    const password = String(body.password ?? "")
    if (isDemoMode()) {
      return NextResponse.json(demoModeResponse({ ok: true }))
    }

    const user = await prisma.user.findUnique({ where: { id: current.id } })

    if (!user || !await verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Das Passwort ist ungueltig." }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: current.id },
      data: {
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        twoFactorBackupCodes: prismaDbNull
      }
    })

    await writeAuditLog({
      action: "account.2fa_disable",
      entity: "user",
      entityId: current.id,
      data: { email: current.email }
    })
    await appendNotification({
      category: "security",
      tone: "warning",
      title: "2FA deaktiviert",
      message: current.email + " hat Zwei-Faktor-Authentifizierung deaktiviert.",
      href: "/account/security",
      source: "2fa-disable:" + current.id + ":" + Date.now()
    }).catch(() => null)

    return NextResponse.json({ ok: true })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
