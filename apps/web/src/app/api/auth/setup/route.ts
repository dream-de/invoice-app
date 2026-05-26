import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { createInitialOwner, mapAuthError } from "@/lib/auth/service"
import { SESSION_COOKIE_NAME, assertSessionConfigured, createSessionToken, getSessionCookieOptions } from "@/lib/auth/session"

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
    assertSessionConfigured()
    const user = await createInitialOwner(await parseBody(request))
    const response = NextResponse.json({ ok: true, user }, { status: 201 })
    response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(user.id), getSessionCookieOptions())

    await writeAuditLog({
      action: "auth.setup",
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
