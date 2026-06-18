import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { customers as fallbackCustomers } from "@/data/invoice-data"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

type FallbackCustomer = (typeof fallbackCustomers)[number]

function normalizeFallbackCustomer(customer: FallbackCustomer) {
  return {
    id: customer.id,
    number: "KD-" + customer.id.padStart(4, "0"),
    name: customer.name,
    contact: customer.contact || "",
    email: customer.email || "",
    phone: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    status: customer.status || "active"
  }
}

function fallbackCustomerRows() {
  return fallbackCustomers.map(normalizeFallbackCustomer)
}

async function requireCustomerViewPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "customers", "view")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Kundenaktion.", 403)
  }

  return user
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json(fallbackCustomerRows())
  }

  try {
    await requireCustomerViewPermission()

    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    if (error instanceof AuthServiceError) {
      const mapped = mapAuthError(error)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    console.error(error)

    return NextResponse.json(fallbackCustomerRows())
  }
}
