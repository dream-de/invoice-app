import { getModuleByKey, type ModulePlan } from "@/lib/modules/appRegistry"
import { isExtensionInstalled, isFeatureEnabled, isPlanAllowed } from "@/lib/modules/moduleEngine"
import { integrationRegistry } from "./integrationRegistry"
import type { IntegrationCategory, IntegrationContext, IntegrationDefinition, IntegrationMarketplaceAction, IntegrationMarketplaceStatus, IntegrationStatus } from "./types"

const planRank: Record<ModulePlan, number> = {
  free: 0,
  business: 1,
  enterprise: 2
}

function isRequiredPlanAllowed(requiredPlan: ModulePlan, currentPlan: ModulePlan) {
  return planRank[currentPlan] >= planRank[requiredPlan]
}

function hasFeatureFlag(integration: IntegrationDefinition, context: IntegrationContext) {
  return integration.requiredFeatureFlag ? context.moduleContext.featureFlags[integration.requiredFeatureFlag] === true : false
}

function hasMarketplaceAccess(integration: IntegrationDefinition, context: IntegrationContext) {
  const module = getModuleByKey(integration.marketplaceModuleKey)
  if (!module) return false

  return isExtensionInstalled(module, context.moduleContext.installedExtensions) || isFeatureEnabled(module, context.moduleContext.featureFlags) || isPlanAllowed(module, context.moduleContext.plan)
}

function canAccessIntegration(integration: IntegrationDefinition, context: IntegrationContext) {
  return hasMarketplaceAccess(integration, context) || hasFeatureFlag(integration, context) || isRequiredPlanAllowed(integration.requiredPlan, context.moduleContext.plan)
}

function marketplaceModuleInstalled(integration: IntegrationDefinition, context: IntegrationContext) {
  return context.moduleContext.installedExtensions.includes(integration.marketplaceModuleKey) || context.installedIntegrations.includes(integration.key) || context.installedIntegrations.includes(integration.marketplaceModuleKey)
}

export function getIntegrationByKey(key: string) {
  return integrationRegistry.find((integration) => integration.key === key)
}

export function getIntegrationsByCategory(category: IntegrationCategory) {
  return integrationRegistry.filter((integration) => integration.category === category)
}

export function getIntegrationStatus(key: string, context: IntegrationContext): IntegrationStatus {
  const integration = getIntegrationByKey(key)
  if (!integration || !canAccessIntegration(integration, context)) return "disabled"
  if (context.disabledIntegrations?.includes(key)) return "disabled"
  if (context.errorIntegrations?.includes(key)) return "error"
  if (context.connectedIntegrations.includes(key)) return "connected"
  if (context.configuredIntegrations.includes(key)) return "configured"
  if (context.installedIntegrations.includes(key)) return "installed"
  return integration.status
}

export function getIntegrationMarketplaceStatus(integrationKey: string, context: IntegrationContext): { status: IntegrationMarketplaceStatus; button: IntegrationMarketplaceAction } {
  const integration = getIntegrationByKey(integrationKey)
  if (!integration || !canAccessIntegration(integration, context)) {
    return { status: "locked", button: "Upgrade" }
  }

  if (context.errorIntegrations?.includes(integration.key)) {
    return { status: "error", button: "Fehler prüfen" }
  }

  if (context.connectedIntegrations.includes(integration.key)) {
    return { status: "connected", button: "Synchronisieren" }
  }

  if (context.configuredIntegrations.includes(integration.key)) {
    return { status: "configured", button: "Verbinden" }
  }

  if (marketplaceModuleInstalled(integration, context)) {
    return { status: "installed", button: "Konfigurieren" }
  }

  return { status: "available", button: "Installieren" }
}

export function getAvailableIntegrations(context: IntegrationContext) {
  return integrationRegistry.filter((integration) => canAccessIntegration(integration, context))
}

export function getInstalledIntegrations(context: IntegrationContext) {
  return getAvailableIntegrations(context).filter((integration) => {
    const status = getIntegrationStatus(integration.key, context)
    return status === "installed" || status === "configured" || status === "connected" || status === "error"
  })
}

export function getConnectedIntegrations(context: IntegrationContext) {
  return getAvailableIntegrations(context).filter((integration) => getIntegrationStatus(integration.key, context) === "connected")
}

export function canConfigureIntegration(key: string, context: IntegrationContext) {
  const { status } = getIntegrationMarketplaceStatus(key, context)
  return status === "available" || status === "installed" || status === "configured" || status === "error"
}

export function canSyncIntegration(key: string, context: IntegrationContext) {
  const integration = getIntegrationByKey(key)
  if (!integration?.syncSupported) return false
  return getIntegrationMarketplaceStatus(key, context).status === "connected"
}
