import { NextResponse } from "next/server"
import { AuthServiceError, requireCurrentUserRole } from "@/lib/auth/service"
import { getAuditLogs } from "@/lib/logs/auditLog.server"
import type { LogEntry } from "@/lib/logs/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LogEventRow = {
  id: string
  action: string
  entity: string
  entityId: string | null
  reason: string | null
  ipAddress: string | null
  publicIp: string | null
  privateIp: string | null
  accessHost: string | null
  accessProtocol: string | null
  accessOrigin: string | null
  userAgent: string | null
  browser: string | null
  operatingSystem: string | null
  deviceType: string | null
  country: string | null
  region: string | null
  city: string | null
  timezone: string | null
  geoProvider: string | null
  createdAt: string
}

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10)
  if (!Number.isFinite(parsed)) return 50
  return Math.min(Math.max(parsed, 1), 100)
}

function serializeCsvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

function logRowsToCsv(rows: LogEventRow[]) {
  const header = ["createdAt", "action", "entity", "entityId", "reason", "ipAddress", "publicIp", "privateIp", "accessHost", "accessProtocol", "accessOrigin", "browser", "operatingSystem", "deviceType", "country", "region", "city", "timezone", "geoProvider"]
  const lines = rows.map((row) => [
    row.createdAt,
    row.action,
    row.entity,
    row.entityId ?? "",
    row.reason ?? "",
    row.ipAddress ?? "",
    row.publicIp ?? "",
    row.privateIp ?? "",
    row.accessHost ?? "",
    row.accessProtocol ?? "",
    row.accessOrigin ?? "",
    row.browser ?? "",
    row.operatingSystem ?? "",
    row.deviceType ?? "",
    row.country ?? "",
    row.region ?? "",
    row.city ?? "",
    row.timezone ?? "",
    row.geoProvider ?? ""
  ].map(serializeCsvValue).join(";"))
  return [header.join(";"), ...lines].join("\n")
}

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code },
      { status: error.status }
    )
  }

  return null
}

function eventFromLog(log: LogEntry): LogEventRow {
  return {
    id: log.id,
    action: log.title,
    entity: log.module,
    entityId: log.metadata.requestId || null,
    reason: log.description || null,
    ipAddress: log.ipAddress || null,
    publicIp: null,
    privateIp: null,
    accessHost: null,
    accessProtocol: null,
    accessOrigin: null,
    userAgent: log.metadata.userAgent || null,
    browser: [log.browser.name, log.browser.version].filter(Boolean).join(" ") || null,
    operatingSystem: [log.operatingSystem.name, log.operatingSystem.version].filter(Boolean).join(" ") || null,
    deviceType: null,
    country: log.location.country || null,
    region: null,
    city: log.location.city || null,
    timezone: log.location.timezone || null,
    geoProvider: null,
    createdAt: log.createdAt
  }
}

function respond(rows: LogEventRow[], format: string | null) {
  if (format === "csv") {
    return new NextResponse(logRowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"logs-export.csv\""
      }
    })
  }

  return NextResponse.json({ ok: true, logs: rows, count: rows.length })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = parseLimit(url.searchParams.get("limit"))
  const query = (url.searchParams.get("query") ?? "").trim()
  const format = url.searchParams.get("format")

  try {
    await requireCurrentUserRole(["admin"])
    const result = await getAuditLogs({
      page: 1,
      pageSize: limit,
      search: query || null,
      sort: "newest"
    })

    return respond(result.logs.map(eventFromLog), format)
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error("Logs unavailable.", error)
    return NextResponse.json(
      { ok: false, error: "Logs konnten nicht geladen werden." },
      { status: 500 }
    )
  }
}
