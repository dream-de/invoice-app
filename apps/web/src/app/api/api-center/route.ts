import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { requireCurrentUser } from "@/lib/auth/service"
import { apiKeyHash, apiKeyPreview, createPlainApiKey, ensureDefaultTenantContext, integrationProviders, requireTenantAdmin, webhookEvents } from "@/lib/tenant/context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const restEndpoints = [
  { method: "GET", path: "/api/v1/customers", status: "prepared" },
  { method: "GET", path: "/api/v1/invoices", status: "prepared" },
  { method: "GET", path: "/api/v1/offers", status: "prepared" },
  { method: "GET", path: "/api/v1/projects", status: "prepared" },
  { method: "GET", path: "/api/v1/time-entries", status: "prepared" }
]

export async function GET() {
  const user = await requireCurrentUser()
  const { tenantId } = await ensureDefaultTenantContext(user)
  const [apiKeys, webhooks, integrations] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT "id", "companyId", "label", "keyPreview", "status", "scopes", "lastUsedAt", "createdAt" FROM "ApiKey" WHERE "tenantId" = $1 ORDER BY "createdAt" DESC`, tenantId),
    prisma.$queryRawUnsafe(`SELECT "id", "companyId", "event", "url", "status", "secretPreview", "lastDeliveryAt", "createdAt" FROM "WebhookEndpoint" WHERE "tenantId" = $1 ORDER BY "createdAt" DESC`, tenantId),
    prisma.$queryRawUnsafe(`SELECT "id", "companyId", "provider", "category", "status", "config", "createdAt" FROM "IntegrationConnection" WHERE "tenantId" = $1 ORDER BY "provider" ASC`, tenantId)
  ])
  return NextResponse.json({ ok: true, apiKeys, webhooks, integrations, events: webhookEvents, providers: integrationProviders, restEndpoints, docs: { overview: "REST API fuer Kunden, Rechnungen, Angebote, Projekte und Zeiterfassung vorbereitet.", authentication: "Authorization: Bearer <API_KEY>", basePath: "/api/v1" } })
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser()
    const { tenantId, companyId } = await requireTenantAdmin(user)
    const body = await request.json().catch(() => ({}))
    const action = String(body.action ?? "")
    if (action === "apiKey.create") {
      const plainKey = createPlainApiKey()
      const rows = await prisma.$queryRawUnsafe(`INSERT INTO "ApiKey" ("tenantId", "companyId", "label", "keyHash", "keyPreview", "scopes", "createdByUserId") VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7) RETURNING "id", "companyId", "label", "keyPreview", "status", "scopes", "createdAt"`, tenantId, String(body.companyId ?? companyId) || companyId, String(body.label ?? "Production API Key").trim(), apiKeyHash(plainKey), apiKeyPreview(plainKey), JSON.stringify(body.scopes ?? ["customers:read", "invoices:read", "projects:read"]), user.id)
      return NextResponse.json({ ok: true, apiKey: Array.isArray(rows) ? rows[0] : rows, plainKey }, { status: 201 })
    }
    if (action === "apiKey.disable" || action === "apiKey.delete") {
      const id = String(body.id ?? "")
      if (action === "apiKey.delete") await prisma.$executeRawUnsafe(`DELETE FROM "ApiKey" WHERE "tenantId" = $1 AND "id" = $2`, tenantId, id)
      else await prisma.$executeRawUnsafe(`UPDATE "ApiKey" SET "status" = 'inactive', "updatedAt" = CURRENT_TIMESTAMP WHERE "tenantId" = $1 AND "id" = $2`, tenantId, id)
      return NextResponse.json({ ok: true })
    }
    if (action === "webhook.create") {
      const event = String(body.event ?? "")
      if (!webhookEvents.includes(event as typeof webhookEvents[number])) throw new Error("Webhook Event ist nicht erlaubt.")
      const secret = "whsec_" + createPlainApiKey().slice(3)
      const rows = await prisma.$queryRawUnsafe(`INSERT INTO "WebhookEndpoint" ("tenantId", "companyId", "event", "url", "secretPreview") VALUES ($1,$2,$3,$4,$5) RETURNING *`, tenantId, String(body.companyId ?? companyId) || companyId, event, String(body.url ?? body.endpoint ?? "").trim(), apiKeyPreview(secret))
      return NextResponse.json({ ok: true, webhook: Array.isArray(rows) ? rows[0] : rows, secret }, { status: 201 })
    }
    if (action === "integration.prepare") {
      const provider = String(body.provider ?? "").trim()
      if (!integrationProviders.includes(provider as typeof integrationProviders[number])) throw new Error("Integration ist nicht vorgesehen.")
      const rows = await prisma.$queryRawUnsafe(`INSERT INTO "IntegrationConnection" ("tenantId", "companyId", "provider", "category", "status", "config") VALUES ($1,$2,$3,'automation','prepared',$4::jsonb) ON CONFLICT ("tenantId", "provider", "companyId") DO UPDATE SET "status" = 'prepared', "updatedAt" = CURRENT_TIMESTAMP RETURNING *`, tenantId, String(body.companyId ?? companyId) || companyId, provider, JSON.stringify({ mode: "prepared" }))
      return NextResponse.json({ ok: true, integration: Array.isArray(rows) ? rows[0] : rows }, { status: 201 })
    }
    throw new Error("Unbekannte API-Center Aktion.")
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "API-Center Aktion fehlgeschlagen." }, { status: 400 })
  }
}
