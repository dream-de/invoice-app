import { NextResponse } from "next/server"
import { getAuditRequestMetadata } from "@/lib/audit/request-metadata"
import { writeAuditLog } from "@/lib/audit/log"
import { prisma } from "@dream-invoice/database"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

function demoCustomerFromData(data: Record<string, unknown>) {
  const number = String(data.number || "").trim() || "KD-DEMO-0001"

  return {
    id: "demo-" + Date.now(),
    number,
    name: String(data.name || "").trim(),
    contact: data.contact ? String(data.contact).trim() : null,
    email: data.email ? String(data.email).trim() : null,
    phone: data.phone ? String(data.phone).trim() : null,
    street: data.street ? String(data.street).trim() : null,
    zip: data.zip ? String(data.zip).trim() : null,
    city: data.city ? String(data.city).trim() : null,
    country: data.country ? String(data.country).trim() : "Deutschland",
    status: data.status ? String(data.status).trim() : "active"
  }
}

async function requireCustomerEditPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "customers", "edit")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Kundenaktion.", 403)
  }

  return user
}

export async function POST(req: Request) {
  try {
    const data = await req.json()

    if (!data.name || String(data.name).trim().length < 2) {
      return NextResponse.json(
        { error: "Kundenname fehlt." },
        { status: 400 }
      )
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        customer: demoCustomerFromData(data)
      }))
    }

    await requireCustomerEditPermission()

    const requestedNumber = data.number?.trim()
    let number = requestedNumber

    if (!number) {
      let nextValue = (await prisma.customer.count()) + 1

      while (!number) {
        const candidate = `KD-${String(nextValue).padStart(4, "0")}`
        const existing = await prisma.customer.findUnique({ where: { number: candidate } })
        if (!existing) number = candidate
        nextValue += 1
      }
    }

    const customer = await prisma.customer.create({
      data: {
        number,
        name: data.name,
        contact: data.contact || null,
        email: data.email || null,
        phone: data.phone || null,
        street: data.street || null,
        zip: data.zip || null,
        city: data.city || null,
        country: data.country || "Deutschland",
        status: data.status || "active"
      }
    })

    await writeAuditLog({
      action: "customer.create",
      entity: "customer",
      entityId: customer.id,
      reason: "Kunde erstellt",
      data: { entityLabel: customer.name ?? customer.number ?? customer.id },
      requestMetadata: getAuditRequestMetadata(req)
    })

    return NextResponse.json({ ok: true, customer })
  } catch (error: any) {
    if (error instanceof AuthServiceError) {
      const mapped = mapAuthError(error)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Kundennummer existiert bereits." },
        { status: 409 }
      )
    }

    console.error(error)

    return NextResponse.json(
      { error: "Kunde konnte nicht erstellt werden." },
      { status: 500 }
    )
  }
}
