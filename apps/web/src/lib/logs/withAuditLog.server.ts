import type { LogLevel, LogModule } from "@/lib/logs/types"
import { writeApiLog } from "@/lib/logs/auditWriter.server"

export interface ApiAuditLogOptions {
  module: LogModule | string
  title?: string
  description?: string
  successLevel?: LogLevel
  errorLevel?: LogLevel
}

export type ApiRouteHandler<TContext = unknown> = (request: Request, context: TContext) => Promise<Response> | Response

function statusLevel(status: number, fallback: LogLevel): LogLevel {
  if (status >= 500) return "error"
  if (status >= 400) return "warning"
  if (status >= 200 && status < 300) return "success"
  return fallback
}

function titleFromRequest(request: Request, options: ApiAuditLogOptions) {
  if (options.title) return options.title
  const url = new URL(request.url)
  return `${request.method} ${url.pathname}`
}

export function withApiAuditLog<TContext = unknown>(handler: ApiRouteHandler<TContext>, options: ApiAuditLogOptions): ApiRouteHandler<TContext> {
  return async function auditedHandler(request: Request, context: TContext) {
    const startedAt = Date.now()

    try {
      const response = await handler(request, context)
      const duration = Date.now() - startedAt
      await writeApiLog({
        request,
        module: options.module,
        level: statusLevel(response.status, options.successLevel ?? "info"),
        title: titleFromRequest(request, options),
        description: options.description ?? `API-Aufruf abgeschlossen mit Status ${response.status}.`,
        metadata: { status: response.status, duration },
        tags: ["api"]
      })
      return response
    } catch (error) {
      const duration = Date.now() - startedAt
      await writeApiLog({
        request,
        module: options.module,
        level: options.errorLevel ?? "error",
        title: titleFromRequest(request, options),
        description: error instanceof Error ? error.message : "API-Aufruf fehlgeschlagen.",
        metadata: { duration, errorName: error instanceof Error ? error.name : "UnknownError" },
        tags: ["api", "error"]
      })
      throw error
    }
  }
}
