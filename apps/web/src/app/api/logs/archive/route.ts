import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUser, requireCurrentUserRole } from "@/lib/auth/service"
import { archiveActiveLogs, exportLogsQuery, getArchiveStats, paramsFromSearchParams } from "@/lib/logs/auditLog.server"

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

export async function GET(request: Request) {
  try {
    await requireCurrentUser()
    const searchParams = new URL(request.url).searchParams
    if (searchParams.has("format") || searchParams.has("archived")) {
      const logs = await exportLogsQuery(paramsFromSearchParams(searchParams))

      return NextResponse.json({
        success: true,
        data: { logs, format: searchParams.get("format") ?? "json" },
        message: "OK",
        timestamp: new Date().toISOString()
      })
    }

    const archiveStatistics = await getArchiveStats()

    return NextResponse.json({ success: true, data: { archiveStatistics }, message: "OK", timestamp: new Date().toISOString() })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Archive statistics could not be loaded.", error)
    return NextResponse.json({ success: false, data: null, message: "Archivdaten konnten nicht geladen werden.", timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function POST() {
  try {
    await requireCurrentUserRole(["admin"])
    const archiveStatistics = await archiveActiveLogs()

    return NextResponse.json({ success: true, data: { archiveStatistics }, message: "OK", timestamp: new Date().toISOString() })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Logs could not be archived.", error)
    return NextResponse.json({ success: false, data: null, message: "Logs konnten nicht archiviert werden.", timestamp: new Date().toISOString() }, { status: 500 })
  }
}
