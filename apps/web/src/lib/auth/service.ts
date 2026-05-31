import { cookies } from "next/headers"
import { isUserRole, isUserStatus, type UserRole, type UserStatus } from "@dream-invoice/auth"
import { prisma } from "@dream-invoice/database"
import { createAppUser, UserServiceError } from "@/lib/users/service"
import { normalizePermissionSettings, type UserPermissionSetting } from "@/lib/users/permissions"
import { demoSessionUser, isDemoMode } from "@/lib/demo-mode"
import { createEmailVerificationToken } from "./email-verification"
import { assertStrongPassword, hashPassword, PasswordError, verifyPassword } from "./password"
import { SESSION_COOKIE_NAME, SessionError, createSessionToken, createTwoFactorChallengeToken, verifySessionToken } from "./session"

export type SessionUser = {
  id: string
  email: string
  name: string | null
  role: UserRole
  status: UserStatus
  emailVerifiedAt: Date | null
  twoFactorEnabled: boolean
  permissions: UserPermissionSetting[]
}

type PermissionRecord = {
  scope: string
  action: string
  allowed: boolean
}

type UserRecord = {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  passwordHash: string | null
  emailVerifiedAt: Date | null
  emailVerificationTokenHash?: string | null
  emailVerificationTokenExpiresAt?: Date | null
  twoFactorSecret?: string | null
  twoFactorEnabledAt?: Date | null
  twoFactorBackupCodes?: unknown
  lastLoginAt: Date | null
  invitedAt: Date | null
  disabledAt: Date | null
  createdAt: Date
  updatedAt: Date
  permissions?: PermissionRecord[]
}

type UserStore = {
  user: {
    count(args?: unknown): Promise<number>
    findMany(args?: unknown): Promise<UserRecord[]>
    findUnique(args: unknown): Promise<UserRecord | null>
    findFirst?(args: unknown): Promise<UserRecord | null>
    create(args: unknown): Promise<UserRecord>
    update(args: unknown): Promise<UserRecord>
  }
}

type AuthContext = {
  store?: UserStore
  now?: () => Date
  secret?: string
  requireEmailVerification?: boolean
}

type SessionUserCacheEntry = {
  expiresAt: number
  user: SessionUser
}

export type LoginInput = {
  email?: unknown
  password?: unknown
}

export type InitialAdminInput = {
  name?: unknown
  email?: unknown
  password?: unknown
}

export class AuthServiceError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "AuthServiceError"
    this.code = code
    this.status = status
  }
}

const EMAIL_PATTERN = /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i

const permissionRelation = {
  permissions: {
    select: {
      scope: true,
      action: true,
      allowed: true
    },
    orderBy: [
      { scope: "asc" },
      { action: "asc" }
    ]
  }
}

const SESSION_USER_CACHE_TTL_MS = 5_000
const sessionUserCache = new Map<string, SessionUserCacheEntry>()

function getStore(context?: AuthContext): UserStore {
  return (context?.store ?? prisma) as UserStore
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthServiceError("invalid_credentials", "E-Mail oder Passwort ist ungueltig.", 401)
  }

  return email
}

function normalizePassword(value: unknown) {
  const password = String(value ?? "")
  if (!password) {
    throw new AuthServiceError("invalid_credentials", "E-Mail oder Passwort ist ungueltig.", 401)
  }

  return password
}

function toSessionUser(user: UserRecord): SessionUser {
  const role = user.role === "owner" ? "admin" : user.role === "accountant" ? "user" : user.role

  if (!isUserRole(role) || !isUserStatus(user.status)) {
    throw new AuthServiceError("invalid_user", "Benutzerprofil ist ungueltig.", 500)
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    twoFactorEnabled: Boolean(user.twoFactorEnabledAt),
    permissions: normalizePermissionSettings(user.permissions ?? [], role)
  }
}

function normalizePasswordError(error: unknown): never {
  if (error instanceof PasswordError) {
    throw new AuthServiceError(error.code, error.message)
  }

  throw error
}

export async function createInitialAdmin(
  input: InitialAdminInput,
  context?: AuthContext
): Promise<{ user: SessionUser; verificationToken: string | null }> {
  const store = getStore(context)
  const existingUsers = await store.user.count()

  if (existingUsers > 0) {
    throw new AuthServiceError("setup_closed", "Initiales Setup ist bereits geschlossen.", 409)
  }

  let password: string
  try {
    password = assertStrongPassword(input.password)
  } catch (error) {
    normalizePasswordError(error)
  }

  const passwordHash = await hashPassword(password)
  const requireEmailVerification = context?.requireEmailVerification ?? true
  const verification = requireEmailVerification ? createEmailVerificationToken() : null
  const now = context?.now?.() ?? new Date()
  const created = await createAppUser(
    {
      name: input.name,
      email: input.email,
      role: "admin",
      status: requireEmailVerification ? "inactive" : "active"
    },
    {
      store,
      getLimitStatus: async () => ({
        activeUsers: 0,
        maxUsers: 1,
        remainingUsers: 1,
        limitReached: false,
        plan: "setup",
        billingCycle: "setup",
        status: "active",
        validUntil: null
      }),
      now: context?.now
    }
  )

  const updated = await store.user.update({
    where: { id: created.id },
    data: verification
      ? {
          passwordHash,
          emailVerificationTokenHash: verification.tokenHash,
          emailVerificationTokenExpiresAt: verification.expiresAt
        }
      : {
          passwordHash,
          emailVerifiedAt: now,
          emailVerificationTokenHash: null,
          emailVerificationTokenExpiresAt: null
        },
    include: permissionRelation
  })

  return { user: toSessionUser(updated), verificationToken: verification?.token ?? null }
}

export async function authenticateAppUser(input: LoginInput, context?: AuthContext): Promise<
  | { user: SessionUser; token: string; requiresTwoFactor: false }
  | { user: SessionUser; challengeToken: string; requiresTwoFactor: true }
> {
  const store = getStore(context)
  const email = normalizeEmail(input.email)
  const password = normalizePassword(input.password)
  const user = await store.user.findUnique({ where: { email } })

  if (!user || user.status !== "active" || !user.emailVerifiedAt || !await verifyPassword(password, user.passwordHash)) {
    throw new AuthServiceError("invalid_credentials", "E-Mail oder Passwort ist ungueltig.", 401)
  }

  const sessionUser = toSessionUser(user)
  if (user.twoFactorEnabledAt && user.twoFactorSecret) {
    return {
      user: sessionUser,
      challengeToken: createTwoFactorChallengeToken(user.id, { now: context?.now?.(), secret: context?.secret }),
      requiresTwoFactor: true
    }
  }

  const token = createSessionToken(user.id, { now: context?.now?.(), secret: context?.secret })
  const updated = await store.user.update({
    where: { id: user.id },
    data: { lastLoginAt: context?.now?.() ?? new Date() },
    include: permissionRelation
  })

  return {
    user: toSessionUser(updated),
    token,
    requiresTwoFactor: false
  }
}

export async function getSessionUserFromToken(token: string | null | undefined, context?: AuthContext): Promise<SessionUser | null> {
  const payload = verifySessionToken(token, { now: context?.now?.(), secret: context?.secret })
  if (!payload) return null
  if (isDemoMode()) return payload.userId === demoSessionUser.id ? demoSessionUser : null

  const canUseCache = !context && Boolean(token)
  const now = Date.now()
  if (canUseCache && token) {
    const cached = sessionUserCache.get(token)
    if (cached && cached.expiresAt > now) return cached.user
    if (cached) sessionUserCache.delete(token)
  }

  const user = await getStore(context).user.findUnique({
    where: { id: payload.userId },
    include: permissionRelation
  })
  if (!user || user.status !== "active" || !user.emailVerifiedAt) return null

  const sessionUser = toSessionUser(user)
  if (canUseCache && token) {
    sessionUserCache.set(token, {
      user: sessionUser,
      expiresAt: now + SESSION_USER_CACHE_TTL_MS
    })
  }

  return sessionUser
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  return getSessionUserFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}

export async function requireCurrentUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthServiceError("session_required", "Anmeldung erforderlich.", 401)
  }

  return user
}

export async function requireCurrentUserRole(roles: UserRole[]): Promise<SessionUser> {
  const user = await requireCurrentUser()
  if (!roles.includes(user.role)) {
    throw new AuthServiceError("forbidden", "Diese Aktion ist nur fuer Admins erlaubt.", 403)
  }

  return user
}

export function mapAuthError(error: unknown): { error: string; code: string; status: number } {
  if (error instanceof AuthServiceError || error instanceof UserServiceError) {
    return { error: error.message, code: error.code, status: error.status }
  }

  if (error instanceof SessionError) {
    return { error: error.message, code: error.code, status: 503 }
  }

  return { error: "Authentifizierung konnte nicht verarbeitet werden.", code: "auth_error", status: 500 }
}
