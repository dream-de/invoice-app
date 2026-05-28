import { NextResponse } from "next/server"
import { Prisma, prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { verifyPassword } from "@/lib/auth/password"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const current = await requireCurrentUser()
    const body = await request.json().catch(() => ({}))
    const password = String(body.password ?? "")
    const user = await prisma.user.findUnique({ where: { id: current.id } })

    if (!user || !await verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Das Passwort ist ungueltig." }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: current.id },
      data: {
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
        twoFactorBackupCodes: Prisma.JsonNull
      }
    })

    await writeAuditLog({
      action: "account.2fa_disable",
      entity: "user",
      entityId: current.id,
      data: { email: current.email }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
