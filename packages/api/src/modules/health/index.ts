import { ok } from "../../core/response"

export function healthCheck() {
  return ok({
    status: "ok",
    service: "dream-invoice-api",
    timestamp: new Date().toISOString()
  })
}
