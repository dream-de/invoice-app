import type { LogModule } from "@/lib/logs/types"
import { writeErrorLog } from "@/lib/logs/auditWriter.server"

export interface NormalizedServerError {
  name: string
  message: string
  stack: string | null
}

export interface ServerErrorContext {
  module?: LogModule | string
  request?: Request
  endpoint?: string | null
  requestId?: string | null
  actorId?: string | null
  actorEmail?: string | null
  metadata?: Record<string, unknown>
}

export function normalizeError(error: unknown): NormalizedServerError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ? error.stack.slice(0, 4000) : null
    }
  }

  return {
    name: "UnknownError",
    message: typeof error === "string" ? error : "Unbekannter Serverfehler",
    stack: null
  }
}

export async function logServerError(error: unknown, context: ServerErrorContext = {}) {
  const normalized = normalizeError(error)

  return writeErrorLog({
    request: context.request,
    module: context.module ?? "system",
    actorId: context.actorId ?? null,
    actorEmail: context.actorEmail ?? null,
    title: `Serverfehler: ${normalized.name}`,
    description: normalized.message,
    metadata: {
      ...(context.metadata ?? {}),
      endpoint: context.endpoint ?? null,
      requestId: context.requestId ?? null,
      stack: normalized.stack
    },
    tags: ["server-error"]
  })
}
