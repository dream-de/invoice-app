import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { requireCurrentUser } from "@/lib/auth/service"
import { ensureDefaultTenantContext, requireTenantAdmin } from "@/lib/tenant/context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const user = await requireCurrentUser()
  const { tenantId } = await ensureDefaultTenantContext(user)
  const tenants = await prisma.$queryRawUnsafe(`SELECT t.*, COALESCE((SELECT COUNT(*)::int FROM "Company" WHERE "tenantId" = t."id"), 0) AS "companies", COALESCE((SELECT COUNT(*)::int FROM "UserCompanyMembership" WHERE "tenantId" = t."id"), 0) AS "memberships" FROM "Tenant" t WHERE t."id" = $1 ORDER BY t."createdAt" DESC`, tenantId)
  return NextResponse.json({ ok: true, tenants, roles: ["super_admin", "company_admin", "employee", "customer"] })
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser()
    await requireTenantAdmin(user)
    const body = await request.json().catch(() => ({}))
    const name = String(body.name ?? "").trim()
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48)
    const tenant = await prisma.$queryRawUnsafe(`INSERT INTO "Tenant" ("name", "slug") VALUES ($1, $2) ON CONFLICT ("slug") DO UPDATE SET "updatedAt" = CURRENT_TIMESTAMP RETURNING *`, name, slug)
    return NextResponse.json({ ok: true, tenant: Array.isArray(tenant) ? tenant[0] : tenant }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Mandant konnte nicht gespeichert werden." }, { status: 400 })
  }
}
