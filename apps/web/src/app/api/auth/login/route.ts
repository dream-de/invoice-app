import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { authenticateAppUser, mapAuthError } from "@/lib/auth/service"
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function parseBody(request: Request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  try {
    const { user, token } = await authenticateAppUser(await parseBody(request))
    const response = NextResponse.json({ ok: true, user })
    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions())

    await writeAuditLog({
      action: "auth.login",
      entity: "user",
      entityId: user.id,
      data: { email: user.email, role: user.role }
    })

    return response
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }
}
