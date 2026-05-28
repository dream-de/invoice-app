import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { assertStrongPassword, hashPassword, PasswordError, verifyPassword } from "@/lib/auth/password"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function PATCH(request: Request) {
  try {
    const current = await requireCurrentUser()
    const body = await request.json().catch(() => ({}))
    const currentPassword = String(body.currentPassword ?? "")
    const nextPassword = String(body.nextPassword ?? "")
    const confirmPassword = String(body.confirmPassword ?? "")

    if (nextPassword !== confirmPassword) {
      return NextResponse.json({ ok: false, error: "Die neuen Passwoerter stimmen nicht ueberein." }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: current.id } })
    if (!user || !await verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ ok: false, error: "Das aktuelle Passwort ist ungueltig." }, { status: 401 })
    }

    let strongPassword: string
    try {
      strongPassword = assertStrongPassword(nextPassword)
    } catch (error) {
      if (error instanceof PasswordError) {
        return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: 400 })
      }
      throw error
    }

    await prisma.user.update({
      where: { id: current.id },
      data: { passwordHash: await hashPassword(strongPassword) }
    })

    await writeAuditLog({
      action: "account.password_update",
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
