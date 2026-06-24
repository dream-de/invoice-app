export type NewSaasPlan = "free" | "starter" | "business" | "enterprise"

export type NewFeatureFlag =
  | "feature.ocr"
  | "feature.datev"
  | "feature.banking"
  | "feature.api_premium"
  | "feature.multitenant"
  | "feature.portal_pro"
  | "feature.shopify"
  | "feature.woocommerce"
  | "feature.ai_assistant"
  | "feature.document_ai"
  | "feature.warehouse"
  | "feature.inventory"
  | "feature.time_pro"
  | "feature.resource_planning"

export const newFeatureFlags: readonly NewFeatureFlag[] = [
  "feature.ocr",
  "feature.datev",
  "feature.banking",
  "feature.api_premium",
  "feature.multitenant",
  "feature.portal_pro",
  "feature.shopify",
  "feature.woocommerce",
  "feature.ai_assistant",
  "feature.document_ai",
  "feature.warehouse",
  "feature.inventory",
  "feature.time_pro",
  "feature.resource_planning"
]

export type MarketplaceCategory = "Finanzen" | "KI" | "E-Commerce" | "Projektmanagement" | "Produktion" | "Business"

export type MarketplaceExtension = {
  key: string
  name: string
  category: MarketplaceCategory
  featureFlag: NewFeatureFlag | null
}

export const newMarketplaceExtensions: readonly MarketplaceExtension[] = [
  { key: "datev", name: "DATEV", category: "Finanzen", featureFlag: "feature.datev" },
  { key: "banking", name: "Banking", category: "Finanzen", featureFlag: "feature.banking" },
  { key: "paypal", name: "PayPal", category: "Finanzen", featureFlag: "feature.banking" },
  { key: "stripe", name: "Stripe", category: "Finanzen", featureFlag: "feature.banking" },
  { key: "ai-assistant", name: "KI Assistent", category: "KI", featureFlag: "feature.ai_assistant" },
  { key: "ocr-ai", name: "OCR KI", category: "KI", featureFlag: "feature.ocr" },
  { key: "document-analysis", name: "Dokumentanalyse", category: "KI", featureFlag: "feature.document_ai" },
  { key: "shopify", name: "Shopify", category: "E-Commerce", featureFlag: "feature.shopify" },
  { key: "woocommerce", name: "WooCommerce", category: "E-Commerce", featureFlag: "feature.woocommerce" },
  { key: "time-pro", name: "Zeiterfassung Pro", category: "Projektmanagement", featureFlag: "feature.time_pro" },
  { key: "resource-planning", name: "Ressourcenplanung", category: "Projektmanagement", featureFlag: "feature.resource_planning" },
  { key: "warehouse", name: "Lagerverwaltung", category: "Produktion", featureFlag: "feature.warehouse" },
  { key: "inventory", name: "Inventur", category: "Produktion", featureFlag: "feature.inventory" },
  { key: "multitenant", name: "Multi-Mandanten", category: "Business", featureFlag: "feature.multitenant" },
  { key: "api-premium", name: "API Premium", category: "Business", featureFlag: "feature.api_premium" },
  { key: "portal-pro", name: "Kundenportal Pro", category: "Business", featureFlag: "feature.portal_pro" }
]

export type LegacyPremiumSource =
  | "premium_license"
  | "premium_role"
  | "license_key"
  | "license_feature"
  | "premium_workflow"
  | "premium_setting"
  | "premium_action"

export type LegacyPremiumFunctionMapping = {
  legacyKey: string
  label: string
  source: LegacyPremiumSource
  currentMechanism: string
  dependentApis: readonly string[]
  dependentRoles: readonly string[]
  dependentDatabaseFields: readonly string[]
  dependentUiComponents: readonly string[]
  targetPlan: NewSaasPlan
  targetFeatureFlags: readonly NewFeatureFlag[]
  marketplaceExtensionKeys: readonly string[]
  requiresMigration: boolean
  compatibilityBehavior: string
  criticality: "low" | "medium" | "high"
}

export const legacyPremiumFunctionMappings: readonly LegacyPremiumFunctionMapping[] = [
  {
    legacyKey: "premium_license",
    label: "Bestehende Premium-Lizenz",
    source: "premium_license",
    currentMechanism: "Aktive License-Zeile oder signierter INV1 License Key mit Plan, maxUsers und features.",
    dependentApis: ["/api/settings/license/activate", "/api/settings/license/verify", "/api/settings/users"],
    dependentRoles: ["admin fuer Aktivierung und Verwaltung"],
    dependentDatabaseFields: ["License.keyHash", "License.plan", "License.maxUsers", "License.features", "License.status", "License.validUntil"],
    dependentUiComponents: ["PremiumLicensePanel", "LicenseActivationForm", "PremiumSettingsSectionContent"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.ocr", "feature.datev", "feature.api_premium"],
    marketplaceExtensionKeys: ["ocr-ai", "datev", "api-premium"],
    requiresMigration: true,
    compatibilityBehavior: "Aktive Alt-Premium-Lizenz wird als Business-Plan mit OCR, DATEV und API Premium behandelt.",
    criticality: "high"
  },
  {
    legacyKey: "license_key",
    label: "Signierter Lizenzschluessel",
    source: "license_key",
    currentMechanism: "INV1 compact key oder JSON envelope wird mit LICENSE_PUBLIC_KEY verifiziert und als License/LicenseIssue gespeichert.",
    dependentApis: ["/api/settings/license/activate", "/api/settings/license/verify", "/api/settings/license/generate"],
    dependentRoles: ["admin", "license admin owner"],
    dependentDatabaseFields: ["LicenseIssue.keyHash", "LicenseIssue.keyPreview", "LicenseIssue.plan", "LicenseIssue.maxUsers", "LicenseIssue.features", "License.activatedAt"],
    dependentUiComponents: ["PremiumLicensePanel", "PremiumLicenseAdminPage", "LicenseActivationForm"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.api_premium"],
    marketplaceExtensionKeys: ["api-premium"],
    requiresMigration: true,
    compatibilityBehavior: "Gueltiger Alt-Key bleibt akzeptiert; Shadow-Mapping erzeugt Plan und Feature Flags.",
    criticality: "high"
  },
  {
    legacyKey: "premium_role_admin_access",
    label: "Admin als Premium-/Vollzugriff",
    source: "premium_role",
    currentMechanism: "admin ist Gate fuer Lizenz-APIs, User-Verwaltung und alle Permission Keys.",
    dependentApis: ["/api/settings/license/*", "/api/settings/users"],
    dependentRoles: ["admin", "owner legacy -> admin"],
    dependentDatabaseFields: ["User.role", "UserPermission.scope", "UserPermission.action", "UserPermission.allowed"],
    dependentUiComponents: ["LocalizedNavigationShell", "UsersAndPermissionsClient", "PremiumWorkspace"],
    targetPlan: "free",
    targetFeatureFlags: [],
    marketplaceExtensionKeys: [],
    requiresMigration: true,
    compatibilityBehavior: "Admin bleibt Verwaltungsrolle, schaltet aber keine Premium-Funktionen frei.",
    criticality: "high"
  },
  {
    legacyKey: "datevExport",
    label: "DATEV Export",
    source: "license_feature",
    currentMechanism: "packages/licensing Entitlement und Finance/Report UI; Exportroute vorhanden.",
    dependentApis: ["/api/finance/datev-export", "/api/finance/report"],
    dependentRoles: ["finance:view oder admin je nach UI-Pfad"],
    dependentDatabaseFields: ["License.features", "License.plan", "Invoice", "Expense"],
    dependentUiComponents: ["PremiumReportsPage", "PremiumWorkflowPanel", "Finance settings"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.datev"],
    marketplaceExtensionKeys: ["datev"],
    requiresMigration: true,
    compatibilityBehavior: "Alt-Feature datevExport aktiviert feature.datev und DATEV Marketplace-Installation.",
    criticality: "high"
  },
  {
    legacyKey: "financeAutomation",
    label: "Banking und Zahlungsabgleich",
    source: "license_feature",
    currentMechanism: "Open Banking/finAPI Vorbereitung, Banking-Panel und Finance Automation Entitlement.",
    dependentApis: ["/api/finance/open-banking/*", "/api/finance/base", "/api/finance/accounts/import"],
    dependentRoles: ["finance:view", "settings:manage fuer Konfiguration"],
    dependentDatabaseFields: ["BankAccount", "BankTransaction", "PaymentProviderConfig", "License.features"],
    dependentUiComponents: ["PremiumFinancePanel", "FinanceSettingsPage", "financeConfig"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.banking"],
    marketplaceExtensionKeys: ["banking"],
    requiresMigration: true,
    compatibilityBehavior: "Alt-Feature financeAutomation aktiviert Banking Marketplace-Entitlement.",
    criticality: "high"
  },
  {
    legacyKey: "paypal_stripe_payments",
    label: "PayPal und Stripe",
    source: "premium_workflow",
    currentMechanism: "Payment Provider Configs, Payment Links und vorbereitete Integrations-UI.",
    dependentApis: ["/api/invoice/payment-links/[id]", "/api/payments/webhooks/paypal", "/api/payments/webhooks/stripe", "/api/finance/base"],
    dependentRoles: ["finance:view", "settings:manage"],
    dependentDatabaseFields: ["PaymentProviderConfig", "InvoicePaymentLink", "InvoicePayment"],
    dependentUiComponents: ["PremiumWorkflowPanel", "FinanceSettingsPage", "Integrations settings"],
    targetPlan: "starter",
    targetFeatureFlags: ["feature.banking"],
    marketplaceExtensionKeys: ["paypal", "stripe"],
    requiresMigration: true,
    compatibilityBehavior: "Bestehende Payment-Konfigurationen bleiben aktiv und werden als Marketplace-Zahlungserweiterungen markiert.",
    criticality: "medium"
  },
  {
    legacyKey: "apiAccess",
    label: "API Premium",
    source: "license_feature",
    currentMechanism: "packages/licensing apiAccess und vorbereitete API/API-Key Settings.",
    dependentApis: ["/api/v1/*", "/api/api-center", "/api/settings/users"],
    dependentRoles: ["admin", "api:manage"],
    dependentDatabaseFields: ["ApiKey.keyHash", "ApiKey.scopes", "License.features"],
    dependentUiComponents: ["ApiWebhooksSettingsPage", "PremiumWorkspace API view"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.api_premium"],
    marketplaceExtensionKeys: ["api-premium"],
    requiresMigration: true,
    compatibilityBehavior: "Alt-Feature apiAccess aktiviert API Premium.",
    criticality: "high"
  },
  {
    legacyKey: "multiCompany",
    label: "Multi-Mandanten",
    source: "license_feature",
    currentMechanism: "packages/licensing multiCompany, Tenant/Company/UserCompanyMembership-Struktur vorbereitet.",
    dependentApis: ["/api/tenants", "/api/companies", "/api/company-locations"],
    dependentRoles: ["admin", "UserCompanyMembership.role"],
    dependentDatabaseFields: ["Tenant", "Company", "CompanyLocation", "UserCompanyMembership", "License.features"],
    dependentUiComponents: ["Tenants settings", "Companies dashboard-v2 routes", "Locations dashboard-v2 routes"],
    targetPlan: "enterprise",
    targetFeatureFlags: ["feature.multitenant"],
    marketplaceExtensionKeys: ["multitenant"],
    requiresMigration: true,
    compatibilityBehavior: "Alt-Feature multiCompany aktiviert Enterprise-Ziel und Multi-Mandanten-Erweiterung.",
    criticality: "high"
  },
  {
    legacyKey: "teamUsers",
    label: "Benutzerplaetze und Team-Nutzung",
    source: "license_feature",
    currentMechanism: "License.maxUsers, User-Limit-Service und DB-Trigger.",
    dependentApis: ["/api/settings/users"],
    dependentRoles: ["admin fuer User-Verwaltung"],
    dependentDatabaseFields: ["License.maxUsers", "User.status", "User.role", "UserPermission", "enforce_user_license_limit"],
    dependentUiComponents: ["UsersAndPermissionsClient", "PremiumLicensePanel", "License & Billing Seats"],
    targetPlan: "business",
    targetFeatureFlags: [],
    marketplaceExtensionKeys: [],
    requiresMigration: true,
    compatibilityBehavior: "Bestehende maxUsers werden als Seats in der neuen Billing-Schicht gespiegelt.",
    criticality: "high"
  },
  {
    legacyKey: "ocr",
    label: "OCR und Belegerkennung",
    source: "premium_workflow",
    currentMechanism: "@dream-invoice/ocr, Belegupload, OCR-Vorschlag und Dokument-OCR-UI.",
    dependentApis: ["/api/expenses/attachments/upload", "/api/import/positions", "/api/import/recipient", "/api/import/articles"],
    dependentRoles: ["documents:view", "finance:view"],
    dependentDatabaseFields: ["ExpenseAttachment", "DocumentAsset", "License.features"],
    dependentUiComponents: ["PremiumWorkspace expense OCR", "DocumentManagementClient", "PremiumInvoiceEditor OCR dialog"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.ocr"],
    marketplaceExtensionKeys: ["ocr-ai"],
    requiresMigration: true,
    compatibilityBehavior: "Alt-Premium-Lizenz aktiviert OCR-KI fuer bestehende Kunden.",
    criticality: "medium"
  },
  {
    legacyKey: "ai_assistant",
    label: "KI Assistent",
    source: "premium_workflow",
    currentMechanism: "Dashboard-V2 AI Assistant UI und /api/ai-assistant Endpunkte.",
    dependentApis: ["/api/ai-assistant/context", "/api/ai-assistant/generate", "/api/ai-assistant/providers"],
    dependentRoles: ["admin oder Dashboard-Zugriff"],
    dependentDatabaseFields: ["keine dedizierte Lizenzspalte", "License.features spaeter"],
    dependentUiComponents: ["AiAssistantClient", "AiAssistantSettingsClient", "PremiumWorkspace"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.ai_assistant"],
    marketplaceExtensionKeys: ["ai-assistant"],
    requiresMigration: true,
    compatibilityBehavior: "Bestehende Premium-Kunden behalten KI-Assistent ueber Business-Fallback.",
    criticality: "medium"
  },
  {
    legacyKey: "document_ai",
    label: "Dokumentanalyse",
    source: "premium_workflow",
    currentMechanism: "Dokumentenmanagement, OCR-Scan und Analysevorbereitung.",
    dependentApis: ["/api/document-management/*", "/api/documents/export"],
    dependentRoles: ["documents:view", "documents:pdf"],
    dependentDatabaseFields: ["DocumentAsset", "License.features"],
    dependentUiComponents: ["DocumentManagementClient", "PremiumDocumentManagementPage"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.document_ai"],
    marketplaceExtensionKeys: ["document-analysis"],
    requiresMigration: true,
    compatibilityBehavior: "Premium-DMS-Funktionen werden als Dokumentanalyse-Feature markiert.",
    criticality: "medium"
  },
  {
    legacyKey: "customer_portal",
    label: "Kundenportal Pro",
    source: "premium_setting",
    currentMechanism: "Portal-App, Portal-Settings und Kundenportal-Modulvorbereitung.",
    dependentApis: ["/api/portal/*"],
    dependentRoles: ["portal:offer", "archive:use", "archive:configure", "settings:manage"],
    dependentDatabaseFields: ["PortalSession", "PortalToken", "Customer", "Invoice", "License.features"],
    dependentUiComponents: ["PortalSettingsPage", "ShareReleaseDialog", "portal app routes"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.portal_pro"],
    marketplaceExtensionKeys: ["portal-pro"],
    requiresMigration: true,
    compatibilityBehavior: "Bestehende Portal-Konfigurationen bleiben aktiv und erhalten portal_pro.",
    criticality: "medium"
  },
  {
    legacyKey: "time_tracking",
    label: "Zeiterfassung Pro",
    source: "premium_workflow",
    currentMechanism: "Dashboard-V2 Time/Time-Tracking, Projektbezug und create-invoice Workflow.",
    dependentApis: ["/api/time/create", "/api/time-tracking/*"],
    dependentRoles: ["projects:view", "documents:create"],
    dependentDatabaseFields: ["TimeEntry", "Project", "Invoice", "License.features"],
    dependentUiComponents: ["PremiumTimePage", "TimeTracking settings", "PremiumWorkspace"],
    targetPlan: "starter",
    targetFeatureFlags: ["feature.time_pro"],
    marketplaceExtensionKeys: ["time-pro"],
    requiresMigration: true,
    compatibilityBehavior: "Bestehende Premium-/Pro-Kunden behalten Zeiterfassung ueber time_pro.",
    criticality: "medium"
  },
  {
    legacyKey: "resource_planning",
    label: "Ressourcenplanung",
    source: "premium_workflow",
    currentMechanism: "Projekt- und Teamdaten vorbereitet, keine dedizierte Lizenzlogik.",
    dependentApis: ["/api/projects/*", "/api/settings/users"],
    dependentRoles: ["projects:view", "users:manage"],
    dependentDatabaseFields: ["Project", "User", "UserPermission"],
    dependentUiComponents: ["ProjectsPageClient", "PremiumProjectsPage"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.resource_planning"],
    marketplaceExtensionKeys: ["resource-planning"],
    requiresMigration: false,
    compatibilityBehavior: "Keine Altfreischaltung vorhanden; nur neues Marketplace-Entitlement vorbereiten.",
    criticality: "low"
  },
  {
    legacyKey: "shopify_woocommerce",
    label: "Shopify und WooCommerce",
    source: "premium_workflow",
    currentMechanism: "Integrationsbereich vorbereitet, keine aktive Alt-Lizenzlogik.",
    dependentApis: ["/api/templates", "/api/api-center"],
    dependentRoles: ["settings:manage", "api:manage"],
    dependentDatabaseFields: ["IntegrationConnection", "ApiKey"],
    dependentUiComponents: ["IntegrationsSettingsPage", "Marketplace"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.shopify", "feature.woocommerce"],
    marketplaceExtensionKeys: ["shopify", "woocommerce"],
    requiresMigration: false,
    compatibilityBehavior: "Keine Altkunden-Funktion zu migrieren; neue Marketplace-Installation steuert Zugriff.",
    criticality: "low"
  },
  {
    legacyKey: "warehouse_inventory",
    label: "Lagerverwaltung und Inventur",
    source: "premium_workflow",
    currentMechanism: "Noch keine dedizierte Alt-Lizenzlogik; Artikel/Kategorien als Basis vorhanden.",
    dependentApis: ["/api/articles/*"],
    dependentRoles: ["articles:view", "articles:edit"],
    dependentDatabaseFields: ["Article", "Category"],
    dependentUiComponents: ["Articles page", "Settings categories"],
    targetPlan: "business",
    targetFeatureFlags: ["feature.warehouse", "feature.inventory"],
    marketplaceExtensionKeys: ["warehouse", "inventory"],
    requiresMigration: false,
    compatibilityBehavior: "Keine Altfreischaltung vorhanden; neue Erweiterungen koennen spaeter additiv aktiviert werden.",
    criticality: "low"
  }
]

export type LegacyLicenseSnapshot = {
  premiumLicense?: boolean
  premiumRole?: boolean
  licenseKey?: string | null
  plan?: string | null
  features?: Partial<Record<string, boolean>> | null
  maxUsers?: number | null
}

export type NewSaasEntitlementSnapshot = {
  plan: NewSaasPlan
  featureFlags: NewFeatureFlag[]
  marketplaceExtensionKeys: string[]
  sourceMappings: string[]
  seats: number | null
}

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return Array.from(new Set(values)).sort()
}

function planFromLegacyPlan(plan: string | null | undefined): NewSaasPlan {
  if (plan === "enterprise" || plan === "unlimited") return "enterprise"
  if (plan === "business" || plan === "team" || plan === "pro") return "business"
  if (plan === "starter") return "starter"
  return "free"
}

function highestPlan(plans: readonly NewSaasPlan[]): NewSaasPlan {
  if (plans.includes("enterprise")) return "enterprise"
  if (plans.includes("business")) return "business"
  if (plans.includes("starter")) return "starter"
  return "free"
}

export function mapLegacyLicenseToSaasEntitlements(snapshot: LegacyLicenseSnapshot): NewSaasEntitlementSnapshot {
  const matched = legacyPremiumFunctionMappings.filter((mapping) => {
    if (mapping.legacyKey === "premium_license") return snapshot.premiumLicense === true
    if (mapping.legacyKey === "premium_role_admin_access") return snapshot.premiumRole === true
    if (mapping.legacyKey === "license_key") return Boolean(snapshot.licenseKey?.trim())
    return Boolean(snapshot.features?.[mapping.legacyKey])
  })

  const plan = highestPlan([planFromLegacyPlan(snapshot.plan), ...matched.map((mapping) => mapping.targetPlan)])
  const featureFlags = uniqueSorted(matched.flatMap((mapping) => mapping.targetFeatureFlags))
  const marketplaceExtensionKeys = uniqueSorted(matched.flatMap((mapping) => mapping.marketplaceExtensionKeys))

  return {
    plan,
    featureFlags,
    marketplaceExtensionKeys,
    sourceMappings: uniqueSorted(matched.map((mapping) => mapping.legacyKey)),
    seats: snapshot.maxUsers ?? null
  }
}
