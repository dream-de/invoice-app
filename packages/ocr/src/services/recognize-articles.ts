import { parseDelimitedRows, normalizeHeader } from "../extractors/csv"
import { fileToText, normalizeText } from "../extractors/text"
import type { ArticleImportResult, RecognizedArticle } from "../schemas/article-import"

function parseNumber(value: unknown): number {
  const normalized = String(value ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "")

  return Number(normalized) || 0
}

function isSupported(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type.includes("csv") ||
    file.type.includes("text") ||
    name.endsWith(".csv") ||
    name.endsWith(".txt")
  )
}

function getValue(row: Record<string, string>, names: string[]): string {
  for (const name of names) {
    const value = row[normalizeHeader(name)]
    if (value) return value
  }

  return ""
}

export async function recognizeArticlesFromFile(file: File): Promise<ArticleImportResult> {
  if (!isSupported(file)) {
    return {
      ok: false,
      fileName: file.name,
      fileType: file.type || "unknown",
      articles: [],
      warnings: ["Dieser Dateityp wird noch nicht echt ausgelesen. Aktuell sind CSV und TXT aktiv."],
      unsupported: true
    }
  }

  const text = normalizeText(await fileToText(file))
  const rows = parseDelimitedRows(text)

  if (rows.length < 2) {
    return {
      ok: false,
      fileName: file.name,
      fileType: file.type || "text/plain",
      articles: [],
      warnings: ["Keine Tabellenzeilen erkannt."]
    }
  }

  const headers = rows[0].map(normalizeHeader)
  const articles: RecognizedArticle[] = rows.slice(1).map((cells) => {
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))

    const name = getValue(row, ["Artikel", "Artikelname", "Name", "Bezeichnung", "Leistung", "Produkt"])
    const number = getValue(row, ["Artikelnummer", "Nummer", "Nr", "Code", "SKU"])
    const category = getValue(row, ["Kategorie", "Gruppe"])
    const unit = getValue(row, ["Einheit", "Unit"])
    const description = getValue(row, ["Beschreibung", "Description"])
    const price = getValue(row, ["Preis", "Nettopreis", "Netto", "Price"])
    const vatRate = getValue(row, ["MwSt", "USt", "VAT", "Steuer"])

    return {
      name,
      number,
      category,
      unit: unit || "Stk",
      description,
      netPrice: parseNumber(price),
      vatRate: vatRate ? parseNumber(vatRate) : 19,
      confidence: name && price ? 0.92 : 0.58
    }
  }).filter((article) => article.name && article.netPrice >= 0)

  return {
    ok: articles.length > 0,
    fileName: file.name,
    fileType: file.type || "text/plain",
    articles,
    warnings: articles.length ? [] : ["Keine Artikel erkannt."]
  }
}
