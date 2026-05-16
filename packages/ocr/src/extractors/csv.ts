export function parseDelimitedRows(text: string): string[][] {
  const delimiter = text.includes(";") ? ";" : ","
  const rows: string[][] = []
  let current = ""
  let row: string[] = []
  let quoted = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    const next = text[index + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      index++
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === delimiter && !quoted) {
      row.push(current.trim())
      current = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (current || row.length) {
        row.push(current.trim())
        rows.push(row)
      }
      current = ""
      row = []
      continue
    }

    current += char
  }

  if (current || row.length) {
    row.push(current.trim())
    rows.push(row)
  }

  return rows.filter((item) => item.some(Boolean))
}

export function normalizeHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]/g, "")
}
