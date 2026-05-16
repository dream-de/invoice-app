// apps/invoice/src/lib/receiptParser.ts

export type ParsedVatDetail = {
  rate: number
  amount: number | null
}

export type ParsedItem = {
  title: string
  quantity: number
  gross: number | null
  net: number | null
  vatRate: number | null
}

export type ParsedReceipt = {
  companyName: string
  street: string
  zip: string
  city: string
  items: ParsedItem[]
  vatRates: number[]
  vatDetails: ParsedVatDetail[]
  total: number | null
  date: string
  time: string
  paymentMethod: string | null
  store: string | null
  receiptNumber: string | null
  raw: string
}

const DRINK_KEYWORDS = [
  "cola",
  "coke",
  "wasser",
  "mineralwasser",
  "sprudel",
  "saft",
  "juice",
  "wein",
  "bier",
  "radler",
  "schnaps",
  "whisky",
  "vodka",
  "rum",
  "gin",
  "prosecco",
  "sekt",
  "getränk",
  "drink",
  "limonade",
  "limo"
]

const FOOD_KEYWORDS = [
  "pizza",
  "pasta",
  "nudeln",
  "salat",
  "burger",
  "menü",
  "menu",
  "gericht",
  "essen",
  "speise",
  "dessert",
  "tiramisu",
  "torte",
  "kuchen",
  "suppe",
  "steak",
  "fisch",
  "sandwich",
  "wrap",
  "pommes",
  "fries",
  "kartoffeln",
  "reis"
]

function normalizeNumber(str: string): number {
  return parseFloat(str.replace("€", "").replace(/\s/g, "").replace(",", "."))
}

function detectVatRateForItem(title: string, defaultVatRates: number[]): number | null {
  const lower = title.toLowerCase()

  // Getränke → 19% (DE Gastro)
  if (DRINK_KEYWORDS.some((k) => lower.includes(k))) {
    return 19
  }

  // Speisen → 7% (DE Gastro – deine gewünschte Logik)
  if (FOOD_KEYWORDS.some((k) => lower.includes(k))) {
    return 7
  }

  // Wenn nur ein Satz existiert → diesen nehmen
  if (defaultVatRates.length === 1) return defaultVatRates[0]

  // Wenn 7 und 19 vorhanden → Standard: 7% (Gastro‑Logik)
  if (
    defaultVatRates.includes(7) &&
    defaultVatRates.includes(19)
  ) {
    return 7
  }

  // Sonst: kein sicherer Satz
  return null
}

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  // Firmenname: erste sinnvolle Textzeile
  const companyName =
    lines.find((l) => /^[A-Za-zÄÖÜäöüß].+/.test(l)) ?? ""

  // Adresse (PLZ + Stadt)
  const addressRegex = /(\d{4,5})\s+([A-Za-zÄÖÜäöüß\- ]+)/
  const addressLine = lines.find((l) => addressRegex.test(l)) ?? ""
  const addressMatch = addressLine.match(addressRegex)

  const street =
    lines.find(
      (l) =>
        /\d+/.test(l) &&
        !addressRegex.test(l) &&
        !/Bon|Beleg|Rechnung|Kasse|Filiale|Markt/i.test(l)
    ) ?? ""

  const zip = addressMatch ? addressMatch[1] : ""
  const city = addressMatch ? addressMatch[2].trim() : ""

  // MwSt‑Sätze (universal)
  const vatRegex = /(\d{1,2}[.,]?\d{0,2})\s*%/g
  const vatMatches = text.match(vatRegex) || []
  const vatRates = vatMatches
    .map((v) => parseFloat(v.replace("%", "").replace(",", ".")))
    .filter((v) => v > 0 && v < 30)
  const uniqueVatRates = [...new Set(vatRates)]

  // MwSt‑Beträge
  const vatAmountRegex = /(\d{1,2}[.,]?\d{0,2})%\s*[:\-]?\s*([\d.,]+\s?€?)/g
  const vatDetails: ParsedVatDetail[] = []
  let vatMatch: RegExpExecArray | null
  while ((vatMatch = vatAmountRegex.exec(text)) !== null) {
    const rate = parseFloat(vatMatch[1].replace(",", "."))
    const amount = normalizeNumber(vatMatch[2])
    if (!isNaN(rate) && !isNaN(amount)) {
      vatDetails.push({ rate, amount })
    }
  }

  // Artikelzeilen (einfache Heuristik)
  const itemRegex = /^(.+?)\s+x?(\d+)\s+([\d.,]+\s?€?)$/
  const items: ParsedItem[] = []

  for (const line of lines) {
    const m = line.match(itemRegex)
    if (m) {
      const title = m[1].trim()
      const quantity = parseInt(m[2])
      const gross = normalizeNumber(m[3])

      const vatRate = detectVatRateForItem(title, uniqueVatRates)
      const net =
        vatRate != null ? +(gross / (1 + vatRate / 100)).toFixed(2) : null

      items.push({
        title,
        quantity,
        gross,
        net,
        vatRate
      })
    }
  }

  // Gesamtbetrag
  const totalRegex = /(Gesamt|Summe|Total|Brutto)\s*[:\-]?\s*([\d.,]+\s?€?)/
  const totalLine = lines.find((l) => totalRegex.test(l)) ?? ""
  const totalMatch = totalLine.match(totalRegex)
  const total = totalMatch ? normalizeNumber(totalMatch[2]) : null

  // Datum
  const dateRegex = /(\d{2}\.\d{2}\.\d{4})/
  const dateMatch = text.match(dateRegex)
  const date = dateMatch ? dateMatch[1] : ""

  // Uhrzeit
  const timeRegex = /(\d{2}:\d{2})/
  const timeMatch = text.match(timeRegex)
  const time = timeMatch ? timeMatch[1] : ""

  // Zahlungsart
  const paymentRegex =
    /(EC[- ]?Karte|Girocard|Barzahlung|Bar|Cash|Kreditkarte|Visa|Mastercard|AMEX|PayPal|Apple Pay|Google Pay)/i
  const paymentMatch = text.match(paymentRegex)
  const paymentMethod = paymentMatch ? paymentMatch[1] : null

  // Filiale / Markt
  const storeRegex = /(Filiale|Markt|Store)\s+(\d+)/i
  const storeMatch = text.match(storeRegex)
  const store = storeMatch ? `${storeMatch[1]} ${storeMatch[2]}` : null

  // Bon‑Nummer
  const receiptNumberRegex =
    /(Bon[- ]?Nr\.?|Belegnummer|Transaktion|Beleg)\s*[:\-]?\s*([A-Za-z0-9]+)/i
  const receiptNumberMatch = text.match(receiptNumberRegex)
  const receiptNumber = receiptNumberMatch ? receiptNumberMatch[2] : null

  return {
    companyName,
    street,
    zip,
    city,
    items,
    vatRates: uniqueVatRates,
    vatDetails,
    total,
    date,
    time,
    paymentMethod,
    store,
    receiptNumber,
    raw: text
  }
}
