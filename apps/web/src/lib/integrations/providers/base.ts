import type { IntegrationStatus, IntegrationSyncResult } from "../types"

export type IntegrationProviderAdapter = {
  key: string
  connect: () => Promise<{ ok: boolean; status: IntegrationStatus }>
  disconnect: () => Promise<{ ok: boolean; status: IntegrationStatus }>
  sync: () => Promise<IntegrationSyncResult>
  testConnection: () => Promise<{ ok: boolean; status: IntegrationStatus; latencyMs: number }>
  getStatus: () => Promise<IntegrationStatus>
}

export function createMockProviderAdapter(key: string): IntegrationProviderAdapter {
  return {
    key,
    async connect() {
      return { ok: true, status: "connected" }
    },
    async disconnect() {
      return { ok: true, status: "installed" }
    },
    async sync() {
      const timestamp = new Date().toISOString()
      return {
        key,
        ok: true,
        status: "connected",
        startedAt: timestamp,
        finishedAt: timestamp,
        recordsProcessed: 0,
        message: `${key} Mock-Adapter synchronisiert ohne externen API-Aufruf.`
      }
    },
    async testConnection() {
      return { ok: true, status: "connected", latencyMs: 25 }
    },
    async getStatus() {
      return "available"
    }
  }
}
