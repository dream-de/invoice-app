import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { customers as fallbackCustomers } from "@/data/invoice-data"
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

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json(fallbackCustomerRows())
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error(error)

    return NextResponse.json(fallbackCustomerRows())
  }
}
