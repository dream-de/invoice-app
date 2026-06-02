export const DEFAULT_IMPORT_FILE_MAX_BYTES = 8 * 1024 * 1024

const FORM_DATA_OVERHEAD_BYTES = 512 * 1024
const MAX_IMPORT_FILE_BYTES = 50 * 1024 * 1024

export type ImportFileKind = "text" | "csv" | "pdf" | "image"

type ReadImportFileOptions = {
  allowedKinds: ImportFileKind[]
  maxBytes?: number
}

export class ImportUploadError extends Error {
  code: "missing_file" | "file_too_large" | "unsupported_file_type" | "invalid_form_data"
  status: 400 | 413 | 415

  constructor(code: ImportUploadError["code"], message: string, status: ImportUploadError["status"]) {
    super(message)
    this.name = "ImportUploadError"
    this.code = code
    this.status = status
  }
}

function configuredMaxBytes() {
  const configured = Number(process.env.IMPORT_FILE_MAX_BYTES)

  if (Number.isFinite(configured) && configured > 0) {
    return Math.min(configured, MAX_IMPORT_FILE_BYTES)
  }

  return DEFAULT_IMPORT_FILE_MAX_BYTES
}

function contentLength(request: Request) {
  const value = request.headers.get("content-length")
  if (!value) return null

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function lowerName(file: File) {
  return file.name.toLowerCase()
}

function fileKind(file: File): ImportFileKind | null {
  const name = lowerName(file)
  const type = file.type.toLowerCase()

  if (type === "application/pdf" || name.endsWith(".pdf")) return "pdf"
  if (type.includes("csv") || name.endsWith(".csv")) return "csv"
  if (type.startsWith("text/") || name.endsWith(".txt")) return "text"
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|tiff?|bmp)$/i.test(name)) return "image"

  return null
}

export function isAllowedImportFile(file: File, allowedKinds: ImportFileKind[]) {
  const kind = fileKind(file)
  return kind !== null && allowedKinds.includes(kind)
}

export async function readImportFile(request: Request, options: ReadImportFileOptions) {
  const maxBytes = options.maxBytes ?? configuredMaxBytes()
  const declaredLength = contentLength(request)

  if (declaredLength !== null && declaredLength > maxBytes + FORM_DATA_OVERHEAD_BYTES) {
    throw new ImportUploadError("file_too_large", "Die Datei ist zu gross.", 413)
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    throw new ImportUploadError("invalid_form_data", "Upload konnte nicht gelesen werden.", 400)
  }

  const file = formData.get("file")

  if (!(file instanceof File)) {
    throw new ImportUploadError("missing_file", "Keine Datei erhalten.", 400)
  }

  if (file.size <= 0) {
    throw new ImportUploadError("missing_file", "Die Datei ist leer.", 400)
  }

  if (file.size > maxBytes) {
    throw new ImportUploadError("file_too_large", "Die Datei ist zu gross.", 413)
  }

  if (!isAllowedImportFile(file, options.allowedKinds)) {
    throw new ImportUploadError("unsupported_file_type", "Dieser Dateityp wird fuer diesen Import nicht unterstuetzt.", 415)
  }

  return { file, formData }
}
