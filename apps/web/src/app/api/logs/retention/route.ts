import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUser, requireCurrentUserRole } from "@/lib/auth/service"
import { getRetentionPolicy, updateRetentionPolicy } from "@/lib/logs/auditLog.server"
import type { LogRetention } from "@/lib/logs/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function parseRetention(value: unknown): LogRetention {
  if (value === "unlimited") return "unlimited"
  const parsed = Number.parseInt(String(value ?? ""), 10)
  if (parsed === 30 || parsed === 90 || parsed === 180 || parsed === 365) return parsed
  return 365
}

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

export async function GET() {
  try {
    await requireCurrentUser()
    const retention = await getRetentionPolicy()

    return NextResponse.json({ success: true, data: { retention }, message: "OK", timestamp: new Date().toISOString() })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Retention policy could not be loaded.", error)
    return NextResponse.json({ success: false, data: null, message: "Retention konnte nicht geladen werden.", timestamp: new Date().toISOString() }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await requireCurrentUserRole(["admin"])
    const body = await request.json().catch(() => ({}))
    const archiveStatistics = await updateRetentionPolicy(parseRetention(body.retention))

    return NextResponse.json({ success: true, data: { archiveStatistics }, message: "OK", timestamp: new Date().toISOString() })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Retention policy could not be updated.", error)
    return NextResponse.json({ success: false, data: null, message: "Retention konnte nicht gespeichert werden.", timestamp: new Date().toISOString() }, { status: 500 })
  }
}
