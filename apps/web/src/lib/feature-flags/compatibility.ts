import {
  mapLegacyLicenseToSaasEntitlements,
  newFeatureFlags,
  newMarketplaceExtensions,
  type LegacyLicenseSnapshot,
  type NewFeatureFlag,
  type NewSaasEntitlementSnapshot,
  type NewSaasPlan
} from "@/lib/saas-license-migration"

export type FeatureLookup = NewFeatureFlag | string
export type CompatibilitySource = "new" | "legacy" | "mixed" | "none"
export type PermissionAction = "read" | "create" | "edit" | "delete" | "approve" | "export"

export type TranslatedPermission = {
  scope: string
  action: PermissionAction
  source: "legacy-premium-role" | "new-permission"
}

export type NewArchitectureSnapshot = {
  plan?: NewSaasPlan | null
  featureFlags?: readonly FeatureLookup[] | null
  marketplaceExtensionKeys?: readonly string[] | null
}

export type LegacyCompatibilitySnapshot = LegacyLicenseSnapshot & {
  role?: string | null
}

export type SaasCompatibilityInput = {
  newArchitecture?: NewArchitectureSnapshot | null
  legacy?: LegacyCompatibilitySnapshot | null
}

export type SaasCompatibilitySnapshot = NewSaasEntitlementSnapshot & {
  source: CompatibilitySource
  translatedPermissions: TranslatedPermission[]
}

const featureAliases: Record<string, NewFeatureFlag> = {
  ocr: "feature.ocr",
  datev: "feature.datev",
  banking: "feature.banking",
  bank: "feature.banking",
  api: "feature.api_premium",
  api_premium: "feature.api_premium",
  apiPremium: "feature.api_premium",
  "api-premium": "feature.api_premium",
  multitenant: "feature.multitenant",
  multi_tenant: "feature.multitenant",
  "multi-tenant": "feature.multitenant",
  portal: "feature.portal_pro",
  portal_pro: "feature.portal_pro",
  "portal-pro": "feature.portal_pro",
  shopify: "feature.shopify",
  woocommerce: "feature.woocommerce",
  ai: "feature.ai_assistant",
  ai_assistant: "feature.ai_assistant",
  "ai-assistant": "feature.ai_assistant",
  document_ai: "feature.document_ai",
  "document-ai": "feature.document_ai",
  warehouse: "feature.warehouse",
  inventory: "feature.inventory",
  time: "feature.time_pro",
  time_pro: "feature.time_pro",
  "time-pro": "feature.time_pro",
  resource_planning: "feature.resource_planning",
  "resource-planning": "feature.resource_planning"
}

const planRank: Record<NewSaasPlan, number> = {
  free: 0,
  starter: 1,
  business: 2,
  enterprise: 3
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort()
}

function highestPlan(plans: readonly NewSaasPlan[]): NewSaasPlan {
  return plans.reduce<NewSaasPlan>((current, plan) => (planRank[plan] > planRank[current] ? plan : current), "free")
}

export function normalizeFeatureKey(feature: FeatureLookup): NewFeatureFlag | null {
  const value = String(feature).trim()
  if ((newFeatureFlags as readonly string[]).includes(value)) return value as NewFeatureFlag

  const normalized = value
    .replace(/^feature[._:-]/, "")
    .replace(/[\s-]+/g, "_")

  return featureAliases[normalized] ?? featureAliases[value] ?? null
}

function flagsFromMarketplace(extensionKeys: readonly string[] | null | undefined): NewFeatureFlag[] {
  if (!extensionKeys?.length) return []
  const keys = new Set(extensionKeys.map((key) => String(key).trim()).filter(Boolean))
  return newMarketplaceExtensions
    .filter((extension) => keys.has(extension.key) && extension.featureFlag)
    .map((extension) => extension.featureFlag as NewFeatureFlag)
}

function hasNewArchitecture(snapshot: NewArchitectureSnapshot | null | undefined) {
  return Boolean(
    snapshot?.plan ||
    snapshot?.featureFlags?.length ||
    snapshot?.marketplaceExtensionKeys?.length
  )
}

export function translateLegacyPremiumRole(role: string | null | undefined, premiumRole = false): TranslatedPermission[] {
  const normalized = String(role ?? "").trim().toLowerCase()
  const isPremiumAdmin = premiumRole || normalized === "admin" || normalized === "owner" || normalized === "premium" || normalized === "premium_admin"
  if (!isPremiumAdmin) return []

  const scopes = ["billing", "marketplace", "feature_flags", "users", "settings"]
  const actions: PermissionAction[] = ["read", "create", "edit", "delete", "approve", "export"]

  return scopes.flatMap((scope) =>
    actions.map((action) => ({
      scope,
      action,
      source: "legacy-premium-role" as const
    }))
  )
}

export function resolveSaasCompatibility(input: SaasCompatibilityInput = {}): SaasCompatibilitySnapshot {
  const legacy = input.legacy ?? null
  const newArchitecture = input.newArchitecture ?? null
  const legacyEntitlements = mapLegacyLicenseToSaasEntitlements({
    premiumLicense: legacy?.premiumLicense,
    premiumRole: legacy?.premiumRole,
    licenseKey: legacy?.licenseKey,
    plan: legacy?.plan,
    features: legacy?.features,
    maxUsers: legacy?.maxUsers
  })

  const newFlags = uniqueSorted([
    ...(newArchitecture?.featureFlags ?? []).map(normalizeFeatureKey).filter((flag): flag is NewFeatureFlag => Boolean(flag)),
    ...flagsFromMarketplace(newArchitecture?.marketplaceExtensionKeys)
  ])
  const newMarketplaceKeys = uniqueSorted(newArchitecture?.marketplaceExtensionKeys?.map((key) => String(key).trim()).filter(Boolean) ?? [])
  const newIsConfigured = hasNewArchitecture(newArchitecture)

  const featureFlags = newIsConfigured
    ? uniqueSorted([...newFlags, ...legacyEntitlements.featureFlags])
    : legacyEntitlements.featureFlags
  const marketplaceExtensionKeys = newIsConfigured
    ? uniqueSorted([...newMarketplaceKeys, ...legacyEntitlements.marketplaceExtensionKeys])
    : legacyEntitlements.marketplaceExtensionKeys
  const plan = newIsConfigured
    ? highestPlan([newArchitecture?.plan ?? "free", legacyEntitlements.plan])
    : legacyEntitlements.plan
  const source: CompatibilitySource = newIsConfigured && legacyEntitlements.sourceMappings.length
    ? "mixed"
    : newIsConfigured
      ? "new"
      : legacyEntitlements.sourceMappings.length
        ? "legacy"
        : "none"

  return {
    plan,
    featureFlags,
    marketplaceExtensionKeys,
    sourceMappings: uniqueSorted([
      ...(newIsConfigured ? ["new_architecture"] : []),
      ...legacyEntitlements.sourceMappings
    ]),
    seats: newIsConfigured ? legacyEntitlements.seats : legacyEntitlements.seats,
    source,
    translatedPermissions: translateLegacyPremiumRole(legacy?.role, legacy?.premiumRole)
  }
}

export function hasFeature(feature: FeatureLookup, input: SaasCompatibilityInput = {}) {
  const key = normalizeFeatureKey(feature)
  if (!key) return false
  return resolveSaasCompatibility(input).featureFlags.includes(key)
}

export function createFeatureChecker(input: SaasCompatibilityInput = {}) {
  const snapshot = resolveSaasCompatibility(input)
  return (feature: FeatureLookup) => {
    const key = normalizeFeatureKey(feature)
    return Boolean(key && snapshot.featureFlags.includes(key))
  }
}

export function getInstalledMarketplaceExtensions(input: SaasCompatibilityInput = {}) {
  const snapshot = resolveSaasCompatibility(input)
  const activeKeys = new Set(snapshot.marketplaceExtensionKeys)
  const activeFlags = new Set(snapshot.featureFlags)

  return newMarketplaceExtensions.filter((extension) =>
    activeKeys.has(extension.key) ||
    (extension.featureFlag ? activeFlags.has(extension.featureFlag) : false)
  )
}
