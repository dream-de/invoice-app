import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { requireCurrentUser } from "@/lib/auth/service"
import { ensureDefaultTenantContext, normalizeCompanyInput, requireTenantAdmin } from "@/lib/tenant/context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const user = await requireCurrentUser()
    const { tenantId } = await ensureDefaultTenantContext(user)
    const companies = await prisma.$queryRawUnsafe(
      `SELECT c.*, COALESCE((SELECT COUNT(*)::int FROM "Customer" WHERE "companyId" = c."id"), 0) AS "customers", COALESCE((SELECT COUNT(*)::int FROM "Project" WHERE "companyId" = c."id"), 0) AS "projects", COALESCE((SELECT COUNT(*)::int FROM "Invoice" WHERE "companyId" = c."id"), 0) AS "invoices", COALESCE((SELECT COUNT(*)::int FROM "BankAccount" WHERE "companyId" = c."id"), 0) AS "bankAccounts", COALESCE((SELECT COUNT(*)::int FROM "DocumentAsset" WHERE "companyId" = c."id"), 0) AS "documents" FROM "Company" c WHERE c."tenantId" = $1 ORDER BY c."createdAt" DESC`,
      tenantId
    )
    return NextResponse.json({ ok: true, companies })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Firmen konnten nicht geladen werden." }, { status: 400 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser()
    const { tenantId } = await requireTenantAdmin(user)
    const input = normalizeCompanyInput(await request.json().catch(() => ({})))
    const company = await prisma.$queryRawUnsafe(
      `INSERT INTO "Company" ("tenantId", "name", "slug", "logoUrl", "street", "zip", "city", "country", "taxNumber", "vatId", "iban", "bic", "email", "phone") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      tenantId, input.name, input.slug, input.logoUrl, input.street, input.zip, input.city, input.country, input.taxNumber, input.vatId, input.iban, input.bic, input.email, input.phone
    )
    return NextResponse.json({ ok: true, company: Array.isArray(company) ? company[0] : company }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Firma konnte nicht gespeichert werden." }, { status: 400 })
  }
}
