import { extractTextFromFile } from "../extractors/document-text"
import { normalizeText } from "../extractors/text"
import type { RecipientImportResult, RecognizedRecipient } from "../schemas/recipient-import"

type AddressParts = {
  company?: string
  street?: string
  zip?: string
  city?: string
}

const LEGAL_FORM_PATTERN =
  /(gmbh|ag|ug|kg|ohg|mbh|e\.k\.|ev|e\.v\.|inc|llc|ltd|sarl|bv|firma|solutions|consulting|group|studio|digital|software|handel|service)/i
const STREET_PATTERN =
  /([A-Za-zÄÖÜäöüß0-9 .'-]+(?:straße|strasse|str\.|weg|platz|allee|ring|gasse|damm|ufer|chaussee|road|street|st\.|avenue|ave\.|lane|drive)\s+\d+[A-Za-z]?(?:\s*-\s*\d+[A-Za-z]?)?)/i
const ZIP_CITY_PATTERN = /\b(\d{5})\s+([A-Za-zÄÖÜäöüß .-]+)\b/

function matchFirst(text: string, pattern: RegExp): string {
  return text.match(pattern)?.[1]?.trim() ?? ""
}

function cleanField(value?: string) {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/^[,;:\s]+|[,;:\s]+$/g, "")
    .trim()
}

function removeCompanyPrefixFromStreet(value: string) {
  return cleanField(value.match(STREET_PATTERN)?.[1] ?? value)
}

function companyFromAddressLine(line: string, street: string) {
  const beforeStreet = street ? line.slice(0, line.toLowerCase().indexOf(street.toLowerCase())) : line
  const company = beforeStreet.split(",").map(cleanField).filter(Boolean).at(0)
  return LEGAL_FORM_PATTERN.test(company ?? "") ? company ?? "" : ""
}

function parseAddressLine(line: string): AddressParts {
  const street = removeCompanyPrefixFromStreet(line.match(STREET_PATTERN)?.[1] ?? "")
  const zipCity = line.match(ZIP_CITY_PATTERN)
  const company = companyFromAddressLine(line, street)

  return {
    company,
    street,
    zip: zipCity?.[1] ?? "",
    city: zipCity?.[2] ? cleanField(zipCity[2]) : ""
  }
}

function likelyCompanyLine(lines: string[]) {
  return lines.find((line) => LEGAL_FORM_PATTERN.test(line)) ?? lines.find((line) => /[A-ZÄÖÜ][a-zäöüß]+/.test(line)) ?? ""
}

function likelyStreetLine(lines: string[]) {
  return lines.find((line) => STREET_PATTERN.test(line)) ?? ""
}

function likelyPersonLine(line: string) {
  const value = cleanField(line)
  if (!value || value.length > 60) return false
  if (LEGAL_FORM_PATTERN.test(value)) return false
  if (STREET_PATTERN.test(value) || ZIP_CITY_PATTERN.test(value)) return false
  if (/@/.test(value) || /\b(DE[0-9]{9})\b/i.test(value)) return false
  if (/(rechnung|invoice|angebot|gesamt|netto|brutto|ust|mwst|kund(e|en)|lieferant|ansprechpartner|kontakt)/i.test(value)) {
    return false
  }

  const words = value.split(/\s+/).filter(Boolean)
  return words.length >= 2 && words.length <= 4 && words.every((word) => /^[A-ZÄÖÜ][A-Za-zÄÖÜäöüß.'-]+$/.test(word))
}

function extractContact(lines: string[], company: string, street: string) {
  return lines.find((line) => {
    const value = cleanField(line)
    return value !== company && value !== street && likelyPersonLine(value)
  }) ?? ""
}

function bestAddressParts(lines: string[], companyLine: string, streetLine: string) {
  const parsedCompanyLine = parseAddressLine(companyLine)
  const parsedStreetLine = parseAddressLine(streetLine)
  const zipCity = lines.map((line) => line.match(ZIP_CITY_PATTERN)).find(Boolean)

  return {
    company: parsedCompanyLine.company || cleanField(companyLine),
    street: parsedCompanyLine.street || parsedStreetLine.street || removeCompanyPrefixFromStreet(streetLine),
    zip: parsedCompanyLine.zip || parsedStreetLine.zip || zipCity?.[1] || "",
    city: parsedCompanyLine.city || parsedStreetLine.city || (zipCity?.[2] ? cleanField(zipCity[2]) : "")
  }
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
  const companyLine = likelyCompanyLine(lines)
  const streetLine = likelyStreetLine(lines)
  const address = bestAddressParts(lines, companyLine, streetLine)
  const contact = extractContact(lines, address.company, address.street)

  const recipient: RecognizedRecipient = {
    company: address.company,
    contact,
    email,
    street: address.street,
    zip: address.zip,
    city: address.city,
    country: /deutschland/i.test(text) ? "Deutschland" : "Deutschland",
    vatId,
    confidence: address.company ? 0.84 : 0.45
  }

  return {
    ok: Boolean(recipient.company),
    fileName: file.name,
    fileType: file.type || "text/plain",
    recipient,
    warnings: recipient.company ? extracted.warnings : [...extracted.warnings, "Keine Firmenanschrift erkannt."]
  }
}
