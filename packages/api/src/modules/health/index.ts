import { ok } from "../../core/response"

export function healthCheck() {
  return ok({
    status: "ok",
    service: "invoice-platform-api",
    timestamp: new Date().toISOString()
  })
}
