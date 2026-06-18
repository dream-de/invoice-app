import { extractTextFromFile } from "@dream-invoice/ocr"

export type ReceiptOcrSuggestion = {
  supplier: string
  date: string
  amount: string
  invoiceNumber: string
  confidence: number
}

export type ReceiptOcrAnalysis = {
  ok: boolean
  text: string
  warnings: string[]
  unsupported?: boolean
  suggestion: ReceiptOcrSuggestion | null
}

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function findDate(text: string) {
  const german = text.match(/\b(\d{1,2}\.\d{1,2}\.\d{4})\b/)
  if (german?.[1]) return german[1]
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/)
  return iso?.[1] ?? ""
}

function findInvoiceNumber(text: string) {
  const match = text.match(/\b((?:RE|RG|INV|REC|Beleg)[-\/ ]?[A-Z0-9][A-Z0-9\-\/]{3,})\b/i)
  return match?.[1]?.trim() ?? ""
}

function findAmount(lines: string[]) {
  const labels = ["gesamt", "brutto", "total", "summe", "betrag"]
  for (const line of [...lines].reverse()) {
    const lower = line.toLowerCase()
    if (!labels.some((label) => lower.includes(label))) continue
    const match = line.match(/(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)/)
    if (match?.[1]) return match[1]
  }

  const all = lines
    .flatMap((line) => Array.from(line.matchAll(/\b(\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|\d+(?:,\d{2})?)\b/g)).map((match) => match[1]))
    .filter(Boolean)
  return all.at(-1) ?? ""
}

function findSupplier(lines: string[]) {
  const companyPattern = /(gmbh|ag|ug|kg|mbh|ltd|llc|inc|sarl|bv|studio|consulting|software|service|handel|group|solutions)/i
  return lines.find((line) => companyPattern.test(line)) ?? lines[0] ?? ""
}

export async function analyzeReceiptAttachment(file: File): Promise<ReceiptOcrAnalysis> {
  const extracted = await extractTextFromFile(file)
  if (!extracted.ok || !extracted.text) {
    return {
      ok: false,
      text: "",
      warnings: extracted.warnings,
      unsupported: extracted.unsupported,
      suggestion: null
    }
  }

  const text = extracted.text.trim()
  const lines = text.split("\n").map(cleanLine).filter(Boolean)
  const supplier = cleanLine(findSupplier(lines))
  const date = findDate(text)
  const amount = findAmount(lines)
  const invoiceNumber = findInvoiceNumber(text)
  const confidence = [supplier, date, amount].filter(Boolean).length / 3

  return {
    ok: Boolean(text),
    text,
    warnings: extracted.warnings,
    suggestion: supplier || date || amount || invoiceNumber ? {
      supplier,
      date,
      amount,
      invoiceNumber,
      confidence: Number(confidence.toFixed(2))
    } : null
  }
}
