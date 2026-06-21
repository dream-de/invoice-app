import { prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"
import { createCsvContentDisposition, createCsvResponse } from "@/lib/export/csv-response"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ExportFormat = "csv" | "xls" | "xml" | "json" | "pdf" | "print"

type ExportRow = {
  id: string
  date: string
  user: string
  customer: string
  project: string
  activity: string
  description: string
  duration: number
  rate: number
  amount: number
  billable: boolean
  billingStatus: string
}

const header = ["Datum", "Benutzer", "Kunde", "Projekt", "Tätigkeit", "Beschreibung", "Dauer", "Stundensatz", "Gesamtpreis", "Abrechenbar", "Status"]

function demoRows(): ExportRow[] {
  return [
    { id: "demo-time-1", date: "2026-06-01", user: "admin", customer: "Mustermann GmbH", project: "YouTube Kanal", activity: "Erstellung YouTube Videos", description: "Video-Konzept und Schnitt", duration: 5, rate: 0, amount: 0, billable: true, billingStatus: "not_invoiced" },
    { id: "demo-time-2", date: "2026-06-01", user: "admin", customer: "Mustermann GmbH", project: "YouTube Kanal", activity: "Erstellung YouTube Videos", description: "Kurze Nacharbeit", duration: 0.02, rate: 0, amount: 0, billable: true, billingStatus: "not_invoiced" },
    { id: "demo-time-3", date: "2026-06-01", user: "admin", customer: "Mustermann GmbH", project: "Konfiguration UniFi Netzwerk", activity: "Kundengespräch", description: "Abstimmung", duration: 8, rate: 0, amount: 0, billable: true, billingStatus: "not_invoiced" }
  ]
}

function formatMoney(value: number) {
  return value.toFixed(2).replace(".", ",") + " €"
}

function formatHours(value: number) {
  const hours = Math.floor(value)
  const minutes = Math.round((value - hours) * 60)
  return `${hours}:${String(minutes).padStart(2, "0")}`
}

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function htmlEscape(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function rowsToTable(rows: ExportRow[]) {
  return rows.map((row) => [
    row.date,
    row.user,
    row.customer,
    row.project,
    row.activity,
    row.description,
    formatHours(row.duration),
    formatMoney(row.rate),
    formatMoney(row.amount),
    row.billable ? "Ja" : "Nein",
    row.billingStatus === "exported" ? "Exportiert" : row.billingStatus === "invoiced" ? "Fakturiert" : "Offen"
  ])
}

async function loadRows() {
  if (isDemoMode() || !process.env.DATABASE_URL) return demoRows()

  const entries = await prisma.timeEntry.findMany({
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    take: 500,
    include: {
      project: { include: { customer: true } },
      article: true
    }
  })

  return entries.map((entry): ExportRow => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    user: "admin",
    customer: entry.project?.customer?.name ?? "Ohne Kunde",
    project: entry.project?.name ?? entry.projectName,
    activity: entry.article?.name ?? entry.task,
    description: entry.task,
    duration: Number(entry.hours ?? 0),
    rate: Number(entry.rate ?? 0),
    amount: Number(entry.amount ?? 0),
    billable: entry.status === "billable",
    billingStatus: entry.billingStatus
  }))
}

function excelResponse(rows: ExportRow[]) {
  const body = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${header.map((cell) => `<th>${htmlEscape(cell)}</th>`).join("")}</tr></thead><tbody>${rowsToTable(rows).map((row) => `<tr>${row.map((cell) => `<td>${htmlEscape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`
  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": createCsvContentDisposition("zeiterfassung-export.xls"),
      "Cache-Control": "no-store"
    }
  })
}

function xmlResponse(rows: ExportRow[]) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<zeiterfassung-export generatedAt="${new Date().toISOString()}">\n${rows.map((row) => `  <eintrag id="${escapeXml(row.id)}">\n    <datum>${escapeXml(row.date)}</datum>\n    <benutzer>${escapeXml(row.user)}</benutzer>\n    <kunde>${escapeXml(row.customer)}</kunde>\n    <projekt>${escapeXml(row.project)}</projekt>\n    <taetigkeit>${escapeXml(row.activity)}</taetigkeit>\n    <beschreibung>${escapeXml(row.description)}</beschreibung>\n    <dauer>${escapeXml(formatHours(row.duration))}</dauer>\n    <stundensatz>${escapeXml(row.rate.toFixed(2))}</stundensatz>\n    <gesamtpreis>${escapeXml(row.amount.toFixed(2))}</gesamtpreis>\n    <abrechenbar>${row.billable ? "true" : "false"}</abrechenbar>\n    <status>${escapeXml(row.billingStatus)}</status>\n  </eintrag>`).join("\n")}\n</zeiterfassung-export>\n`
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": createCsvContentDisposition("zeiterfassung-export.xml"),
      "Cache-Control": "no-store"
    }
  })
}

function jsonResponse(rows: ExportRow[]) {
  return new Response(JSON.stringify({ ok: true, exportedAt: new Date().toISOString(), entries: rows }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": createCsvContentDisposition("zeiterfassung-export.json"),
      "Cache-Control": "no-store"
    }
  })
}

function printResponse(rows: ExportRow[]) {
  const totalHours = rows.reduce((sum, row) => sum + row.duration, 0)
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0)
  const body = `<!doctype html><html><head><meta charset="utf-8" /><title>Zeiterfassung Export</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#333}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#f5f5f5}.summary{display:flex;gap:24px;font-weight:700}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Drucken</button><h1>Zeiterfassung Export</h1><div class="summary"><span>Dauer: ${htmlEscape(formatHours(totalHours))}</span><span>Gesamtpreis: ${htmlEscape(formatMoney(totalAmount))}</span></div><table><thead><tr>${header.map((cell) => `<th>${htmlEscape(cell)}</th>`).join("")}</tr></thead><tbody>${rowsToTable(rows).map((row) => `<tr>${row.map((cell) => `<td>${htmlEscape(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.addEventListener("load",()=>setTimeout(()=>window.print(),250));</script></body></html>`
  return new Response(body, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  })
}

function pdfEscape(value: unknown) {
  return String(value ?? "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/[^\x20-\x7E]/g, "?")
}

function pdfResponse(rows: ExportRow[]) {
  const lines = [
    "Zeiterfassung Export",
    "Erstellt am " + new Date().toLocaleString("de-DE"),
    "Dauer gesamt: " + formatHours(rows.reduce((sum, row) => sum + row.duration, 0)),
    "",
    ...rows.flatMap((row) => [
      `${row.date}  ${row.customer}  ${row.project}`,
      `${row.activity}  ${formatHours(row.duration)}  ${formatMoney(row.amount)}`,
      ""
    ])
  ].slice(0, 42)
  const text = lines.map((line, index) => `BT /F1 11 Tf 50 ${790 - index * 17} Td (${pdfEscape(line)}) Tj ET`).join("\n")
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(text, "utf8")} >> stream\n${text}\nendstream endobj`
  ]
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"))
    pdf += object + "\n"
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8")
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets.slice(1).map((offset) => String(offset).padStart(10, "0") + " 00000 n ").join("\n") + "\n"
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return new Response(Buffer.from(pdf, "utf8"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": createCsvContentDisposition("zeiterfassung-export.pdf"),
      "Cache-Control": "no-store"
    }
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const format = (url.searchParams.get("format") || "csv").toLowerCase() as ExportFormat
  const rows = await loadRows()

  if (format === "csv") return createCsvResponse([header, ...rowsToTable(rows)], "zeiterfassung-export.csv")
  if (format === "xls") return excelResponse(rows)
  if (format === "xml") return xmlResponse(rows)
  if (format === "json") return jsonResponse(rows)
  if (format === "pdf") return pdfResponse(rows)
  if (format === "print") return printResponse(rows)

  return new Response("Unbekanntes Exportformat.", { status: 400 })
}

export async function POST() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return Response.json({ ok: true, marked: demoRows().length, mode: "demo" })
  }

  const result = await prisma.timeEntry.updateMany({
    where: { billingStatus: "not_invoiced" },
    data: { billingStatus: "exported" }
  })

  return Response.json({ ok: true, marked: result.count })
}
