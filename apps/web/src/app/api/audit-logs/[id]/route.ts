import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { getAuditLogById } from "@/lib/audit/audit.service"

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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // TODO: Admin-Berechtigung fuer Audit-Log-Zugriff granular pruefen.
    await requireCurrentUserRole(["admin"])
    const { id } = await context.params
    const log = await getAuditLogById(id)

    if (!log) {
      return NextResponse.json(
        { ok: false, error: "Audit Log wurde nicht gefunden." },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, log })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Audit log detail unavailable.", error)
    return NextResponse.json(
      { ok: false, error: "Audit Log konnte nicht geladen werden." },
      { status: 500 }
    )
  }
}
