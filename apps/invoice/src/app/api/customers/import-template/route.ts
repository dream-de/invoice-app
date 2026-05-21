import { createCsvResponse } from "@/lib/export/csv-response"

export async function GET() {
  return createCsvResponse(
    [
      ["Kundennummer", "Name", "Kontakt", "E-Mail", "Telefon", "Strasse", "PLZ", "Stadt", "Land", "Notizen", "Status"],
      ["DI-KD-1001", "Blue Harbor Studio LLC", "Maya Bennett", "hello@blue-harbor.example", "+1 212 555 0148", "120 Harbor Street", "10012", "Metropolis", "USA", "Demo-Kunde", "active"]
    ],
    "kunden-import-vorlage.csv"
  )
}
