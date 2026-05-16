import { fileToText, normalizeText } from "../extractors/text"
import type { RecipientImportResult, RecognizedRecipient } from "../schemas/recipient-import"

function isSupported(file: File): boolean {
  const name = file.name.toLowerCase()
  return (
    file.type.includes("text") ||
    file.type.includes("csv") ||
    name.endsWith(".txt") ||
    name.endsWith(".csv")
  )
}

function matchFirst(text: string, pattern: RegExp): string {
  return text.match(pattern)?.[1]?.trim() ?? ""
}

export async function recognizeRecipientFromFile(file: File): Promise<RecipientImportResult> {
  if (!isSupported(file)) {
    return {
      ok: false,
      fileName: file.name,
      fileType: file.type || "unknown",
      warnings: ["Dieser Dateityp wird noch nicht echt ausgelesen. Aktuell sind CSV und TXT aktiv."],
      unsupported: true
    }
  }

  const text = normalizeText(await fileToText(file))
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)

  const email = matchFirst(text, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
  const vatId = matchFirst(text, /\b(DE[0-9]{9})\b/i)
  const zipCity = text.match(/\b(\d{5})\s+([A-Za-zÄÖÜäöüß .-]+)\b/)
  const street = lines.find((line) => /\d/.test(line) && /(straße|str\.|weg|platz|allee|ring|gasse)/i.test(line)) ?? ""
  const company = lines.find((line) => /(gmbh|ag|ug|kg|ohg|mbh|firma|solutions|consulting|group)/i.test(line)) ?? lines[0] ?? ""

  const recipient: RecognizedRecipient = {
    company,
    email,
    street,
    zip: zipCity?.[1] ?? "",
    city: zipCity?.[2]?.trim() ?? "",
    country: /deutschland/i.test(text) ? "Deutschland" : "Deutschland",
    vatId,
    confidence: company ? 0.82 : 0.45
  }

  return {
    ok: Boolean(recipient.company),
    fileName: file.name,
    fileType: file.type || "text/plain",
    recipient,
    warnings: recipient.company ? [] : ["Keine Firmenanschrift erkannt."]
  }
}
