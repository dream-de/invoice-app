export const defaultFeatureFlags = {
  "open_banking.enabled": false,
  "open_banking.psd2": false,
  "open_banking.bank_sync": false,
  "open_banking.payment_matching": false,
  "open_banking.bank_rules": false,
  "open_banking.cashflow_forecast": false,
  "datev.enabled": false,
  "ocr.enabled": false,
  "shopify.enabled": false,
  "woocommerce.enabled": false,
  "warehouse.enabled": false,
  "ai.enabled": false,
  "advanced_audit_logs.enabled": false
} as const satisfies Record<string, boolean>

export type DefaultFeatureFlagKey = keyof typeof defaultFeatureFlags
