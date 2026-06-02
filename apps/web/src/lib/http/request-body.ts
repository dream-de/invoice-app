export const DEFAULT_JSON_BODY_LIMIT_BYTES = 64 * 1024

type InvalidJsonMode = "fallback" | "throw"

type ReadJsonBodyOptions = {
  maxBytes?: number
  fallback?: unknown
  invalidJson?: InvalidJsonMode
}

export class RequestBodyError extends Error {
  code: "body_too_large" | "invalid_json"
  status: 400 | 413

  constructor(code: RequestBodyError["code"], message: string, status: RequestBodyError["status"]) {
    super(message)
    this.name = "RequestBodyError"
    this.code = code
    this.status = status
  }
}

function contentLength(request: Request) {
  const value = request.headers.get("content-length")
  if (!value) return null

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export async function readJsonBodyWithLimit<T = unknown>(
  request: Request,
  options: ReadJsonBodyOptions = {}
): Promise<T> {
  const maxBytes = options.maxBytes ?? DEFAULT_JSON_BODY_LIMIT_BYTES
  const fallback = options.fallback ?? {}

  const declaredLength = contentLength(request)
  if (declaredLength !== null && declaredLength > maxBytes) {
    throw new RequestBodyError("body_too_large", "Anfrage ist zu gross.", 413)
  }

  const raw = await request.text()
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new RequestBodyError("body_too_large", "Anfrage ist zu gross.", 413)
  }

  if (!raw.trim()) return fallback as T

  try {
    return JSON.parse(raw) as T
  } catch {
    if (options.invalidJson === "throw") {
      throw new RequestBodyError("invalid_json", "Ungueltige Anfrage.", 400)
    }

    return fallback as T
  }
}
