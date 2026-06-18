import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

const defaultPaymentMethods = [
  { key: "bank_transfer", label: "Ueberweisung", enabled: true, prepared: false, sortOrder: 10 },
  { key: "cash", label: "Bar", enabled: true, prepared: false, sortOrder: 20 },
  { key: "ec_card", label: "EC-Karte", enabled: true, prepared: false, sortOrder: 30 },
  { key: "credit_card", label: "Kreditkarte", enabled: true, prepared: false, sortOrder: 40 },
  { key: "paypal", label: "PayPal", enabled: false, prepared: true, sortOrder: 50 },
  { key: "stripe", label: "Stripe", enabled: false, prepared: true, sortOrder: 60 },
  { key: "finapi", label: "finAPI Open Banking", enabled: false, prepared: true, sortOrder: 70 }
]

const defaultPaymentProviders = ["paypal", "stripe", "finapi"] as const

function normalizePaymentProvider(provider: unknown) {
  const normalized = trim(provider, 20).toLowerCase()
  return defaultPaymentProviders.includes(normalized as (typeof defaultPaymentProviders)[number]) ? normalized : "paypal"
}

const defaultPaymentTerms = [
  { label: "Sofort faellig", days: 0, isDefault: false, active: true, sortOrder: 10 },
  { label: "7 Tage", days: 7, isDefault: false, active: true, sortOrder: 20 },
  { label: "14 Tage", days: 14, isDefault: true, active: true, sortOrder: 30 },
  { label: "30 Tage", days: 30, isDefault: false, active: true, sortOrder: 40 }
]

const defaultReminderPreparation = [
  { level: 1, label: "Freundliche Erinnerung", daysAfterDue: 7, active: false, templateNote: "Vorlage fuer erste Zahlungserinnerung vorbereitet." },
  { level: 2, label: "Mahnung", daysAfterDue: 14, active: false, templateNote: "Vorlage fuer Mahnstufe vorbereitet." },
  { level: 3, label: "Letzte Mahnung", daysAfterDue: 30, active: false, templateNote: "Vorlage fuer letzte Mahnstufe vorbereitet." }
]

const fallbackSettings = {
  company: "Dream Ledger GmbH",
  defaultPaymentTermsDays: 14,
  defaultPaymentNote: "Bitte ueberweisen Sie den Betrag innerhalb von 14 Tagen.",
  bankName: "Koelner Sparkasse",
  iban: "DE12 1005 0000 1234 5678 90",
  bic: "BELA DE BE XXX"
}

function trim(value: unknown, max = 240) {
  return String(value ?? "").trim().slice(0, max)
}

function parseDays(value: unknown, fallback = 14) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

type NormalizedBankAccount = {
  id: string
  bankName: string
  accountHolder: string
  iban: string
  bic: string | null
  isDefault: boolean
  qrEnabled: boolean
  active: boolean
}

type NormalizedPaymentTerm = {
  companySettingsId: string
  label: string
  days: number
  isDefault: boolean
  active: boolean
  sortOrder: number
}

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }

  return null
}

function fallbackBankAccounts() {
  return [{
    id: "demo-standard-bank",
    bankName: fallbackSettings.bankName,
    accountHolder: fallbackSettings.company,
    iban: fallbackSettings.iban,
    bic: fallbackSettings.bic,
    isDefault: true,
    qrEnabled: true,
    active: true
  }]
}

async function ensureCompanySettings() {
  const existing = await prisma.companySettings.findFirst({ orderBy: { createdAt: "desc" } })
  if (existing) return existing

  return prisma.companySettings.create({
    data: {
      company: fallbackSettings.company,
      country: "Deutschland",
      bankName: fallbackSettings.bankName,
      iban: fallbackSettings.iban,
      bic: fallbackSettings.bic,
      defaultPaymentTermsDays: fallbackSettings.defaultPaymentTermsDays,
      defaultPaymentNote: fallbackSettings.defaultPaymentNote
    }
  })
}

async function loadFinanceBase() {
  const settings = await ensureCompanySettings()
  let [bankAccounts, paymentMethods, paymentProviderConfigs, paymentTerms, reminderPreparation] = await Promise.all([
    prisma.bankAccount.findMany({ where: { companySettingsId: settings.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    prisma.paymentMethodConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { sortOrder: "asc" } }),
    prisma.paymentProviderConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { provider: "asc" } }),
    prisma.paymentTermConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { sortOrder: "asc" } }),
    prisma.reminderPreparation.findMany({ where: { companySettingsId: settings.id }, orderBy: { level: "asc" } })
  ])

  if (!bankAccounts.length && settings.iban) {
    const created = await prisma.bankAccount.create({
      data: {
        companySettingsId: settings.id,
        bankName: settings.bankName || "Standardkonto",
        accountHolder: settings.company,
        iban: settings.iban,
        bic: settings.bic,
        isDefault: true,
        qrEnabled: true,
        active: true
      }
    })
    bankAccounts = [created]
  }

  const missingProviders = defaultPaymentProviders.filter((provider) => !paymentProviderConfigs.some((config) => config.provider === provider))
  if (missingProviders.length) {
    await prisma.paymentProviderConfig.createMany({
      data: missingProviders.map((provider) => ({ companySettingsId: settings.id, provider, enabled: false, lastStatus: "open" })),
      skipDuplicates: true
    })
    paymentProviderConfigs = await prisma.paymentProviderConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { provider: "asc" } })
  }

  if (!paymentMethods.length) {
    await prisma.paymentMethodConfig.createMany({
      data: defaultPaymentMethods.map((method) => ({ ...method, companySettingsId: settings.id })),
      skipDuplicates: true
    })
    paymentMethods = await prisma.paymentMethodConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { sortOrder: "asc" } })
  }

  if (!paymentTerms.length) {
    await prisma.paymentTermConfig.createMany({
      data: defaultPaymentTerms.map((term) => ({ ...term, companySettingsId: settings.id, isDefault: term.days === (settings.defaultPaymentTermsDays ?? 14) })),
      skipDuplicates: true
    })
    paymentTerms = await prisma.paymentTermConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { sortOrder: "asc" } })
  }

  if (!reminderPreparation.length) {
    await prisma.reminderPreparation.createMany({
      data: defaultReminderPreparation.map((item) => ({ ...item, companySettingsId: settings.id }))
    })
    reminderPreparation = await prisma.reminderPreparation.findMany({ where: { companySettingsId: settings.id }, orderBy: { level: "asc" } })
  }

  return { settings, bankAccounts, paymentMethods, paymentProviderConfigs, paymentTerms, reminderPreparation }
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, mode: "demo", settings: fallbackSettings, bankAccounts: fallbackBankAccounts(), paymentMethods: defaultPaymentMethods, paymentProviderConfigs: [{ provider: "paypal", enabled: false, apiKey: "", secretKey: "", webhookUrl: "" }, { provider: "stripe", enabled: false, apiKey: "", secretKey: "", webhookUrl: "" }, { provider: "finapi", enabled: false, apiKey: "", secretKey: "", webhookUrl: "/api/finance/open-banking/finapi/webhook" }], paymentTerms: defaultPaymentTerms, reminderPreparation: defaultReminderPreparation })
  }

  try {
    await requireCurrentUserRole(["admin"])
    const data = await loadFinanceBase()
    return NextResponse.json({ ok: true, ...data })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Finance base loading failed.", error)
    return NextResponse.json({ ok: false, error: "Finanzdaten konnten nicht geladen werden." }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json()

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true, ...payload }))
    }

    await requireCurrentUserRole(["admin"])
    const settings = await ensureCompanySettings()
    const accounts = Array.isArray(payload.bankAccounts) ? payload.bankAccounts : []
    const methods = Array.isArray(payload.paymentMethods) ? payload.paymentMethods : []
    const terms = Array.isArray(payload.paymentTerms) ? payload.paymentTerms : []
    const providerConfigs = Array.isArray(payload.paymentProviderConfigs) ? payload.paymentProviderConfigs : []
    const reminders = Array.isArray(payload.reminderPreparation) ? payload.reminderPreparation : []

    const validAccounts: NormalizedBankAccount[] = accounts
      .map((account: Record<string, unknown>, index: number): NormalizedBankAccount => ({
        id: trim(account.id, 128),
        bankName: trim(account.bankName) || "Bankkonto " + (index + 1),
        accountHolder: trim(account.accountHolder) || settings.company,
        iban: trim(account.iban, 80).replace(/\s+/g, " ").toUpperCase(),
        bic: trim(account.bic, 40).toUpperCase() || null,
        isDefault: Boolean(account.isDefault),
        qrEnabled: account.qrEnabled !== false,
        active: account.active !== false
      }))
      .filter((account: NormalizedBankAccount) => account.iban)

    if (!validAccounts.length) {
      return NextResponse.json({ ok: false, error: "Mindestens ein Bankkonto mit IBAN ist erforderlich." }, { status: 400 })
    }

    const defaultIndex = validAccounts.findIndex((account) => account.isDefault)
    validAccounts.forEach((account, index) => {
      account.isDefault = defaultIndex >= 0 ? index === defaultIndex : index === 0
    })

    const saved = await prisma.$transaction(async (tx) => {
      await tx.bankAccount.deleteMany({ where: { companySettingsId: settings.id } })
      await tx.bankAccount.createMany({
        data: validAccounts.map((account) => ({
          companySettingsId: settings.id,
          bankName: account.bankName,
          accountHolder: account.accountHolder,
          iban: account.iban,
          bic: account.bic,
          isDefault: account.isDefault,
          qrEnabled: account.qrEnabled,
          active: account.active
        }))
      })

      await tx.paymentMethodConfig.deleteMany({ where: { companySettingsId: settings.id } })
      await tx.paymentMethodConfig.createMany({
        data: (methods.length ? methods : defaultPaymentMethods).map((method: Record<string, unknown>, index: number) => {
          const key = trim(method.key, 80)
          const fallback = defaultPaymentMethods.find((item) => item.key === key)
          return {
            companySettingsId: settings.id,
            key: key || fallback?.key || "method_" + index,
            label: trim(method.label) || fallback?.label || "Zahlungsart",
            enabled: Boolean(method.enabled),
            prepared: Boolean(method.prepared),
            sortOrder: Number(method.sortOrder ?? fallback?.sortOrder ?? index * 10)
          }
        })
      })

      await tx.paymentProviderConfig.deleteMany({ where: { companySettingsId: settings.id } })
      await tx.paymentProviderConfig.createMany({
        data: (providerConfigs.length ? providerConfigs : defaultPaymentProviders.map((provider) => ({ provider }))).map((item: Record<string, unknown>) => {
          const provider = normalizePaymentProvider(item.provider)
          const apiKey = trim(item.apiKey, 400)
          const secretKey = trim(item.secretKey, 400)
          const enabled = Boolean(item.enabled) && Boolean(apiKey) && Boolean(secretKey)
          return {
            companySettingsId: settings.id,
            provider,
            apiKey: apiKey || null,
            secretKey: secretKey || null,
            webhookUrl: trim(item.webhookUrl, 500) || (provider === "finapi" ? "/api/finance/open-banking/finapi/webhook" : null),
            enabled,
            connectedAt: enabled ? new Date() : null,
            lastStatus: enabled ? "prepared" : "open"
          }
        })
      })

      await tx.paymentTermConfig.deleteMany({ where: { companySettingsId: settings.id } })
      const normalizedTerms: NormalizedPaymentTerm[] = (terms.length ? terms : defaultPaymentTerms).map((term: Record<string, unknown>, index: number): NormalizedPaymentTerm => ({
        companySettingsId: settings.id,
        label: trim(term.label) || parseDays(term.days) + " Tage",
        days: parseDays(term.days),
        isDefault: Boolean(term.isDefault),
        active: term.active !== false,
        sortOrder: Number(term.sortOrder ?? index * 10)
      }))
      const defaultTermIndex = normalizedTerms.findIndex((term) => term.isDefault)
      normalizedTerms.forEach((term, index) => {
        term.isDefault = defaultTermIndex >= 0 ? index === defaultTermIndex : term.days === validAccounts.length ? false : index === 0
      })
      await tx.paymentTermConfig.createMany({ data: normalizedTerms })

      await tx.reminderPreparation.deleteMany({ where: { companySettingsId: settings.id } })
      await tx.reminderPreparation.createMany({
        data: (reminders.length ? reminders : defaultReminderPreparation).map((item: Record<string, unknown>, index: number) => ({
          companySettingsId: settings.id,
          level: Number(item.level ?? index + 1),
          label: trim(item.label) || "Mahnstufe " + (index + 1),
          daysAfterDue: parseDays(item.daysAfterDue, (index + 1) * 7),
          active: Boolean(item.active),
          templateNote: trim(item.templateNote, 1000) || null
        }))
      })

      const defaultAccount = validAccounts.find((account) => account.isDefault) ?? validAccounts[0]
      const defaultTerm = normalizedTerms.find((term) => term.isDefault) ?? normalizedTerms[0]
      await tx.companySettings.update({
        where: { id: settings.id },
        data: {
          bankName: defaultAccount.bankName,
          iban: defaultAccount.iban,
          bic: defaultAccount.bic,
          defaultPaymentTermsDays: defaultTerm.days
        }
      })

      return {
        settings: await tx.companySettings.findUnique({ where: { id: settings.id } }),
        bankAccounts: await tx.bankAccount.findMany({ where: { companySettingsId: settings.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
        paymentMethods: await tx.paymentMethodConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { sortOrder: "asc" } }),
        paymentProviderConfigs: await tx.paymentProviderConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { provider: "asc" } }),
        paymentTerms: await tx.paymentTermConfig.findMany({ where: { companySettingsId: settings.id }, orderBy: { sortOrder: "asc" } }),
        reminderPreparation: await tx.reminderPreparation.findMany({ where: { companySettingsId: settings.id }, orderBy: { level: "asc" } })
      }
    })

    await writeAuditLog({
      action: "settings.company.update",
      entity: "financeBase",
      entityId: settings.id,
      reason: "Finance base settings updated",
      data: {
        bankAccounts: validAccounts.length,
        paymentMethods: methods.length,
        paymentProviderConfigs: providerConfigs.length,
        paymentTerms: terms.length,
        reminderPreparation: reminders.length
      }
    })

    return NextResponse.json({ ok: true, ...saved })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Finance base saving failed.", error)
    return NextResponse.json({ ok: false, error: "Finanzdaten konnten nicht gespeichert werden." }, { status: 500 })
  }
}
