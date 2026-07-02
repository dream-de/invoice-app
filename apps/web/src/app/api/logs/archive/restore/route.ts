import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { restoreArchivedLogs } from "@/lib/logs/auditLog.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    return NextResponse.json({ success: false, data: null, message: error.message, timestamp: new Date().toISOString() }, { status: error.status })
  }

  const mapped = mapAuthError(error)
  if (mapped.status !== 500) {
    return NextResponse.json({ success: false, data: null, message: mapped.error, timestamp: new Date().toISOString() }, { status: mapped.status })
  }

  return null
}

export async function POST(request: Request) {
  try {
    await requireCurrentUserRole(["admin"])
    const body = await request.json().catch(() => ({}))
    const filters = typeof body.filters === "object" && body.filters !== null ? body.filters : body
    const archiveStatistics = await restoreArchivedLogs({
      dateFrom: typeof filters.dateFrom === "string" ? filters.dateFrom : null,
      dateTo: typeof filters.dateTo === "string" ? filters.dateTo : null,
      module: typeof filters.module === "string" ? filters.module : null,
      level: typeof filters.level === "string" ? filters.level : null,
      actorId: typeof filters.actorId === "string" ? filters.actorId : null,
      search: typeof filters.search === "string" ? filters.search : null
    })

    return NextResponse.json({ success: true, data: { archiveStatistics }, message: "OK", timestamp: new Date().toISOString() })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Archived logs could not be restored.", error)
    return NextResponse.json({ success: false, data: null, message: "Archivierte Logs konnten nicht wiederhergestellt werden.", timestamp: new Date().toISOString() }, { status: 500 })
  }
}
