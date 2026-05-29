import type { SessionUser } from "@/lib/auth/service"

export function isDemoMode() {
  return process.env.DREAM_INVOICE_DEMO_MODE === "true"
}

export const DEMO_LOGIN_EMAIL = "demo@example.com"
export const DEMO_LOGIN_PASSWORD = "dreaminvoice"

export const demoSessionUser: SessionUser = {
  id: "demo-user",
  email: DEMO_LOGIN_EMAIL,
  name: "Dream Invoice Demo",
  role: "admin",
  status: "active",
  emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
  twoFactorEnabled: false,
  permissions: []
}

export function isValidDemoLogin(emailOrUsername: unknown, password: unknown) {
  const login = String(emailOrUsername ?? "").trim().toLowerCase()
  const secret = String(password ?? "")

  return login === DEMO_LOGIN_EMAIL && secret === DEMO_LOGIN_PASSWORD
}

export function demoModeResponse<T extends object>(payload: T) {
  return {
    ...payload,
    mode: "demo" as const,
    persisted: false
  }
}

export function demoDisabledMessage(action = "Diese Aktion") {
  return action + " wird im Demo-Modus simuliert und nicht dauerhaft gespeichert."
}
