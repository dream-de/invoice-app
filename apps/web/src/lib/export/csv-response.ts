function csvCell(value: unknown) {
  const raw = String(value ?? "")
  const text = /^[=+@-]/.test(raw) ? "'" + raw : raw
  return "\"" + text.replace(/"/g, "\"\"") + "\""
}

function asciiFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "export.csv"
}

export function createCsvContent(rows: unknown[][]) {
  return rows.map((row) => row.map(csvCell).join(";")).join("\n")
}

export function createCsvContentDisposition(fileName: string) {
  const fallbackName = asciiFileName(fileName).replace(/"/g, "")
  return "attachment; filename=\"" + fallbackName + "\"; filename*=UTF-8''" + encodeURIComponent(fileName)
}

export function createCsvResponse(rows: unknown[][], fileName: string) {
  return new Response("\uFEFF" + createCsvContent(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": createCsvContentDisposition(fileName),
      "Cache-Control": "no-store"
    }
  })
}
