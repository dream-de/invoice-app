import { parseDelimitedRows, normalizeHeader } from "../extractors/csv"
import { extractTextFromFile } from "../extractors/document-text"
import { normalizeText } from "../extractors/text"
import type { PositionImportResult, RecognizedPosition } from "../schemas/position-import"

const AMOUNT_PATTERN = /-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+[.,]\d{2}/g
const SKIP_LINE_PATTERN = /(gesamt|summe|subtotal|zwischensumme|netto|brutto|mwst|ust|steuer|rechnung|invoice|datum|iban|bic|zahlbar|kunden|lieferant)/i

function parseNumber(value: unknown): number {
  const normalized = String(value ?? "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "")

  return Number(normalized) || 0
}

function cleanLabel(value: string) {
  return value
    .replace(/^\s*(?:pos\.?\s*)?\d+[.)-]?\s+/i, "")
    .replace(/^\s*[-–—•]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function getValue(row: Record<string, string>, names: string[]): string {
  for (const name of names) {
    const value = row[normalizeHeader(name)]
    if (value) return value
  }

  return ""
}

function fromDelimitedText(text: string): RecognizedPosition[] {
  const rows = parseDelimitedRows(text)
  if (rows.length < 2) return []

  const headers = rows[0].map(normalizeHeader)
  const hasPositionHeader = headers.some((header) =>
    ["artikel", "artikelname", "name", "bezeichnung", "leistung", "position", "beschreibung"].includes(header)
  )

  if (!hasPositionHeader) return []

  return rows.slice(1).map((cells) => {
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))
    const label = getValue(row, ["Artikel", "Artikelname", "Name", "Bezeichnung", "Leistung", "Position", "Beschreibung"])
    const qty = getValue(row, ["Menge", "Qty", "Quantity", "Anzahl", "Stück", "Stk"])
    const price = getValue(row, ["Preis", "Einzelpreis", "Einzel", "Nettopreis", "Netto", "Net Price", "Unit Price", "Price"])
    const total = getValue(row, ["Gesamt", "Gesamtpreis", "Total", "Summe"])
    const quantity = parseNumber(qty) || 1
    const unitPrice = parseNumber(price) || (total ? parseNumber(total) / quantity : 0)

    return {
      label: cleanLabel(label),
      qty: quantity,
      netPrice: Math.round(unitPrice * 100) / 100,
      category: "",
      confidence: label && unitPrice ? 0.9 : 0.55
    }
  }).filter((position) => position.label && position.netPrice >= 0)
}

function quantityBeforeAmount(line: string, amountStart: number) {
  const beforeAmount = line.slice(0, amountStart).trim()
  const match = beforeAmount.match(/(?:^|\s)(\d+(?:[,.]\d+)?)\s*(?:x|stk|std|h|pcs|qty)?\s*$/i)
  return match ? parseNumber(match[1]) : 1
}

function labelBeforeQuantity(line: string, amountStart: number) {
  const beforeAmount = line.slice(0, amountStart).trim()
  return cleanLabel(beforeAmount.replace(/\s+\d+(?:[,.]\d+)?\s*(?:x|stk|std|h|pcs|qty)?\s*$/i, ""))
}

function fromTextLines(text: string): RecognizedPosition[] {
  const positions: RecognizedPosition[] = []
  const lines = normalizeText(text).split("\n").map((line) => line.trim()).filter(Boolean)

  for (const line of lines) {
    if (SKIP_LINE_PATTERN.test(line)) continue

    const amountMatches = [...line.matchAll(AMOUNT_PATTERN)]
    if (amountMatches.length === 0) continue

    const firstAmount = amountMatches[0]
    const lastAmount = amountMatches[amountMatches.length - 1]
    const previousAmount = amountMatches.length > 1 ? amountMatches[amountMatches.length - 2] : undefined
    const qty = quantityBeforeAmount(line, firstAmount.index ?? 0)
    const label = labelBeforeQuantity(line, firstAmount.index ?? 0)

    if (!label || label.length < 3 || /^\d+$/.test(label)) continue

    const total = parseNumber(lastAmount[0])
    const unit = previousAmount ? parseNumber(previousAmount[0]) : total / qty
    const netPrice = unit > 0 ? unit : total

    positions.push({
      label,
      qty,
      netPrice: Math.round(netPrice * 100) / 100,
      category: "",
      confidence: amountMatches.length > 1 ? 0.78 : 0.62
    })
  }

  return positions
}

export async function recognizePositionsFromFile(file: File): Promise<PositionImportResult> {
  const extracted = await extractTextFromFile(file)

  if (!extracted.ok || !extracted.text) {
    return {
      ok: false,
      fileName: file.name,
      fileType: file.type || "unknown",
      positions: [],
      warnings: extracted.warnings,
      unsupported: extracted.unsupported
    }
  }

  const text = normalizeText(extracted.text)
  const positions = fromDelimitedText(text)
  const fallbackPositions = positions.length ? positions : fromTextLines(text)

  return {
    ok: fallbackPositions.length > 0,
    fileName: file.name,
    fileType: file.type || "text/plain",
    positions: fallbackPositions,
    warnings: fallbackPositions.length ? extracted.warnings : [...extracted.warnings, "Keine Positionen erkannt."]
  }
}
