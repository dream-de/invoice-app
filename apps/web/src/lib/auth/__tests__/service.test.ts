import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { hashPassword } from "../password"
import { authenticateAppUser, createInitialOwner, getSessionUserFromToken } from "../service"

type StoredUser = {
  id: string
  name: string | null
  email: string
  role: string
  status: string
  passwordHash: string | null
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
  it("creates the initial owner only while setup is open", async () => {
    const { store, users } = createStore()
    const owner = await createInitialOwner(
      { name: "Owner", email: "ADMIN@example.com", password: "SecurePass123" },
      { store }
    )

    assert.equal(owner.email, "admin@example.com")
    assert.equal(owner.role, "owner")
    assert.equal(users[0].passwordHash?.startsWith("scrypt:v1"), true)

    await assert.rejects(
      createInitialOwner({ email: "second@example.test", password: "SecurePass123" }, { store }),
      /bereits geschlossen/
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
