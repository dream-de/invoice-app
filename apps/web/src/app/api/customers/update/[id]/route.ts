import { NextResponse } from "next/server"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { writeAuditLog } from "@/lib/audit/log"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

type CustomerPayload = {
  name?: unknown
  contact?: unknown
  email?: unknown
  phone?: unknown
  street?: unknown
  zip?: unknown
  city?: unknown
  country?: unknown
  status?: unknown
  notes?: unknown
}

function cleanText(value: unknown) {
  const text = String(value ?? "").trim()
  return text.length > 0 ? text : null
}

async function requireCustomerEditPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "customers", "edit")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Kundenaktion.", 403)
  }

  return user
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const data = (await req.json()) as CustomerPayload

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        customer: {
          id,
          number: `KD-DEMO-${id.slice(-4)}`,
          name: cleanText(data.name) || "Demo Kunde",
          contact: cleanText(data.contact),
          email: cleanText(data.email),
          phone: cleanText(data.phone),
          street: cleanText(data.street),
          zip: cleanText(data.zip),
          city: cleanText(data.city),
          country: cleanText(data.country) || "Deutschland",
          status: cleanText(data.status) || "active",
          notes: cleanText(data.notes)
        }
      }))
    }

    await requireCustomerEditPermission()

    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Kunde nicht gefunden." }, { status: 404 })
    }

    if (typeof data.name !== "undefined" && String(data.name).trim().length < 2) {
      return NextResponse.json({ ok: false, error: "Kundenname fehlt." }, { status: 400 })
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: cleanText(data.name) ?? existing.name,
        contact: cleanText(data.contact),
        email: cleanText(data.email),
        phone: cleanText(data.phone),
        street: cleanText(data.street),
        zip: cleanText(data.zip),
        city: cleanText(data.city),
        country: cleanText(data.country) || existing.country,
        status: cleanText(data.status) || existing.status,
        notes: cleanText(data.notes)
      }
    })

    await writeAuditLog({
      action: "customer.update",
      entity: "customer",
      entityId: id,
      reason: "Kunde aktualisiert",
      data: { entityLabel: customer.name ?? customer.number ?? id },
      before: { name: existing.name, contact: existing.contact, email: existing.email, phone: existing.phone, street: existing.street, zip: existing.zip, city: existing.city, country: existing.country, status: existing.status, notes: existing.notes },
      after: { name: customer.name, contact: customer.contact, email: customer.email, phone: customer.phone, street: customer.street, zip: customer.zip, city: customer.city, country: customer.country, status: customer.status, notes: customer.notes },
      requestMetadata: getAuditRequestMetadata(req)
    })

    return NextResponse.json({ ok: true, customer })
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const mapped = mapAuthError(error)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    console.error(error)
    return NextResponse.json({ ok: false, error: "Kunde konnte nicht gespeichert werden." }, { status: 500 })
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  return PATCH(req, context)
}
