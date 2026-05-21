import { createCsvResponse } from "@/lib/export/csv-response"

export async function GET() {
  return createCsvResponse(
    [
      ["Artikelnummer", "Artikel", "Kategorie", "Nettopreis", "Einheit", "MwSt", "Beschreibung"],
      ["AR-1001", "Brand Strategy Workshop", "Dienstleistung", "950,00", "Stk", "19", "Halbtaegiger Workshop inkl. Ergebnisprotokoll"]
    ],
    "artikel-import-vorlage.csv"
  )
}
