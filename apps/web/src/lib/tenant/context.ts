import { createHash, randomBytes } from "node:crypto"
import { prisma } from "@dream-invoice/database"
import type { SessionUser } from "@/lib/auth/service"

export const webhookEvents = ["invoice.created", "invoice.paid", "customer.created", "project.created", "payment.received"] as const
export const integrationProviders = ["Zapier", "Make", "n8n", "Microsoft Power Automate"] as const

export function apiKeyHash(value: string) {
  return createHash("sha256").update(value).digest("hex")
}
export function createPlainApiKey() {
  return "di_" + randomBytes(24).toString("base64url")
}
export function apiKeyPreview(value: string) {
  return value.slice(0, 8) + "..." + value.slice(-4)
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "firma"
}

export async function ensureDefaultTenantContext(user?: SessionUser | null) {
  await prisma.$executeRawUnsafe(`INSERT INTO "Tenant" ("slug", "name") VALUES ('default', 'DreamInvoice Mandant') ON CONFLICT ("slug") DO NOTHING`)
  const tenants = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`SELECT "id" FROM "Tenant" WHERE "slug" = 'default' LIMIT 1`)
  const tenantId = tenants[0]?.id
  let companies = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`SELECT "id" FROM "Company" WHERE "tenantId" = $1 ORDER BY "createdAt" LIMIT 1`, tenantId)
  if (!companies[0]) {
    companies = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`INSERT INTO "Company" ("tenantId", "name", "slug") VALUES ($1, 'Standard Firma', 'default-company') RETURNING "id"`, tenantId)
  }
  const companyId = companies[0].id
  if (user?.id) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "UserCompanyMembership" ("userId", "tenantId", "companyId", "role") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", "companyId") DO NOTHING`,
      user.id,
      tenantId,
      companyId,
      user.role === "admin" ? "super_admin" : "employee"
    )
  }
  return { tenantId, companyId }
}

export async function requireTenantAdmin(user: SessionUser) {
  const context = await ensureDefaultTenantContext(user)
  if (user.role === "admin") return context
  const memberships = await prisma.$queryRawUnsafe<Array<{ role: string }>>(
    `SELECT "role" FROM "UserCompanyMembership" WHERE "userId" = $1 AND "tenantId" = $2 AND "status" = 'active'`,
    user.id,
    context.tenantId
  )
  if (!memberships.some((item) => item.role === "super_admin" || item.role === "company_admin")) {
    throw new Error("Keine Berechtigung fuer Mandantenverwaltung.")
  }
  return context
}

export function normalizeCompanyInput(input: Record<string, unknown>) {
  const name = String(input.name ?? input.company ?? "").trim()
  if (!name) throw new Error("Firmenname ist erforderlich.")
  return {
    name,
    slug: slugify(String(input.slug ?? name)),
    logoUrl: String(input.logoUrl ?? "").trim() || null,
    street: String(input.street ?? "").trim() || null,
    zip: String(input.zip ?? "").trim() || null,
    city: String(input.city ?? "").trim() || null,
    country: String(input.country ?? "Deutschland").trim() || "Deutschland",
    taxNumber: String(input.taxNumber ?? "").trim() || null,
    vatId: String(input.vatId ?? "").trim() || null,
    iban: String(input.iban ?? "").trim() || null,
    bic: String(input.bic ?? "").trim() || null,
    email: String(input.email ?? "").trim() || null,
    phone: String(input.phone ?? "").trim() || null
  }
}
