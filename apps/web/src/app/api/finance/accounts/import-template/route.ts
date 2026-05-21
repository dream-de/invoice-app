import { createCsvResponse } from "@/lib/export/csv-response"

export async function GET() {
  return createCsvResponse(
    [
      ["Datum", "Beschreibung", "Auftraggeber", "IBAN", "Betrag", "Waehrung"],
      ["2026-05-20", "Rechnung DI-2026-1001", "Blue Harbor Studio LLC", "DE02100100100012345678", "1.487,50", "EUR"]
    ],
    "bankimport-vorlage.csv"
  )
}
