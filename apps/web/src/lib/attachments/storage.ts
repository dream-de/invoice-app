import { extname, join } from "node:path"

const DEFAULT_RECEIPT_UPLOAD_DIR = process.env.DREAM_INVOICE_UPLOAD_DIR || join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads", "receipts")

const MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
}

function safeName(value: string) {
  return value
    .replace(/[\\/]+/g, " ")
    .replace(/[^A-Za-z0-9._ -]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+/g, ".")
    .trim()
    .slice(0, 120)
}

function fileExtension(file: File) {
  const byName = extname(file.name).toLowerCase()
  if (byName && byName !== ".") return byName
  return MIME_TO_EXTENSION[file.type.toLowerCase()] || ""
}

export function attachmentStorageRoot() {
  return DEFAULT_RECEIPT_UPLOAD_DIR
}

export function attachmentStorageFileName(id: string, file: File) {
  return `${id}${fileExtension(file)}`
}

export function attachmentStoragePath(id: string, file: File) {
  return join(attachmentStorageRoot(), attachmentStorageFileName(id, file))
}

export function attachmentAbsolutePath(storagePath: string) {
  return join(attachmentStorageRoot(), storagePath)
}

export function attachmentDownloadName(originalName: string) {
  const cleaned = safeName(originalName) || "beleg"
  const lower = cleaned.toLowerCase()
  if (lower.endsWith(".pdf") || lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp")) {
    return cleaned
  }
  return `${cleaned}.pdf`
}
