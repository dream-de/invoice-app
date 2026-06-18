import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { requireCurrentUser } from "@/lib/auth/service"
import { ensureDefaultTenantContext, requireTenantAdmin } from "@/lib/tenant/context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const user = await requireCurrentUser()
  const { tenantId } = await ensureDefaultTenantContext(user)
  const locations = await prisma.$queryRawUnsafe(`SELECT l.*, c."name" AS "companyName" FROM "CompanyLocation" l JOIN "Company" c ON c."id" = l."companyId" WHERE c."tenantId" = $1 ORDER BY l."createdAt" DESC`, tenantId)
  return NextResponse.json({ ok: true, locations })
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser()
    const { tenantId } = await requireTenantAdmin(user)
    const body = await request.json().catch(() => ({}))
    const rows = await prisma.$queryRawUnsafe(
      `INSERT INTO "CompanyLocation" ("companyId", "name", "street", "zip", "city", "country", "email", "phone") SELECT c."id", $1, $2, $3, $4, $5, $6, $7 FROM "Company" c WHERE c."id" = $8 AND c."tenantId" = $9 RETURNING *`,
      String(body.name ?? "").trim(), String(body.street ?? "").trim() || null, String(body.zip ?? "").trim() || null, String(body.city ?? "").trim() || null, String(body.country ?? "Deutschland").trim() || "Deutschland", String(body.email ?? "").trim() || null, String(body.phone ?? "").trim() || null, String(body.companyId ?? "").trim(), tenantId
    )
    return NextResponse.json({ ok: true, location: Array.isArray(rows) ? rows[0] : rows }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Standort konnte nicht gespeichert werden." }, { status: 400 })
  }
}
