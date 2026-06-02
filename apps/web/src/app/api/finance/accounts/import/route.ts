import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { isDemoMode } from "@/lib/demo-mode"
import { ImportUploadError, readImportFile } from "@/lib/import/upload"

type BankImportRow = Record<string, string>

type BankTransactionPreview = {
  date: string
  description: string
  counterparty: string
  iban: string
  amount: number
  currency: string
}

const BANK_IMPORT_KINDS = ["text", "csv"] as const

function errorResponse(error: unknown) {
  if (error instanceof ImportUploadError) {
    return NextResponse.json(
      { ok: false, message: error.message, error: error.message, code: error.code },
      { status: error.status }
    )
  }

  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, message: mapped.error, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

async function requireBankImportPermission() {
  if (isDemoMode() || !process.env.DATABASE_URL) return

  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "finance", "view")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diesen Import.", 403)
  }
}

const headerAliases = {
  date: ["date", "datum", "buchungstag", "valuta", "wertstellung", "booking date"],
  description: ["description", "beschreibung", "verwendungszweck", "purpose", "text", "buchungstext"],
  counterparty: ["counterparty", "name", "empfaenger", "empfänger", "auftraggeber", "beguenstigter", "begünstigter"],
  iban: ["iban", "konto", "kontonummer"],
  amount: ["amount", "betrag", "umsatz", "wert"],
  currency: ["currency", "waehrung", "währung"]
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ")
}

function detectDelimiter(line: string) {
  const candidates = [";", ",", "\t"]
  return candidates.sort((a, b) => line.split(b).length - line.split(a).length)[0]
}

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = []
  const quote = String.fromCharCode(34)
  let current = ""
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === quote && quoted && next === quote) {
      current += quote
      index += 1
      continue
    }

    if (char === quote) {
      quoted = !quoted
      continue
    }

    if (char === delimiter && !quoted) {
      cells.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function parseCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return []

  const delimiter = detectDelimiter(lines[0])
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader)

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line, delimiter)
    return headers.reduce<BankImportRow>((row, header, index) => {
      row[header] = String(cells[index] ?? "").trim()
      return row
    }, {})
  })
}

function valueFor(row: BankImportRow, key: keyof typeof headerAliases) {
  const aliases = headerAliases[key]
  const foundKey = aliases.find((alias) => row[normalizeHeader(alias)] !== undefined)
  return foundKey ? String(row[normalizeHeader(foundKey)] ?? "").trim() : ""
}

function normalizeAmount(value: string) {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "")

  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

export async function POST(request: Request) {
  try {
    await requireBankImportPermission()
    const { file } = await readImportFile(request, { allowedKinds: [...BANK_IMPORT_KINDS] })
    const text = new TextDecoder("utf-8").decode(await file.arrayBuffer())
    const rows = parseCsv(text)
  const warnings: string[] = []

  const transactions = rows.map<BankTransactionPreview>((row, index) => {
    const amount = normalizeAmount(valueFor(row, "amount"))
    const description = valueFor(row, "description")
    const date = valueFor(row, "date")

    if (!date) warnings.push("Zeile " + (index + 2) + ": Datum fehlt.")
    if (!description) warnings.push("Zeile " + (index + 2) + ": Beschreibung fehlt.")

    return {
      date,
      description,
      counterparty: valueFor(row, "counterparty"),
      iban: valueFor(row, "iban"),
      amount,
      currency: valueFor(row, "currency") || "EUR"
    }
  })

    return NextResponse.json({
      ok: true,
      mode: "preview",
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      imported: transactions.length,
      totalAmount: transactions.reduce((sum, transaction) => sum + transaction.amount, 0),
      transactions,
      warnings,
      message: "Bankdatei wurde ausgelesen."
    })
  } catch (error) {
    const mapped = errorResponse(error)
    if (mapped) return mapped

    console.error("Bank import failed.", error)
    return NextResponse.json(
      { ok: false, message: "Bankimport konnte nicht verarbeitet werden.", error: "Bankimport konnte nicht verarbeitet werden." },
      { status: 500 }
    )
  }
}
