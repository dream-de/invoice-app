import type { ModuleEngineContext } from "@/lib/modules/moduleEngine"
import type { ModulePlan } from "@/lib/modules/appRegistry"

export type IntegrationStatus = "available" | "installed" | "configured" | "connected" | "error" | "disabled"
export type IntegrationMarketplaceStatus = "locked" | "available" | "installed" | "configured" | "connected" | "error"
export type IntegrationMarketplaceAction = "Upgrade" | "Installieren" | "Konfigurieren" | "Verbinden" | "Synchronisieren" | "Fehler prüfen"
export type IntegrationAuthType = "oauth" | "api_key" | "basic" | "token" | "none"
export type IntegrationCategory = "Finanzen" | "Commerce" | "Cloud" | "Kommunikation" | "KI"

export type IntegrationDefinition = {
  key: string
  name: string
  category: IntegrationCategory
  description: string
  iconKey: string
  marketplaceModuleKey: string
  requiredFeatureFlag?: string
  requiredPlan: ModulePlan
  authType: IntegrationAuthType
  status: IntegrationStatus
  syncSupported: boolean
  webhookSupported: boolean
  settingsRoute: string
  logsRoute: string
}

export type IntegrationContext = {
  moduleContext: ModuleEngineContext
  installedIntegrations: string[]
  configuredIntegrations: string[]
  connectedIntegrations: string[]
  disabledIntegrations?: string[]
  errorIntegrations?: string[]
  lastSyncByKey?: Record<string, string>
}

export type IntegrationSyncResult = {
  key: string
  ok: boolean
  status: IntegrationStatus
  startedAt: string
  finishedAt: string
  recordsProcessed: number
  message: string
}

export type IntegrationLogEvent = {
  id: string
  integrationKey: string
  event:
    | "integration_installed"
    | "integration_configured"
    | "integration_connected"
    | "integration_disconnected"
    | "integration_sync_started"
    | "integration_sync_success"
    | "integration_sync_failed"
    | "integration_test_success"
    | "integration_test_failed"
    | "marketplace_module_installed"
    | "marketplace_module_uninstalled"
  level: "info" | "warning" | "error"
  message: string
  createdAt: string
  meta?: Record<string, string | number | boolean>
}
