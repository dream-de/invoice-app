export type HealthStatus = {
  status: "ok"
  service: string
  timestamp: string
}

export function getHealthStatus(): HealthStatus {
  return {
    status: "ok",
    service: "dream-invoice-server",
    timestamp: new Date().toISOString()
  }
}
