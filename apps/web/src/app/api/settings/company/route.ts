import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { AuthServiceError, mapAuthError, requireCurrentUserRole } from "@/lib/auth/service"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

const fallbackCompanySettings = {
  id: "demo-company-settings",
  company: "Dream Ledger GmbH",
  owner: "Lena Falk",
  street: "Lindenallee 42",
  zip: "10115",
  city: "Koeln",
  country: "Deutschland",
  email: "office@dream-ledger.example",
  phone: "+49 30 1234567",
  website: "www.dream-ledger.example",
  taxNumber: "12/345/67890",
  vatId: "DE123456789",
  iban: "DE12 1005 0000 1234 5678 90",
  bic: "BELA DE BE XXX",
  bankName: "Koelner Sparkasse",
  defaultPaymentTermsDays: 14,
  defaultPaymentNote: "Bitte ueberweisen Sie den Betrag innerhalb von 14 Tagen.",
  registerCourt: "Amtsgericht Charlottenburg HRB 12345",
  logoUrl: null
}

function parsePaymentTermsDays(value: unknown) {
  const parsed = Number.parseInt(String(value ?? fallbackCompanySettings.defaultPaymentTermsDays), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackCompanySettings.defaultPaymentTermsDays
}

function companySettingsFromData(data: Record<string, unknown>) {
  return {
    ...fallbackCompanySettings,
    company: String(data.company || fallbackCompanySettings.company).trim(),
    owner: data.owner ? String(data.owner).trim() : null,
    street: data.street ? String(data.street).trim() : null,
    zip: data.zip ? String(data.zip).trim() : null,
    city: data.city ? String(data.city).trim() : null,
    country: data.country ? String(data.country).trim() : "Deutschland",
    email: data.email ? String(data.email).trim() : null,
    phone: data.phone ? String(data.phone).trim() : null,
    website: data.website ? String(data.website).trim() : null,
    taxNumber: data.taxNumber ? String(data.taxNumber).trim() : null,
    vatId: data.vatId ? String(data.vatId).trim() : null,
    iban: data.iban ? String(data.iban).trim() : null,
    bic: data.bic ? String(data.bic).trim() : null,
    bankName: data.bankName ? String(data.bankName).trim() : null,
    defaultPaymentTermsDays: parsePaymentTermsDays(data.defaultPaymentTermsDays),
    defaultPaymentNote: data.defaultPaymentNote ? String(data.defaultPaymentNote).trim().slice(0, 1000) : null,
    registerCourt: data.registerCourt ? String(data.registerCourt).trim() : null,
    logoUrl: data.logoUrl ? String(data.logoUrl).trim() : null
  }
}

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, settings: fallbackCompanySettings, mode: "demo" })
  }

  try {
    await requireCurrentUserRole(["admin"])

    const settings = await prisma.companySettings.findFirst({
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ ok: true, settings: settings ?? fallbackCompanySettings })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error(error)
    return NextResponse.json({ ok: true, settings: fallbackCompanySettings, mode: "demo" })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()

    if (!data.company || String(data.company).trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: "Firmenname fehlt." },
        { status: 400 }
      )
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        settings: companySettingsFromData(data)
      }))
    }

    const actor = await requireCurrentUserRole(["admin"])

    const existing = await prisma.companySettings.findFirst({
      orderBy: { createdAt: "desc" }
    })

    const payload = {
      company: String(data.company).trim(),
      owner: data.owner || null,
      street: data.street || null,
      zip: data.zip || null,
      city: data.city || null,
      country: data.country || "Deutschland",
      email: data.email || null,
      phone: data.phone || null,
      website: data.website || null,
      taxNumber: data.taxNumber || null,
      vatId: data.vatId || null,
      iban: data.iban || null,
      bic: data.bic || null,
      bankName: data.bankName || null,
      defaultPaymentTermsDays: parsePaymentTermsDays(data.defaultPaymentTermsDays),
      defaultPaymentNote: data.defaultPaymentNote ? String(data.defaultPaymentNote).trim().slice(0, 1000) : null,
      registerCourt: data.registerCourt || null,
      logoUrl: data.logoUrl || null
    }

    const settings = existing
      ? await prisma.companySettings.update({
          where: { id: existing.id },
          data: payload
        })
      : await prisma.companySettings.create({
          data: payload
        })

    await writeAuditLog({
      action: "settings.update",
      entity: "companySettings",
      entityId: settings.id,
      reason: existing ? "Company settings updated" : "Company settings created",
      data: {
        actorUserId: actor.id,
        entityLabel: settings.company,
        mode: existing ? "update" : "create",
        changedFields: Object.keys(payload),
        hasLogo: Boolean(payload.logoUrl)
      },
      before: existing ? { company: existing.company, owner: existing.owner, street: existing.street, zip: existing.zip, city: existing.city, country: existing.country, email: existing.email, phone: existing.phone, website: existing.website, taxNumber: existing.taxNumber, vatId: existing.vatId, iban: existing.iban, bic: existing.bic, bankName: existing.bankName, defaultPaymentTermsDays: existing.defaultPaymentTermsDays, defaultPaymentNote: existing.defaultPaymentNote, registerCourt: existing.registerCourt, logoUrl: existing.logoUrl } : undefined,
      after: payload,
      requestMetadata: getAuditRequestMetadata(request)
    })

    return NextResponse.json({ ok: true, settings })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError

    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Stammdaten konnten nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
