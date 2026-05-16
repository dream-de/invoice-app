export type HealthStatus = {
  status: "ok"
  service: string
  timestamp: string
}

export function getHealthStatus(): HealthStatus {
  return {
    status: "ok",
    service: "invoice-platform-server",
    timestamp: new Date().toISOString()
  }
}
