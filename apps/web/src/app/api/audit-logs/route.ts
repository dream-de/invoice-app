import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { createAuditRequestContext } from "@/lib/audit/audit-request-context"
import { parseAuditLogFilters, parseAuditLogInput } from "@/lib/audit/audit.dto"
import { createAuditLog, listAuditLogs } from "@/lib/audit/audit.service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code },
      { status: error.status }
    )
  }

  const mapped = mapAuthError(error)
  if (mapped.status !== 500) {
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

export async function GET(request: Request) {
  try {
    // TODO: Admin-Berechtigung fuer Audit-Log-Zugriff granular pruefen.
    await requireCurrentUserRole(["admin"])
    const filters = parseAuditLogFilters(new URL(request.url).searchParams)
    const result = await listAuditLogs(filters)

    return NextResponse.json(result)
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Audit logs unavailable.", error)
    return NextResponse.json(
      { ok: false, error: "Audit Logs konnten nicht geladen werden." },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // TODO: Schreibzugriff spaeter nur fuer serverseitige/interne Services erlauben.
    const actor = await requireCurrentUserRole(["admin"])
    const requestContext = createAuditRequestContext(request, actor)
    const parsed = parseAuditLogInput(await request.json().catch(() => ({})))
    const row = await createAuditLog({
      tenantId: parsed.tenantId ?? requestContext.tenantId ?? null,
      workspaceId: parsed.workspaceId ?? requestContext.workspaceId ?? null,
      actorId: parsed.actorId ?? requestContext.actorId ?? null,
      actorName: parsed.actorName ?? requestContext.actorName ?? "System",
      actorRole: parsed.actorRole ?? requestContext.actorRole ?? null,
      actorEmail: parsed.actorEmail ?? requestContext.actorEmail ?? null,
      type: parsed.type ?? "system_event",
      source: parsed.source ?? "system",
      severity: parsed.severity ?? "info",
      title: parsed.title ?? "Audit Event",
      description: parsed.description ?? null,
      moduleKey: parsed.moduleKey ?? null,
      integrationKey: parsed.integrationKey ?? null,
      marketplaceModuleKey: parsed.marketplaceModuleKey ?? null,
      entityType: parsed.entityType ?? null,
      entityId: parsed.entityId ?? null,
      ipAddress: parsed.ipAddress ?? requestContext.ipAddress ?? null,
      userAgent: parsed.userAgent ?? requestContext.userAgent ?? null,
      browser: parsed.browser ?? requestContext.browser ?? null,
      device: parsed.device ?? requestContext.device ?? null,
      location: parsed.location ?? requestContext.location ?? null,
      requestId: parsed.requestId ?? requestContext.requestId ?? null,
      metadata: parsed.metadata,
      before: parsed.before,
      after: parsed.after
    })

    return NextResponse.json({ ok: true, id: row.id }, { status: 201 })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Audit log write unavailable.", error)
    return NextResponse.json(
      { ok: false, error: "Audit Log konnte nicht geschrieben werden." },
      { status: 500 }
    )
  }
}
