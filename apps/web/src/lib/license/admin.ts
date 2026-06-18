import { AuthServiceError, type SessionUser } from "@/lib/auth/service"

export function isLicenseAdminEnabled(env: NodeJS.ProcessEnv = process.env) {
  return String(env.DREAM_INVOICE_LICENSE_ADMIN_ENABLED ?? "").trim().toLowerCase() === "true"
}

export function licenseOwnerEmail(env: NodeJS.ProcessEnv = process.env) {
  return String(env.DREAM_INVOICE_OWNER_EMAIL ?? "").trim().toLowerCase() || null
}

export function assertLicenseAdminAccess(user: SessionUser, env: NodeJS.ProcessEnv = process.env) {
  if (!isLicenseAdminEnabled(env)) {
    throw new AuthServiceError("license_admin_disabled", "Lizenz Admin ist in dieser Umgebung deaktiviert.", 403)
  }

  const ownerEmail = licenseOwnerEmail(env)
  if (ownerEmail && user.email.toLowerCase() !== ownerEmail) {
    throw new AuthServiceError("license_admin_owner_only", "Lizenzgenerierung ist nur fuer den lokalen Owner erlaubt.", 403)
  }
}
