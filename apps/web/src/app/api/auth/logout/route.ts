import { NextResponse } from "next/server"
import { writeAuditLog } from "@/lib/audit/log"
import { auditActor, requestContext, safeJson } from "@/lib/audit/audit-event-helpers"
import { logBackendAuditEvent } from "@/lib/audit/backendAuditEventWriter"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { getCurrentUser } from "@/lib/auth/service"
import { SESSION_COOKIE_NAME, getSessionCookieOptions } from "@/lib/auth/session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const current = await getCurrentUser().catch(() => null)
  if (current) {
    await writeAuditLog({
      action: "auth.logout",
      entity: "user",
      entityId: current.id,
      data: { email: current.email },
      requestMetadata: getAuditRequestMetadata(request)
    })
    await logBackendAuditEvent({
      type: "logout",
      source: "auth",
      severity: "info",
      title: "Logout",
      description: "Benutzer wurde abgemeldet.",
      actor: auditActor(current),
      requestContext: requestContext(request, current),
      entityType: "user",
      entityId: current.id,
      metadata: safeJson({ email: current.email })
    })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0
  })

  return response
}
