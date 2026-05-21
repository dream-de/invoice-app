import { createLicenseVerificationSnapshot, createPendingLicenseActivation } from "@dream-invoice/server-core"

export type ServerApiRouteDefinition = {
  method: "GET" | "POST"
  path: string
  description: string
}

export const serverApiLicenseRoutes: readonly ServerApiRouteDefinition[] = [
  {
    method: "POST",
    path: "/license/activate",
    description: "Activate a Dream Invoice license key for a browser or desktop installation."
  },
  {
    method: "POST",
    path: "/license/verify",
    description: "Verify an existing Dream Invoice license snapshot and return enabled features."
  }
]

export function previewLicenseActivation(licenseKey: string, requestedPlan = "free") {
  return createPendingLicenseActivation({ licenseKey, requestedPlan })
}

export function previewLicenseVerification() {
  return createLicenseVerificationSnapshot("free")
}
