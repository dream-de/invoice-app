import { NextResponse } from "next/server"
import { prisma, type Prisma } from "@dream-invoice/database"
import { marketplaceModules } from "@dream-invoice/premium/license-billing"
import { AuthServiceError, requireCurrentUserRole } from "@/lib/auth/service"
import { licensePlans as licensePlanCatalog } from "@/lib/license/plans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type MarketplaceModuleRecord = {
  key: string
  name: string
  category: string
  description: string
  provider: string
  priceCents: number | null
  currency: string
  billingCycle: string
  installed: boolean
  active: boolean
  licenseRequired: boolean
  licenseStatus: string
  available: boolean
}

function jsonObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function marketplaceModulesFromFeatures(features: Prisma.JsonValue | null | undefined): MarketplaceModuleRecord[] {
  const source = jsonObject(features)
  const modules = source.marketplaceModules ?? source.marketplace ?? source.extensions
  if (!Array.isArray(modules)) return []

  return modules
    .filter((module): module is Record<string, unknown> => Boolean(module) && typeof module === "object" && !Array.isArray(module))
    .map((module) => {
      const key = String(module.key ?? module.id ?? "").trim()
      if (!key) return null
      return {
        key,
        name: String(module.name ?? key),
        category: String(module.category ?? "Weitere"),
        description: String(module.description ?? ""),
        provider: String(module.provider ?? ""),
        priceCents: typeof module.priceCents === "number" ? module.priceCents : null,
        currency: String(module.currency ?? "EUR"),
        billingCycle: String(module.billingCycle ?? ""),
        installed: module.installed === true,
        active: module.active === true,
        licenseRequired: module.licenseRequired !== false,
        licenseStatus: String(module.licenseStatus ?? (module.active === true ? "active" : "inactive")),
        available: module.available !== false
      }
    })
    .filter((module): module is MarketplaceModuleRecord => module !== null)
}

function replaceMarketplaceModules(features: Prisma.JsonValue | null | undefined, modules: MarketplaceModuleRecord[]) {
  return {
    ...jsonObject(features),
    marketplaceModules: modules
  } satisfies Prisma.InputJsonObject
}

function normalizePlan(value: unknown) {
  const plan = String(value ?? "").trim().toLowerCase()
  if (!plan || plan.length > 40) return null
  return plan
}

function normalizeBillingCycle(value: unknown) {
  const billingCycle = String(value ?? "").trim().toLowerCase()
  if (!["free", "monthly", "yearly", "custom"].includes(billingCycle)) return null
  return billingCycle
}

function normalizeMaxUsers(value: unknown) {
  const maxUsers = Number(value)
  if (!Number.isInteger(maxUsers) || maxUsers < 1 || maxUsers > 100000) return null
  return maxUsers
}

function billingCycleForPlan(plan: string) {
  if (plan === "free") return "free"
  if (plan === "enterprise") return "custom"
  return "monthly"
}

function planDisplayFor(plan: string) {
  if (plan === "enterprise") {
    return {
      subtitle: "Für große Unternehmen",
      priceLabel: "99 €",
      priceSuffix: "/Monat",
      fallbackMaxUsers: 100,
      features: [
        "Alle Pro Funktionen",
        "Alle Marketplace-Module inklusive",
        "Unbegrenzte Benutzer",
        "Unbegrenzter Speicher",
        "Prioritäts-Support",
        "Früher Zugriff auf neue Funktionen",
        "Alle zukünftigen Module inklusive"
      ]
    }
  }
  if (plan === "pro" || plan === "business") {
    return {
      subtitle: "Für wachsende Unternehmen",
      priceLabel: "29 €",
      priceSuffix: "/Monat",
      fallbackMaxUsers: 25,
      features: [
        "Alle Free Funktionen",
        "API & Webhooks",
        "Banking",
        "25 Benutzer",
        "100 GB Speicher",
        "Marketplace Module einzeln buchbar",
        "Standard-Support"
      ]
    }
  }
  return {
    subtitle: "Für den Einstieg",
    priceLabel: "0 €",
    priceSuffix: "/Monat",
    fallbackMaxUsers: 5,
    features: [
      "Rechnungen, Angebote, Kunden",
      "Projekte & Zeiterfassung",
      "Dokumente",
      "5 Benutzer",
      "2 GB Speicher"
    ]
  }
}

function planOptionsFromCatalog(existingPlans: Array<{ plan: string; billingCycle: string; maxUsers: number; status: string; validUntil: Date | null }>) {
  const existingByPlan = new Map(existingPlans.map((plan) => [plan.plan, plan]))
  return licensePlanCatalog
    .filter((plan) => plan.key === "free" || plan.key === "pro" || plan.key === "enterprise")
    .map((plan) => {
      const existing = existingByPlan.get(plan.key)
      const display = planDisplayFor(plan.key)
      return {
        plan: plan.key,
        name: plan.name,
        billingCycle: existing?.billingCycle ?? billingCycleForPlan(plan.key),
        billingLabel: plan.billing,
        note: plan.note,
        subtitle: display.subtitle,
        priceLabel: display.priceLabel,
        priceSuffix: display.priceSuffix,
        features: display.features,
        maxUsers: existing?.maxUsers ?? display.fallbackMaxUsers ?? plan.maxUsers ?? 1_000_000,
        status: existing?.status ?? "available",
        validUntil: existing?.validUntil?.toISOString() ?? null
      }
    })
}

function marketplaceCatalogFromLicense(features: Prisma.JsonValue | null | undefined, plan: string): MarketplaceModuleRecord[] {
  const storedModules = marketplaceModulesFromFeatures(features)
  const storedByKey = new Map(storedModules.map((module) => [module.key, module]))
  const catalogByKey = new Map<string, (typeof marketplaceModules)[number]>(marketplaceModules.map((module) => [module.key, module]))
  const enterpriseIncludesAll = plan === "enterprise" || plan === "unlimited"

  const resolveModule = (key: string) => {
    const module = catalogByKey.get(key)
    const stored = storedByKey.get(key)
    if (!module && !stored) return null
    const installed = stored?.installed ?? enterpriseIncludesAll
    const active = stored?.active ?? enterpriseIncludesAll
    return {
      key,
      name: stored?.name ?? module?.name ?? key,
      category: stored?.category ?? module?.category ?? "Weitere",
      description: stored?.description ?? module?.description ?? "",
      provider: stored?.provider ?? "DreamInvoice",
      priceCents: stored?.priceCents ?? null,
      currency: stored?.currency ?? "EUR",
      billingCycle: stored?.billingCycle ?? "Monat",
      installed,
      active,
      licenseRequired: stored?.licenseRequired ?? module?.recommendedPlan !== "free",
      licenseStatus: active ? "active" : installed ? "installed" : "available",
      available: stored?.available ?? module?.status === "Verfuegbar"
    }
  }

  const moduleKeys = storedModules.length
    ? storedModules.map((module) => module.key)
    : marketplaceModules.map((module) => module.key)
  return moduleKeys
    .map(resolveModule)
    .filter((module): module is MarketplaceModuleRecord => module !== null)
}

async function loadLicenseBillingPayload() {
  const now = new Date()
  const [activeUsers, license, licenseRows, licenseIssues, invoices, paymentMethods, paymentHistory] = await Promise.all([
    prisma.user.count({ where: { status: "active" } }),
    prisma.license.findFirst({
      where: {
        status: "active",
        OR: [{ validUntil: null }, { validUntil: { gte: now } }]
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.license.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { plan: true, billingCycle: true, maxUsers: true, status: true, validUntil: true }
    }),
    prisma.licenseIssue.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { plan: true, billingCycle: true, maxUsers: true, status: true, validUntil: true }
    }),
    prisma.invoice.findMany({
      where: { type: "invoice" },
      orderBy: { issueDate: "desc" },
      take: 20,
      select: { id: true, number: true, status: true, grossTotal: true, issueDate: true, dueDate: true, paidAt: true }
    }),
    prisma.paymentMethodConfig.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: { id: true, key: true, label: true, enabled: true, prepared: true }
    }),
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        provider: true,
        status: true,
        paidAt: true,
        invoice: { select: { number: true } }
      }
    })
  ])

  const planMap = new Map<string, { plan: string; billingCycle: string; maxUsers: number; status: string; validUntil: Date | null }>()
  for (const item of [...licenseRows, ...licenseIssues]) {
    const key = `${item.plan}:${item.billingCycle}:${item.maxUsers}`
    if (!planMap.has(key)) {
      planMap.set(key, {
        plan: item.plan,
        billingCycle: item.billingCycle,
        maxUsers: item.maxUsers,
        status: item.status,
        validUntil: item.validUntil
      })
    }
  }
  const planOptions = planOptionsFromCatalog(Array.from(planMap.values()))
  const currentPlanOption = planOptions.find((plan) => plan.plan === (license?.plan ?? "free")) ?? planOptions[0]

  const nextPayment = license?.validUntil?.toISOString() ?? invoices.find((invoice) => invoice.status !== "paid" && invoice.dueDate)?.dueDate?.toISOString() ?? null

  return {
    ok: true,
    license: {
      id: license?.id ?? null,
      plan: license?.plan ?? currentPlanOption.plan,
      billingCycle: license?.billingCycle ?? currentPlanOption.billingCycle,
      maxUsers: license?.maxUsers ?? currentPlanOption.maxUsers,
      activeUsers,
      remainingUsers: Math.max((license?.maxUsers ?? currentPlanOption.maxUsers) - activeUsers, 0),
      status: license?.status ?? "unconfigured",
      validUntil: license?.validUntil?.toISOString() ?? null,
      updatedAt: license?.updatedAt?.toISOString() ?? null
    },
    plans: planOptions,
    marketplace: marketplaceCatalogFromLicense(license?.features, license?.plan ?? currentPlanOption.plan),
    billing: {
      invoices: invoices.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: Number(invoice.grossTotal),
        currency: "EUR",
        issueDate: invoice.issueDate?.toISOString() ?? null,
        dueDate: invoice.dueDate?.toISOString() ?? null,
        paidAt: invoice.paidAt?.toISOString() ?? null,
        downloadUrl: `/api/invoice/pdf/${invoice.id}`
      })),
      paymentMethods,
      paymentHistory: paymentHistory.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        method: payment.method,
        provider: payment.provider,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString() ?? null,
        invoiceNumber: payment.invoice?.number ?? null
      })),
      nextPayment
    }
  }
}

function apiError(error: unknown) {
  if (error instanceof AuthServiceError) {
    return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
  }
  console.error(error)
  return NextResponse.json({ ok: false, error: "Lizenz- und Abrechnungsdaten konnten nicht verarbeitet werden." }, { status: 500 })
}

export async function GET() {
  try {
    await requireCurrentUserRole(["admin"])
    return NextResponse.json(await loadLicenseBillingPayload())
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireCurrentUserRole(["admin"])
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    const action = String(body?.action ?? "")
    const license = await prisma.license.findFirst({ orderBy: { updatedAt: "desc" } })

    if (action === "update-plan") {
      const plan = normalizePlan(body?.plan)
      const billingCycle = normalizeBillingCycle(body?.billingCycle)
      const maxUsers = normalizeMaxUsers(body?.maxUsers)
      if (!plan || !billingCycle || !maxUsers) {
        return NextResponse.json({ ok: false, error: "Planangaben sind ungueltig." }, { status: 400 })
      }
      if (license) {
        await prisma.license.update({
          where: { id: license.id },
          data: { plan, billingCycle, maxUsers, status: "active" }
        })
      } else {
        await prisma.license.create({
          data: { plan, billingCycle, maxUsers, status: "active" }
        })
      }
      return NextResponse.json(await loadLicenseBillingPayload())
    }

    if (["install", "uninstall", "activate", "deactivate"].includes(action)) {
      if (!license) {
        return NextResponse.json({ ok: false, error: "Bitte zuerst einen Plan aktivieren." }, { status: 409 })
      }
      const moduleKey = String(body?.moduleKey ?? "").trim()
      const modules = marketplaceCatalogFromLicense(license.features, license.plan)
      const moduleIndex = modules.findIndex((module) => module.key === moduleKey)
      if (!moduleKey || moduleIndex === -1) {
        return NextResponse.json({ ok: false, error: "Marketplace-Modul wurde nicht in der Lizenzkonfiguration gefunden." }, { status: 404 })
      }
      const nextModules = modules.map((module, index) => {
        if (index !== moduleIndex) return module
        if (action === "install") return { ...module, installed: true, licenseStatus: "installed" }
        if (action === "uninstall") return { ...module, installed: false, active: false, licenseStatus: "inactive" }
        if (action === "activate") return { ...module, installed: true, active: true, licenseStatus: "active" }
        return { ...module, active: false, licenseStatus: "inactive" }
      })
      await prisma.license.update({
        where: { id: license.id },
        data: { features: replaceMarketplaceModules(license.features, nextModules) }
      })
      return NextResponse.json(await loadLicenseBillingPayload())
    }

    return NextResponse.json({ ok: false, error: "Unbekannte Lizenzaktion." }, { status: 400 })
  } catch (error) {
    return apiError(error)
  }
}
