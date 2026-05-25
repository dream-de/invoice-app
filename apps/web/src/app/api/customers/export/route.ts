import { prisma, type Customer } from "@dream-invoice/database"
import { createCsvResponse } from "@/lib/export/csv-response"
import { customers as fallbackCustomers } from "@/data/invoice-data"

export const dynamic = "force-dynamic"

function createCustomerCsv(rows: string[][]) {
  return createCsvResponse(
    [
      ["Nummer", "Name", "Ansprechpartner", "Status", "E-Mail", "Telefon", "Strasse", "PLZ", "Stadt", "Land"],
      ...rows
    ],
    "kunden-export.csv"
  )
}

function rowsFromFallbackCustomers() {
  return fallbackCustomers.map((customer) => [
    "KD-" + customer.id.padStart(4, "0"),
    customer.name,
    customer.contact || "",
    customer.status || "active",
    customer.email || "",
    "",
    "",
    "",
    "",
    "Deutschland"
  ])
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return createCustomerCsv(rowsFromFallbackCustomers())
  }

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" }
    })

    return createCustomerCsv(customers.map((customer: Customer) => [
      customer.number,
      customer.name,
      customer.contact || "",
      customer.status,
      customer.email || "",
      customer.phone || "",
      customer.street || "",
      customer.zip || "",
      customer.city || "",
      customer.country
    ]))
  } catch (error) {
    console.error(error)
    return createCustomerCsv(rowsFromFallbackCustomers())
  }
}
