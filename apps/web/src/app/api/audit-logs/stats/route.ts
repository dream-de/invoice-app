import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { parseAuditLogFilters } from "@/lib/audit/audit.dto"
import { getAuditLogStats } from "@/lib/audit/audit.service"

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
    const stats = await getAuditLogStats(filters)

    return NextResponse.json({ ok: true, stats })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Audit log stats unavailable.", error)
    return NextResponse.json(
      { ok: false, error: "Audit Log Statistiken konnten nicht geladen werden." },
      { status: 500 }
    )
  }
}
