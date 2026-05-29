import { prisma } from "@dream-invoice/database"
import { NextResponse } from "next/server"
import { isDemoMode } from "@/lib/demo-mode"

type CustomerImportRow = Record<string, string>

type CustomerImportData = {
  number: string
  name: string
  contact: string
  email: string
  phone: string
  street: string
  zip: string
  city: string
  country: string
  notes: string
  status: string
}

const headerAliases: Record<keyof CustomerImportData, string[]> = {
  number: ["number", "nummer", "kundennummer", "kunden-nr", "kunden nr", "customer number"],
  name: ["name", "firma", "kunde", "kundenname", "company", "customer"],
  contact: ["contact", "kontakt", "ansprechpartner", "ansprechperson"],
  email: ["email", "e-mail", "mail", "emailadresse"],
  phone: ["phone", "telefon", "tel", "mobile", "handy"],
  street: ["street", "strasse", "straße", "adresse", "address"],
  zip: ["zip", "plz", "postal code", "postcode"],
  city: ["city", "stadt", "ort"],
  country: ["country", "land"],
  notes: ["notes", "notizen", "notiz", "bemerkung", "bemerkungen"],
  status: ["status"]
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ")
}

function csvCellValue(value: string | undefined) {
  return String(value ?? "").trim()
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
    return headers.reduce<CustomerImportRow>((row, header, index) => {
      row[header] = csvCellValue(cells[index])
      return row
    }, {})
  })
}

function valueFor(row: CustomerImportRow, key: keyof CustomerImportData) {
  const aliases = headerAliases[key]
  const foundKey = aliases.find((alias) => row[normalizeHeader(alias)] !== undefined)
  return foundKey ? csvCellValue(row[normalizeHeader(foundKey)]) : ""
}

function normalizeStatus(value: string) {
  const status = value.trim().toLowerCase()
  if (["inactive", "inaktiv", "archiv", "archived"].includes(status)) return "inactive"
  if (["open", "offen"].includes(status)) return "open"
  return "active"
}

function customerDataFromRow(row: CustomerImportRow, fallbackNumber: string): CustomerImportData {
  return {
    number: valueFor(row, "number") || fallbackNumber,
    name: valueFor(row, "name"),
    contact: valueFor(row, "contact"),
    email: valueFor(row, "email"),
    phone: valueFor(row, "phone"),
    street: valueFor(row, "street"),
    zip: valueFor(row, "zip"),
    city: valueFor(row, "city"),
    country: valueFor(row, "country") || "Deutschland",
    notes: valueFor(row, "notes"),
    status: normalizeStatus(valueFor(row, "status"))
  }
}

function generatedCustomerNumber(count: number, offset: number) {
  return "KD-" + String(count + offset).padStart(4, "0")
}

function buildPreview(rows: CustomerImportRow[], startCount: number) {
  const warnings: string[] = []
  const preview: CustomerImportData[] = []
  let numberOffset = 1
  let skipped = 0

  for (const [index, row] of rows.entries()) {
    const fallbackNumber = generatedCustomerNumber(startCount, numberOffset)
    const data = customerDataFromRow(row, fallbackNumber)

    if (!valueFor(row, "number")) numberOffset += 1

    if (!data.name) {
      skipped += 1
      warnings.push("Zeile " + (index + 2) + ": Kunde ohne Namen wurde uebersprungen.")
      continue
    }

    preview.push(data)
  }

  return { preview, skipped, warnings }
}

function importResponse({
  save,
  file,
  preview,
  created,
  updated,
  skipped,
  warnings,
  mode
}: {
  save: boolean
  file: File
  preview: CustomerImportData[]
  created: number
  updated: number
  skipped: number
  warnings: string[]
  mode?: string
}) {
  return NextResponse.json({
    ok: true,
    mode: mode || (save ? "saved" : "preview"),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    imported: preview.length,
    created,
    updated,
    skipped,
    customers: preview,
    warnings,
    message: save ? "Kunden wurden importiert." : "Kunden wurden ausgelesen."
  })
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")
  const save = formData.get("save") === "true"

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "Keine Datei erhalten." },
      { status: 400 }
    )
  }

  const text = new TextDecoder("utf-8").decode(await file.arrayBuffer())
  const rows = parseCsv(text)

  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Die CSV-Datei enthaelt keine importierbaren Zeilen." },
      { status: 400 }
    )
  }

  if (isDemoMode() || !process.env.DATABASE_URL) {
    const { preview, skipped, warnings } = buildPreview(rows, 0)
    return importResponse({
      save,
      file,
      preview,
      created: save ? preview.length : 0,
      updated: 0,
      skipped,
      warnings,
      mode: save ? "demo" : "preview"
    })
  }

  try {
    const count = await prisma.customer.count()
    const { preview, skipped, warnings } = buildPreview(rows, count)
    let created = 0
    let updated = 0

    if (save) {
      for (const data of preview) {
        const existing = await prisma.customer.findFirst({
          where: {
            OR: [
              { number: data.number },
              ...(data.email ? [{ email: data.email }] : []),
              { name: data.name }
            ]
          }
        })

        const payload = {
          name: data.name,
          contact: data.contact || null,
          email: data.email || null,
          phone: data.phone || null,
          street: data.street || null,
          zip: data.zip || null,
          city: data.city || null,
          country: data.country,
          notes: data.notes || null,
          status: data.status
        }

        if (existing) {
          await prisma.customer.update({
            where: { id: existing.id },
            data: payload
          })
          updated += 1
        } else {
          await prisma.customer.create({
            data: {
              number: data.number,
              ...payload
            }
          })
          created += 1
        }
      }
    }

    return importResponse({
      save,
      file,
      preview,
      created,
      updated,
      skipped,
      warnings
    })
  } catch (error) {
    console.error(error)
    const { preview, skipped, warnings } = buildPreview(rows, 0)
    return importResponse({
      save,
      file,
      preview,
      created: save ? preview.length : 0,
      updated: 0,
      skipped,
      warnings,
      mode: save ? "demo" : "preview"
    })
  }
}
