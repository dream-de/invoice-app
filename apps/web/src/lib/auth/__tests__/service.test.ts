import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { hashPassword } from "../password"
import { authenticateAppUser, createInitialAdmin, getSessionUserFromToken } from "../service"

type StoredUser = {
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
}

type StoreArgs = {
  where?: { id?: string; email?: string }
  data?: Record<string, unknown>
}

function createStore(initialUsers: StoredUser[] = []) {
  const users = [...initialUsers]

  return {
    users,
    store: {
      user: {
        async count() {
          return users.length
        },
        async findMany() {
          return [...users].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        },
        async findUnique(args: StoreArgs) {
          const where = args.where ?? {}
          if (where.id) return users.find((user) => user.id === where.id) ?? null
          if (where.email) return users.find((user) => user.email === where.email) ?? null
          return null
        },
        async create(args: StoreArgs) {
          if (!args.data) throw new Error("missing data")
          const now = new Date("2026-05-26T10:00:00.000Z")
          const user: StoredUser = {
            id: `user_${users.length + 1}`,
            name: typeof args.data.name === "string" ? args.data.name : null,
            email: String(args.data.email),
            role: String(args.data.role),
            status: String(args.data.status),
            passwordHash: typeof args.data.passwordHash === "string" ? args.data.passwordHash : null,
            emailVerifiedAt: args.data.emailVerifiedAt instanceof Date ? args.data.emailVerifiedAt : null,
            emailVerificationTokenHash: typeof args.data.emailVerificationTokenHash === "string" ? args.data.emailVerificationTokenHash : null,
            emailVerificationTokenExpiresAt: args.data.emailVerificationTokenExpiresAt instanceof Date ? args.data.emailVerificationTokenExpiresAt : null,
            twoFactorSecret: null,
            twoFactorEnabledAt: null,
            twoFactorBackupCodes: null,
            lastLoginAt: null,
            invitedAt: args.data.invitedAt instanceof Date ? args.data.invitedAt : null,
            disabledAt: null,
            createdAt: now,
            updatedAt: now
          }
          users.push(user)
          return user
        },
        async update(args: StoreArgs) {
          if (!args.data) throw new Error("missing data")
          const index = users.findIndex((user) => user.id === args.where?.id)
          if (index < 0) throw new Error("missing user")
          users[index] = {
            ...users[index],
            ...args.data,
            updatedAt: new Date("2026-05-26T10:30:00.000Z")
          } as StoredUser
          return users[index]
        }
      }
    }
  }
}

describe("auth service", () => {
  it("creates the initial admin only while setup is open", async () => {
    const { store, users } = createStore()
    const { user: admin, verificationToken } = await createInitialAdmin(
      { name: "Admin", email: "ADMIN@example.com", password: "SecurePass123" },
      { store }
    )

    assert.equal(admin.email, "admin@example.com")
    assert.equal(admin.role, "admin")
    assert.equal(admin.status, "inactive")
    assert.equal(typeof verificationToken, "string")
    assert.equal(users[0].passwordHash?.startsWith("scrypt:v1"), true)

    await assert.rejects(
      createInitialAdmin({ email: "second@example.test", password: "SecurePass123" }, { store }),
      /bereits geschlossen/
    )
  })

  it("creates an active initial admin when email verification is disabled", async () => {
    const { store, users } = createStore()
    const { user: admin, verificationToken } = await createInitialAdmin(
      { name: "Admin", email: "admin@example.com", password: "SecurePass123" },
      { store, requireEmailVerification: false, now: () => new Date("2026-05-26T11:00:00.000Z") }
    )

    assert.equal(admin.email, "admin@example.com")
    assert.equal(admin.role, "admin")
    assert.equal(admin.status, "active")
    assert.equal(admin.emailVerifiedAt?.toISOString(), "2026-05-26T11:00:00.000Z")
    assert.equal(verificationToken, null)
    assert.equal(users[0].passwordHash?.startsWith("scrypt:v1"), true)
    assert.equal(users[0].emailVerificationTokenHash, null)
    assert.equal(users[0].emailVerificationTokenExpiresAt, null)
  })

  it("rejects reserved Dream Invoice emails during setup", async () => {
    const { store } = createStore()

    await assert.rejects(
      createInitialAdmin({ name: "Admin", email: "admin@dream-invoice.com", password: "SecurePass123" }, { store }),
      /lokale Benutzer nicht erlaubt/
    )
  })

  it("authenticates active users and creates a reusable session", async () => {
    const passwordHash = await hashPassword("SecurePass123")
    const now = new Date("2026-05-26T10:00:00.000Z")
    const { store } = createStore([
      {
        id: "user_1",
        name: "User",
        email: "user@example.test",
        role: "admin",
        status: "active",
        passwordHash,
        emailVerifiedAt: now,
        lastLoginAt: null,
        invitedAt: null,
        disabledAt: null,
        createdAt: now,
        updatedAt: now
      }
    ])

    const result = await authenticateAppUser(
      { email: "USER@example.test", password: "SecurePass123" },
      { store, secret: "test-secret", now: () => now }
    )

    assert.equal(result.user.email, "user@example.test")
    assert.equal(result.user.role, "admin")
    assert.equal(result.requiresTwoFactor, false)
    assert.equal((await getSessionUserFromToken(result.token, { store, secret: "test-secret", now: () => now }))?.id, "user_1")
  })

  it("rejects inactive users and wrong passwords", async () => {
    const passwordHash = await hashPassword("SecurePass123")
    const now = new Date("2026-05-26T10:00:00.000Z")
    const { store } = createStore([
      {
        id: "user_1",
        name: "User",
        email: "user@example.test",
        role: "user",
        status: "inactive",
        passwordHash,
        emailVerifiedAt: null,
        lastLoginAt: null,
        invitedAt: null,
        disabledAt: null,
        createdAt: now,
        updatedAt: now
      }
    ])

    await assert.rejects(
      authenticateAppUser({ email: "user@example.test", password: "SecurePass123" }, { store, secret: "test-secret" }),
      /ungueltig/
    )
    await assert.rejects(
      authenticateAppUser({ email: "user@example.test", password: "WrongPass123" }, { store, secret: "test-secret" }),
      /ungueltig/
    )
  })
})