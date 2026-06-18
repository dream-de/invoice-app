import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, requireCurrentUserRole } from "@/lib/auth/service"
import { isDemoMode } from "@/lib/demo-mode"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AuditLogRow = {
  id: string
  action: string
  entity: string
  entityId: string | null
  reason: string | null
  ipAddress?: string | null
  publicIp?: string | null
  privateIp?: string | null
  accessHost?: string | null
  accessProtocol?: string | null
  accessOrigin?: string | null
  userAgent?: string | null
  browser?: string | null
  operatingSystem?: string | null
  deviceType?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  timezone?: string | null
  geoProvider?: string | null
  createdAt: string
}

const fallbackAuditLogs: AuditLogRow[] = [
  {
    id: "audit-demo-1",
    action: "premium.action",
    entity: "premium_audit",
    entityId: "premium-action-demo",
    reason: "audit.filter",
    ipAddress: null,
    publicIp: null,
    privateIp: null,
    accessHost: null,
    accessProtocol: null,
    accessOrigin: null,
    userAgent: null,
    browser: null,
    operatingSystem: null,
    deviceType: null,
    country: null,
    region: null,
    city: null,
    timezone: null,
    geoProvider: null,
    createdAt: "2026-06-13T00:00:00.000Z"
  },
  {
    id: "audit-demo-2",
    action: "invoice.finalize",
    entity: "invoice",
    entityId: "RE-2026-0104",
    reason: "Phase-4-P1 demo fallback",
    ipAddress: null,
    publicIp: null,
    privateIp: null,
    accessHost: null,
    accessProtocol: null,
    accessOrigin: null,
    userAgent: null,
    browser: null,
    operatingSystem: null,
    deviceType: null,
    country: null,
    region: null,
    city: null,
    timezone: null,
    geoProvider: null,
    createdAt: "2026-06-12T10:00:00.000Z"
  }
]

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? "", 10)
  if (!Number.isFinite(parsed)) return 50
  return Math.min(Math.max(parsed, 1), 200)
}

function matchesQuery(row: AuditLogRow, query: string) {
  if (!query) return true
  const needle = query.toLowerCase()
  return [row.action, row.entity, row.entityId, row.reason].some((value) => String(value ?? "").toLowerCase().includes(needle))
}

function serializeCsvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`
}

function auditRowsToCsv(rows: AuditLogRow[]) {
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

function respond(rows: AuditLogRow[], format: string | null) {
  if (format === "csv") {
    return new NextResponse(auditRowsToCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"audit-export.csv\""
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

  if (isDemoMode() || !process.env.DATABASE_URL) {
    return respond(fallbackAuditLogs.filter((row) => matchesQuery(row, query)).slice(0, limit), format)
  }

  try {
    await requireCurrentUserRole(["admin"])

    const where = query
      ? {
          OR: [
            { action: { contains: query, mode: "insensitive" as const } },
            { entity: { contains: query, mode: "insensitive" as const } },
            { entityId: { contains: query, mode: "insensitive" as const } },
            { reason: { contains: query, mode: "insensitive" as const } }
          ]
        }
      : undefined

    const rows = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit
    })

    return respond(rows.map((row) => ({
      id: row.id,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      reason: row.reason,
      ipAddress: row.ipAddress,
      publicIp: row.publicIp,
      privateIp: row.privateIp,
      accessHost: row.accessHost,
      accessProtocol: row.accessProtocol,
      accessOrigin: row.accessOrigin,
      userAgent: row.userAgent,
      browser: row.browser,
      operatingSystem: row.operatingSystem,
      deviceType: row.deviceType,
      country: row.country,
      region: row.region,
      city: row.city,
      timezone: row.timezone,
      geoProvider: row.geoProvider,
      createdAt: row.createdAt.toISOString()
    })), format)
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
