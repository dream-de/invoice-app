import {
  mapLegacyLicenseToSaasEntitlements,
  newFeatureFlags,
  newMarketplaceExtensions,
  type LegacyLicenseSnapshot,
  type NewFeatureFlag,
  type NewSaasEntitlementSnapshot,
  type NewSaasPlan
} from "./migration"

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
  open_banking: "open_banking.enabled",
  "open-banking": "open_banking.enabled",
  psd2: "open_banking.psd2",
  bank_sync: "open_banking.bank_sync",
  "bank-sync": "open_banking.bank_sync",
  payment_matching: "open_banking.payment_matching",
  "payment-matching": "open_banking.payment_matching",
  bank_rules: "open_banking.bank_rules",
  "bank-rules": "open_banking.bank_rules",
  cashflow_forecast: "open_banking.cashflow_forecast",
  "cashflow-forecast": "open_banking.cashflow_forecast",
  api: "feature.api",
  api_premium: "feature.api",
  apiPremium: "feature.api",
  "api-premium": "feature.api",
  api_extension: "feature.api",
  "api-extension": "feature.api",
  multitenant: "feature.api",
  multi_tenant: "feature.api",
  "multi-tenant": "feature.api",
  portal: "feature.archive_pro",
  portal_pro: "feature.archive_pro",
  "portal-pro": "feature.archive_pro",
  archive: "feature.archive_pro",
  archive_pro: "feature.archive_pro",
  "archive-pro": "feature.archive_pro",
  shopify: "feature.shopify",
  woocommerce: "feature.woocommerce",
  ai: "feature.ai_assistant",
  ai_assistant: "feature.ai_assistant",
  "ai-assistant": "feature.ai_assistant",
  document_ai: "feature.archive_pro",
  "document-ai": "feature.archive_pro",
  document_archive: "feature.archive_pro",
  "document-archive": "feature.archive_pro",
  warehouse: "feature.inventory",
  lager: "feature.inventory",
  inventory: "feature.inventory",
  time: "feature.time_tracking_pro",
  time_pro: "feature.time_tracking_pro",
  "time-pro": "feature.time_tracking_pro",
  time_tracking: "feature.time_tracking_pro",
  time_tracking_pro: "feature.time_tracking_pro",
  "time-tracking-pro": "feature.time_tracking_pro",
  resource_planning: "feature.time_tracking_pro",
  "resource-planning": "feature.time_tracking_pro"
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
