const AUTH_PASSWORD = process.env.DREAM_INVOICE_AUTH_PASSWORD || null

function envFlag(name: string, fallback: boolean) {
  const normalized = String(process.env[name] ?? "").trim().toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) return true
  if (["0", "false", "no", "off"].includes(normalized)) return false
  return fallback
}

function publicUrlUsesHttps() {
  const value = String(process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? process.env.ORIGIN ?? "").trim()
  if (!value) return false

  try {
    return new URL(value).protocol === "https:"
  } catch {
    return value.toLowerCase().startsWith("https://")
  }
}

export const AUTH_REQUIRED = envFlag("DREAM_INVOICE_AUTH_REQUIRED", false)
export const COOKIE_SECURE = envFlag("AUTH_COOKIE_SECURE", publicUrlUsesHttps())

if (AUTH_REQUIRED && (!AUTH_PASSWORD || AUTH_PASSWORD.trim() === "")) {
  throw new Error(
    "DREAM_INVOICE_AUTH_PASSWORD is required when deployment authentication is enabled."
  )
}

export { AUTH_PASSWORD }

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: COOKIE_SECURE,
  sameSite: "lax" as const
}
