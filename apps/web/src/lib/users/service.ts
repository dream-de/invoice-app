import { enforceUserLimit } from "@dream-invoice/licensing/signed-license"
import { isUserRole, isUserStatus, type UserRole, type UserStatus } from "@dream-invoice/auth"
import { prisma } from "@dream-invoice/database"
import { getUserLimitStatus, type UserLimitStatus } from "@/lib/license/limits"

export type AppUser = {
  id: string
  name: string | null
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt: Date | null
  invitedAt: Date | null
  disabledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type UserRecord = {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  lastLoginAt: Date | null
  invitedAt: Date | null
  disabledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type UserStore = {
  user: {
    count(args?: unknown): Promise<number>
    findMany(args?: unknown): Promise<UserRecord[]>
    findUnique(args: unknown): Promise<UserRecord | null>
    create(args: unknown): Promise<UserRecord>
    update(args: unknown): Promise<UserRecord>
  }
}

type UserServiceContext = {
  store?: UserStore
  getLimitStatus?: () => Promise<UserLimitStatus>
  now?: () => Date
}

export type CreateAppUserInput = {
  name?: unknown
  email?: unknown
  role?: unknown
  status?: unknown
}

export type UpdateAppUserInput = {
  id?: unknown
  name?: unknown
  role?: unknown
  status?: unknown
}

export class UserServiceError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.name = "UserServiceError"
    this.code = code
    this.status = status
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESERVED_EMAIL_DOMAIN = "dream-invoice.com"

function isReservedEmailDomain(domain: string) {
  return domain === RESERVED_EMAIL_DOMAIN || domain.endsWith("." + RESERVED_EMAIL_DOMAIN)
}

function getStore(context?: UserServiceContext): UserStore {
  return (context?.store ?? prisma) as UserStore
}

function normalizeEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email)) {
    throw new UserServiceError("invalid_email", "Bitte eine gueltige E-Mail-Adresse eintragen.")
  }

  const domain = email.split("@").at(1) ?? ""
  if (isReservedEmailDomain(domain)) {
    throw new UserServiceError(
      "reserved_email_domain",
      "Diese E-Mail-Domain ist fuer lokale Benutzer nicht erlaubt."
    )
  }

  return email
}

function normalizeName(value: unknown) {
  if (value === undefined || value === null) return null
  const name = String(value).trim()
  return name.length ? name : null
}

function normalizeRole(value: unknown, fallback: UserRole): UserRole {
  const role = String(value ?? fallback).trim()
  if (!isUserRole(role)) {
    throw new UserServiceError("invalid_role", "Diese Benutzerrolle ist nicht erlaubt.")
  }

  return role
}

function normalizeStatus(value: unknown, fallback: UserStatus): UserStatus {
  const status = String(value ?? fallback).trim()
  if (!isUserStatus(status)) {
    throw new UserServiceError("invalid_status", "Dieser Benutzerstatus ist nicht erlaubt.")
  }

  return status
}

function toAppUser(user: UserRecord): AppUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role, "user"),
    status: normalizeStatus(user.status, "active"),
    lastLoginAt: user.lastLoginAt,
    invitedAt: user.invitedAt,
    disabledAt: user.disabledAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

export function serializeAppUser(user: AppUser) {
  return {
    ...user,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    invitedAt: user.invitedAt?.toISOString() ?? null,
    disabledAt: user.disabledAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}

async function assertCanActivateUser(context?: UserServiceContext) {
  const status = context?.getLimitStatus
    ? await context.getLimitStatus()
    : await getUserLimitStatus()

  enforceUserLimit(status.activeUsers, status.maxUsers)
  return status
}

async function assertNotLastActiveOwner(
  current: AppUser,
  nextRole: UserRole,
  nextStatus: UserStatus,
  context?: UserServiceContext
) {
  if (current.role !== "owner" || current.status !== "active") return
  if (nextRole === "owner" && nextStatus === "active") return

  const store = getStore(context)
  const remainingOwners = await store.user.count({
    where: {
      role: "owner",
      status: "active",
      id: { not: current.id }
    }
  })

  if (remainingOwners < 1) {
    throw new UserServiceError(
      "last_owner",
      "Der letzte aktive Owner kann nicht entfernt oder deaktiviert werden.",
      409
    )
  }
}

export async function listAppUsers(context?: UserServiceContext): Promise<AppUser[]> {
  const store = getStore(context)
  const users = await store.user.findMany({
    orderBy: [{ createdAt: "asc" }]
  })

  return users.map(toAppUser)
}

export async function createAppUser(
  input: CreateAppUserInput,
  context?: UserServiceContext
): Promise<AppUser> {
  const store = getStore(context)
  const email = normalizeEmail(input.email)
  const name = normalizeName(input.name)
  const role = normalizeRole(input.role, "user")
  const status = normalizeStatus(input.status, "active")
  const now = context?.now?.() ?? new Date()

  if (status === "active") {
    await assertCanActivateUser(context)
  }

  const created = await store.user.create({
    data: {
      email,
      name,
      role,
      status,
      invitedAt: now,
      disabledAt: status === "disabled" ? now : null
    }
  })

  return toAppUser(created)
}

export async function updateAppUser(
  input: UpdateAppUserInput,
  context?: UserServiceContext
): Promise<AppUser> {
  const id = String(input.id ?? "").trim()
  if (!id) {
    throw new UserServiceError("missing_user", "Benutzer fehlt.")
  }

  const store = getStore(context)
  const existing = await store.user.findUnique({ where: { id } })
  if (!existing) {
    throw new UserServiceError("user_not_found", "Benutzer wurde nicht gefunden.", 404)
  }

  const current = toAppUser(existing)
  const nextRole = normalizeRole(input.role, current.role)
  const nextStatus = normalizeStatus(input.status, current.status)
  const nextName = input.name === undefined ? current.name : normalizeName(input.name)
  const now = context?.now?.() ?? new Date()

  await assertNotLastActiveOwner(current, nextRole, nextStatus, context)

  if (current.status !== "active" && nextStatus === "active") {
    await assertCanActivateUser(context)
  }

  const updated = await store.user.update({
    where: { id },
    data: {
      name: nextName,
      role: nextRole,
      status: nextStatus,
      disabledAt: nextStatus === "disabled" ? (current.disabledAt ?? now) : null
    }
  })

  return toAppUser(updated)
}
