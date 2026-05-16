export async function fileToText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const decoder = new TextDecoder("utf-8")
  return decoder.decode(buffer)
}

export function normalizeText(value: string): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim()
}
