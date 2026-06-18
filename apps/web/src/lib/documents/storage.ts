import { dirname, extname, join } from "node:path"

const configuredReceiptUploadDir = process.env.DREAM_INVOICE_UPLOAD_DIR
const DEFAULT_DOCUMENT_UPLOAD_DIR = process.env.DREAM_INVOICE_DOCUMENT_UPLOAD_DIR
  || (configuredReceiptUploadDir ? join(dirname(configuredReceiptUploadDir), "documents") : join(/* turbopackIgnore: true */ process.cwd(), "data", "uploads", "documents"))

const MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png"
}

function safeName(value: string) {
  return value
    .replace(/[\\/]+/g, " ")
    .replace(/[^A-Za-z0-9._ -]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+/g, ".")
    .trim()
    .slice(0, 140)
}

export function documentStorageRoot() {
  return DEFAULT_DOCUMENT_UPLOAD_DIR
}

export function documentFileExtension(file: File) {
  const byName = extname(file.name).toLowerCase()
  if ([".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg"].includes(byName)) return byName
  return MIME_TO_EXTENSION[file.type.toLowerCase()] || ""
}

export function documentStorageFileName(id: string, file: File) {
  return `${id}${documentFileExtension(file) || ".bin"}`
}

export function documentStoragePath(id: string, file: File) {
  return join(documentStorageRoot(), documentStorageFileName(id, file))
}

export function documentAbsolutePath(storagePath: string) {
  return join(documentStorageRoot(), storagePath)
}

export function documentDownloadName(originalName: string) {
  return safeName(originalName) || "dokument.pdf"
}

export function isAllowedBusinessDocument(file: File) {
  const extension = documentFileExtension(file)
  return [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg"].includes(extension)
}
