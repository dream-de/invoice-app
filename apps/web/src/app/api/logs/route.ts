import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUser, requireCurrentUserRole } from "@/lib/auth/service"
import { createAuditLog, getAuditLogs, paramsFromSearchParams } from "@/lib/logs/auditLog.server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function apiResponse(data: unknown, status = 200) {
  return NextResponse.json(
    { success: true, data, message: "OK", timestamp: new Date().toISOString() },
    { status }
  )
}

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    return NextResponse.json(
      { success: false, data: null, message: error.message, timestamp: new Date().toISOString() },
      { status: error.status }
    )
  }

  const mapped = mapAuthError(error)
  if (mapped.status !== 500) {
    return NextResponse.json(
      { success: false, data: null, message: mapped.error, timestamp: new Date().toISOString() },
      { status: mapped.status }
    )
  }

  return null
}

function apiError(message: string, status = 500) {
  return NextResponse.json(
    { success: false, data: null, message, timestamp: new Date().toISOString() },
    { status }
  )
}

export async function GET(request: Request) {
  try {
    await requireCurrentUser()
    const result = await getAuditLogs(paramsFromSearchParams(new URL(request.url).searchParams))

    return apiResponse(result)
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Logs could not be loaded.", error)
    return apiError("Logs konnten nicht geladen werden.")
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCurrentUserRole(["admin"])
    const body = await request.json().catch(() => ({}))
    const log = await createAuditLog({
      title: typeof body.title === "string" ? body.title : "Log-Ereignis",
      description: typeof body.description === "string" ? body.description : null,
      module: typeof body.module === "string" ? body.module : "system",
      level: typeof body.level === "string" ? body.level : "info",
      status: typeof body.status === "string" ? body.status : "active",
      actorId: typeof body.actorId === "string" ? body.actorId : actor.id,
      actorName: typeof body.actorName === "string" ? body.actorName : actor.name,
      actorEmail: typeof body.actorEmail === "string" ? body.actorEmail : actor.email,
      actorRole: typeof body.actorRole === "string" ? body.actorRole : actor.role,
      ipAddress: typeof body.ipAddress === "string" ? body.ipAddress : null,
      browserName: typeof body.browserName === "string" ? body.browserName : null,
      browserVersion: typeof body.browserVersion === "string" ? body.browserVersion : null,
      osName: typeof body.osName === "string" ? body.osName : null,
      osVersion: typeof body.osVersion === "string" ? body.osVersion : null,
      country: typeof body.country === "string" ? body.country : null,
      city: typeof body.city === "string" ? body.city : null,
      timezone: typeof body.timezone === "string" ? body.timezone : null,
      requestId: typeof body.requestId === "string" ? body.requestId : null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
      traceId: typeof body.traceId === "string" ? body.traceId : null,
      userAgent: typeof body.userAgent === "string" ? body.userAgent : null,
      referer: typeof body.referer === "string" ? body.referer : null,
      method: typeof body.method === "string" ? body.method : null,
      endpoint: typeof body.endpoint === "string" ? body.endpoint : null,
      duration: typeof body.duration === "number" ? body.duration : null,
      tags: Array.isArray(body.tags) ? body.tags.filter((tag: unknown) => typeof tag === "string") : [],
      metadata: body.metadata
    })

    return apiResponse({ log }, 201)
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Log could not be created.", error)
    return apiError("Log konnte nicht erstellt werden.")
  }
}
