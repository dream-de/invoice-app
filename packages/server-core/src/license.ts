import {
  canUseLicensedFeatures,
  createLicenseSnapshot,
  getEnabledFeatures,
  normalizeLicensePlan,
  type LicenseFeature,
  type LicensePlan,
  type LicenseSnapshot,
  type LicenseStatus
} from "@invoice-platform/licensing"

export type LicenseActivationRequest = {
  licenseKey: string
  requestedPlan?: string
  deviceId?: string
  installationId?: string
}

export type LicenseActivationResult = {
  snapshot: LicenseSnapshot
  enabledFeatures: readonly LicenseFeature[]
  canUseProFeatures: boolean
}

export function createPendingLicenseActivation(request: LicenseActivationRequest): LicenseActivationResult {
  const plan = normalizeLicensePlan(request.requestedPlan)
  const status: LicenseStatus = request.licenseKey.trim() ? "active" : "inactive"
  const snapshot = createLicenseSnapshot(plan, status)

  return {
    snapshot,
    enabledFeatures: canUseLicensedFeatures(snapshot) ? getEnabledFeatures(plan) : [],
    canUseProFeatures: canUseLicensedFeatures(snapshot) && plan !== "free"
  }
}

export function createLicenseVerificationSnapshot(plan: LicensePlan = "free"): LicenseActivationResult {
  const snapshot = createLicenseSnapshot(plan)

  return {
    snapshot,
    enabledFeatures: getEnabledFeatures(plan),
    canUseProFeatures: plan !== "free"
  }
}
