export type RuntimeEnv = Record<string, string | undefined>

export type RuntimeEnvIssue = {
  code:
    | "missing_auth_secret"
    | "insecure_auth_secret"
    | "invalid_auth_cookie_secure"
    | "https_requires_secure_cookie"
    | "invalid_login_rate_limit"
    | "demo_mode_with_database"
  message: string
}

export type RuntimeEnvValidation =
  | { valid: true; issues: [] }
  | { valid: false; issues: RuntimeEnvIssue[] }

const INSECURE_AUTH_SECRETS = new Set([
  "change-this-secret-before-production",
  "dream-invoice-change-this-secret",
  "CHANGEME_GENERATE_WITH_OPENSSL_RAND_HEX_32"
])

function envValue(env: RuntimeEnv, key: string) {
  const value = env[key]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function envFlag(env: RuntimeEnv, key: string) {
  const value = envValue(env, key)
  if (!value) return null

  const normalized = value.toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) return true
  if (["0", "false", "no", "off"].includes(normalized)) return false

  return "invalid" as const
}

function firstPublicUrl(env: RuntimeEnv) {
  return envValue(env, "NEXT_PUBLIC_APP_URL") ?? envValue(env, "APP_URL") ?? envValue(env, "ORIGIN")
}

function isHttpsUrl(value: string | undefined) {
  if (!value) return false

  try {
    return new URL(value).protocol === "https:"
  } catch {
    return value.toLowerCase().startsWith("https://")
  }
}

function validateIntegerEnv(
  env: RuntimeEnv,
  key: string,
  min: number,
  max: number,
  issues: RuntimeEnvIssue[]
) {
  const raw = envValue(env, key)
  if (!raw) return

  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    issues.push({
      code: "invalid_login_rate_limit",
      message: key + " must be an integer between " + min + " and " + max + "."
    })
  }
}

export function validateRuntimeEnv(env: RuntimeEnv = process.env): RuntimeEnvValidation {
  const issues: RuntimeEnvIssue[] = []
  const authSecret = envValue(env, "AUTH_SECRET")

  if (!authSecret) {
    issues.push({
      code: "missing_auth_secret",
      message: "AUTH_SECRET is required."
    })
  } else if (
    authSecret.length < 32 ||
    authSecret.startsWith("CHANGEME_") ||
    INSECURE_AUTH_SECRETS.has(authSecret)
  ) {
    issues.push({
      code: "insecure_auth_secret",
      message: "AUTH_SECRET must be at least 32 characters and must not use an example placeholder."
    })
  }

  const secureCookie = envFlag(env, "AUTH_COOKIE_SECURE")
  if (secureCookie === "invalid") {
    issues.push({
      code: "invalid_auth_cookie_secure",
      message: "AUTH_COOKIE_SECURE must be true or false when set."
    })
  }

  if (isHttpsUrl(firstPublicUrl(env)) && secureCookie !== true) {
    issues.push({
      code: "https_requires_secure_cookie",
      message: "AUTH_COOKIE_SECURE must be true when the public app URL uses HTTPS."
    })
  }

  validateIntegerEnv(env, "DREAM_INVOICE_LOGIN_WINDOW_MS", 60_000, 60 * 60 * 1000, issues)
  validateIntegerEnv(env, "DREAM_INVOICE_LOGIN_MAX_ATTEMPTS", 1, 100, issues)

  if (envFlag(env, "DREAM_INVOICE_DEMO_MODE") === true && envValue(env, "DATABASE_URL")) {
    issues.push({
      code: "demo_mode_with_database",
      message: "DREAM_INVOICE_DEMO_MODE must not be enabled with DATABASE_URL."
    })
  }

  return issues.length ? { valid: false, issues } : { valid: true, issues: [] }
}

export function assertRuntimeEnv(env: RuntimeEnv = process.env) {
  const validation = validateRuntimeEnv(env)
  if (!validation.valid) {
    throw new Error("Runtime environment validation failed: " + validation.issues.map((issue) => issue.message).join(" "))
  }
}
