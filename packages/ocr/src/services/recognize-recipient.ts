import { extractTextFromFile } from "../extractors/document-text"
import { normalizeText } from "../extractors/text"
import type { RecipientImportResult, RecognizedRecipient } from "../schemas/recipient-import"

function matchFirst(text: string, pattern: RegExp): string {
  return text.match(pattern)?.[1]?.trim() ?? ""
}

function likelyCompanyLine(lines: string[]) {
  const legalForm = /(gmbh|ag|ug|kg|ohg|mbh|e\.k\.|ev|e\.v\.|inc|llc|ltd|sarl|bv|firma|solutions|consulting|group|studio|digital|software|handel|service)/i
  return lines.find((line) => legalForm.test(line)) ?? lines.find((line) => /[A-ZÄÖÜ][a-zäöüß]+/.test(line)) ?? ""
}

function likelyStreetLine(lines: string[]) {
  return lines.find((line) =>
    /\d/.test(line) &&
    /(straße|strasse|str\.|weg|platz|allee|ring|gasse|damm|ufer|chaussee|road|street|st\.|avenue|ave\.|lane|drive)/i.test(line)
  ) ?? ""
}

function extractContact(lines: string[], company: string, street: string) {
  return lines.find((line) =>
    line !== company &&
    line !== street &&
    !/@/.test(line) &&
    !/\b(DE[0-9]{9})\b/i.test(line) &&
    !/\b\d{5}\s+/.test(line) &&
    !/(rechnung|invoice|angebot|gesamt|netto|brutto|ust|mwst)/i.test(line)
  ) ?? ""
}

function unsupportedResponse(file: File, warnings: string[], unsupported?: boolean): RecipientImportResult {
  return {
    ok: false,
    fileName: file.name,
    fileType: file.type || "unknown",
    warnings,
    unsupported
  }
}

export async function recognizeRecipientFromFile(file: File): Promise<RecipientImportResult> {
  const extracted = await extractTextFromFile(file)

  if (!extracted.ok || !extracted.text) {
    return unsupportedResponse(file, extracted.warnings, extracted.unsupported)
  }

  const text = normalizeText(extracted.text)
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean)

  const email = matchFirst(text, /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
  const vatId = matchFirst(text, /\b(DE[0-9]{9})\b/i)
  const zipCity = text.match(/\b(\d{5})\s+([A-Za-zÄÖÜäöüß .-]+)\b/)
  const street = likelyStreetLine(lines)
  const company = likelyCompanyLine(lines)
  const contact = extractContact(lines, company, street)

  const recipient: RecognizedRecipient = {
    company,
    contact,
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
    warnings: recipient.company ? extracted.warnings : [...extracted.warnings, "Keine Firmenanschrift erkannt."]
  }
}
