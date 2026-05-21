import { prisma, type Customer } from "@dream-invoice/database"
import { createCsvResponse } from "@/lib/export/csv-response"


export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" }
  })

  const rows = [
    ["Nummer", "Name", "Ansprechpartner", "Status", "E-Mail", "Telefon", "Strasse", "PLZ", "Stadt", "Land"],
    ...customers.map((customer: Customer) => [
      customer.number,
      customer.name,
      customer.contact,
      customer.status,
      customer.email,
      customer.phone,
      customer.street,
      customer.zip,
      customer.city,
      customer.country
    ])
  ]


  return createCsvResponse(rows, "kunden-export.csv")
}
