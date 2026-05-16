import { customers } from "@/data/invoice-data"

export async function GET() {
  const rows = [
    ["Name", "Ansprechpartner", "Status", "E-Mail"],
    ...customers.map((customer) => [
      customer.name,
      customer.contact,
      customer.status,
      customer.email
    ])
  ]

  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(";")
    )
    .join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kunden-export.csv"'
    }
  })
}
