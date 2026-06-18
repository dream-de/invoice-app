import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { apiKeyHash } from "@/lib/tenant/context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function bearer(request: Request) {
  const header = request.headers.get("authorization") || ""
  return header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
}

export async function GET(request: Request) {
  const token = bearer(request)
  if (!token) return NextResponse.json({ ok: false, error: "API Key erforderlich." }, { status: 401 })
  const hash = apiKeyHash(token)
  const keys = await prisma.$queryRawUnsafe<Array<{ tenantId: string; companyId: string | null }>>('SELECT "tenantId", "companyId" FROM "ApiKey" WHERE "keyHash" = $1 AND "status" = \'active\' LIMIT 1', hash)
  const key = keys[0]
  if (!key) return NextResponse.json({ ok: false, error: "API Key ungueltig oder deaktiviert." }, { status: 401 })
  const rows = await prisma.$queryRawUnsafe('SELECT "id", "number", "type", "status", "customerId", "projectId", "grossTotal", "createdAt" FROM "Invoice" WHERE ("companyId" = $2 OR $2 IS NULL) AND "type" = $3 ORDER BY "createdAt" DESC LIMIT 100', key.tenantId, key.companyId, 'offer')
  await prisma.$executeRawUnsafe('UPDATE "ApiKey" SET "lastUsedAt" = CURRENT_TIMESTAMP WHERE "keyHash" = $1', hash)
  return NextResponse.json({ ok: true, entity: "offers", data: rows })
}
