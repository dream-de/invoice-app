import { createModuleGateDeniedEvent } from "@/lib/audit/auditEventFactory"
import { logAuditEvent } from "@/lib/audit/auditLogger"
import { appRegistry, type AppModule, type ModulePlan, type ModuleStatus } from "./appRegistry"

export type LicenseStatus = "active" | "expired" | "trial" | "offline"

export type ModuleEngineContext = {
  plan: ModulePlan
  installedExtensions: string[]
  featureFlags: Record<string, boolean>
  licenseStatus: LicenseStatus
  userPermissions?: string[]
}

const planRank: Record<ModulePlan, number> = {
  free: 0,
  business: 1,
  enterprise: 2
}

export type ModuleAccessResult = {
  module: AppModule | null
  visible: boolean
  usable: boolean
  reason: "allowed" | "not_found" | "not_visible" | "license_inactive" | "missing_dependencies" | "missing_permission"
  missingDependencies: string[]
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_")
}

function resolveModule(moduleOrKey: AppModule | string): AppModule | null {
  if (typeof moduleOrKey !== "string") return moduleOrKey

  return (appRegistry.find((module) => normalizeKey(module.key) === normalizeKey(moduleOrKey)) as AppModule | undefined) ?? null
}

function installedExtensionSet(installedExtensions: string[]) {
  return new Set(installedExtensions.map(normalizeKey))
}

export function isPlanAllowed(moduleOrKey: AppModule | string, currentPlan: ModulePlan) {
  const module = resolveModule(moduleOrKey)
  if (!module) return false

  return planRank[currentPlan] >= planRank[module.requiredPlan]
}

export function isFeatureEnabled(moduleOrKey: AppModule | string, featureFlags: Record<string, boolean>) {
  const module = resolveModule(moduleOrKey)
  if (!module) return false

  return module.featureFlag ? featureFlags[module.featureFlag] === true : false
}

export function isExtensionInstalled(moduleOrKey: AppModule | string, installedExtensions: string[]) {
  const module = resolveModule(moduleOrKey)
  if (!module) return false

  const installed = installedExtensionSet(installedExtensions)

  return installed.has(normalizeKey(module.key)) || installed.has(normalizeKey(module.name)) || (module.featureFlag ? installed.has(normalizeKey(module.featureFlag)) : false)
}

export function isModuleVisible(moduleOrKey: AppModule | string, context: ModuleEngineContext) {
  const module = resolveModule(moduleOrKey)
  if (!module) return false

  return (
    isPlanAllowed(module, context.plan) ||
    (module.marketplace && isExtensionInstalled(module, context.installedExtensions)) ||
    isFeatureEnabled(module, context.featureFlags) ||
    module.installedByDefault
  )
}

function hasRequiredPermission(module: AppModule, userPermissions: string[] | undefined) {
  if (!module.requiredPermission) return true
  if (!userPermissions) return false

  return userPermissions.includes(module.requiredPermission) || userPermissions.includes("*")
}

function missingDependencies(module: AppModule, context: ModuleEngineContext) {
  if (!module.dependencies?.length) return []
  const installed = installedExtensionSet(context.installedExtensions)

  return module.dependencies.filter((dependencyKey) => {
    const dependency = appRegistry.find((item) => item.key === dependencyKey)
    if (!dependency) return true

    return !isModuleVisible(dependency, context) && !installed.has(normalizeKey(dependencyKey))
  })
}

function hasMissingDependencies(module: AppModule, context: ModuleEngineContext) {
  return missingDependencies(module, context).length > 0
}

export function isModuleUsable(moduleOrKey: AppModule | string, context: ModuleEngineContext) {
  const module = resolveModule(moduleOrKey)
  if (!module) return false

  const licenseAllowsUsage = context.licenseStatus === "active" || context.licenseStatus === "trial"

  return isModuleVisible(module, context) && licenseAllowsUsage && !hasMissingDependencies(module, context) && hasRequiredPermission(module, context.userPermissions)
}

export function requireModuleAccess(moduleKey: string, context: ModuleEngineContext): ModuleAccessResult {
  const module = resolveModule(moduleKey)
  if (!module) {
    logAuditEvent(createModuleGateDeniedEvent(moduleKey, "not_found", undefined, { plan: context.plan, licenseStatus: context.licenseStatus }))
    return { module: null, visible: false, usable: false, reason: "not_found", missingDependencies: [] }
  }

  const visible = isModuleVisible(module, context)
  const missing = missingDependencies(module, context)
  const licenseAllowsUsage = context.licenseStatus === "active" || context.licenseStatus === "trial"

  if (!visible) {
    logAuditEvent(createModuleGateDeniedEvent(module.key, "not_visible", undefined, { plan: context.plan, licenseStatus: context.licenseStatus }))
    return { module, visible, usable: false, reason: "not_visible", missingDependencies: missing }
  }

  if (!licenseAllowsUsage) {
    logAuditEvent(createModuleGateDeniedEvent(module.key, "license_inactive", undefined, { plan: context.plan, licenseStatus: context.licenseStatus }))
    return { module, visible, usable: false, reason: "license_inactive", missingDependencies: missing }
  }

  if (missing.length) {
    logAuditEvent(createModuleGateDeniedEvent(module.key, "missing_dependencies", undefined, { missingDependencies: missing.join(",") }))
    return { module, visible, usable: false, reason: "missing_dependencies", missingDependencies: missing }
  }

  if (!hasRequiredPermission(module, context.userPermissions)) {
    logAuditEvent(createModuleGateDeniedEvent(module.key, "missing_permission", undefined, { requiredPermission: module.requiredPermission ?? null }))
    return { module, visible, usable: false, reason: "missing_permission", missingDependencies: missing }
  }

  return { module, visible, usable: true, reason: "allowed", missingDependencies: [] }
}

export function getVisibleModules(context: ModuleEngineContext) {
  return appRegistry.filter((module) => isModuleVisible(module, context))
}

export function getSidebarModules(context: ModuleEngineContext) {
  return getVisibleModules(context).filter((module) => module.visibleInSidebar)
}

export function getDashboardModules(context: ModuleEngineContext) {
  return getVisibleModules(context).filter((module) => module.visibleInDashboard)
}

export function getMarketplaceModules(context: ModuleEngineContext) {
  return appRegistry
    .filter((module) => module.marketplace)
    .map((module) => ({
      ...module,
      status: (isExtensionInstalled(module, context.installedExtensions) ? "installed" : isModuleUsable(module, context) ? module.status : "locked") as ModuleStatus
    }))
}

export function getSearchModules(context: ModuleEngineContext) {
  return getVisibleModules(context).filter((module) => module.visibleInSearch)
}

export function getLockedModules(context: ModuleEngineContext) {
  return appRegistry.filter((module) => !isModuleUsable(module, context))
}
