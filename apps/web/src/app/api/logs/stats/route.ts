import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { getAuditLogStats, paramsFromSearchParams } from "@/lib/logs/auditLog.server"

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
    const statistics = await getAuditLogStats(paramsFromSearchParams(new URL(request.url).searchParams))

    return NextResponse.json({ success: true, data: { statistics }, message: "OK", timestamp: new Date().toISOString() })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Log statistics could not be loaded.", error)
    return NextResponse.json({ success: false, data: null, message: "Log-Statistiken konnten nicht geladen werden.", timestamp: new Date().toISOString() }, { status: 500 })
  }
}
