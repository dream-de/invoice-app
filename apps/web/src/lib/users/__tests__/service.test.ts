import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  createAppUser,
  deleteAppUser,
  listAppUsers,
  serializeAppUser,
  updateAppUser,
  UserServiceError,
  type AppUser
} from "../service"

function date(value: string) {
  return new Date(value)
}

type StoredUser = AppUser

type StoreArgs = {
  where?: {
    id?: string | { not?: string }
    role?: string
    status?: string
  }
  data?: Record<string, unknown>
}

function getWhere(args?: StoreArgs) {
  return args?.where ?? {}
}

function createStore(initialUsers: StoredUser[]) {
  const users = [...initialUsers]

  return {
    users,
    store: {
      user: {
        async count(args?: StoreArgs) {
          const where = getWhere(args)
          return users.filter((user) => {
            if (where.status && user.status !== where.status) return false
            if (where.role && user.role !== where.role) return false
            if (typeof where.id === "object" && where.id?.not && user.id === where.id.not) return false
            return true
          }).length
        },
        async findMany() {
          return [...users].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        },
        async findUnique(args: StoreArgs) {
          const where = getWhere(args)
          return users.find((user) => user.id === where.id) ?? null
        },
        async create(args: StoreArgs) {
          if (!args.data) throw new Error("missing data")
          if (users.some((user) => user.email === args.data?.email)) {
            const error = new Error("unique") as Error & { code: string }
            error.code = "P2002"
            throw error
          }

          const now = date("2026-05-26T10:00:00.000Z")
          const user: StoredUser = {
            id: "user_" + (users.length + 1),
            name: typeof args.data.name === "string" ? args.data.name : null,
            email: String(args.data.email),
            role: String(args.data.role) as StoredUser["role"],
            status: String(args.data.status) as StoredUser["status"],
            lastLoginAt: null,
            invitedAt: args.data.invitedAt instanceof Date ? args.data.invitedAt : null,
            disabledAt: args.data.disabledAt instanceof Date ? args.data.disabledAt : null,
            permissions: typeof args.data.permissions === "object" && args.data.permissions !== null && "create" in args.data.permissions && Array.isArray(args.data.permissions.create)
              ? args.data.permissions.create as StoredUser["permissions"]
              : [],
            createdAt: now,
            updatedAt: now
          }
          users.push(user)
          return user
        },
        async update(args: StoreArgs) {
          if (!args.data) throw new Error("missing data")
          const where = getWhere(args)
          const index = users.findIndex((user) => user.id === where.id)
          if (index < 0) throw new Error("missing")
          users[index] = {
            ...users[index],
            name: typeof args.data.name === "string" || args.data.name === null ? args.data.name : users[index].name,
            email: typeof args.data.email === "string" ? args.data.email : users[index].email,
            role: typeof args.data.role === "string" ? args.data.role as StoredUser["role"] : users[index].role,
            status: typeof args.data.status === "string" ? args.data.status as StoredUser["status"] : users[index].status,
            permissions: typeof args.data.permissions === "object" && args.data.permissions !== null && "create" in args.data.permissions && Array.isArray(args.data.permissions.create)
              ? args.data.permissions.create as StoredUser["permissions"]
              : users[index].permissions,
            disabledAt: args.data.disabledAt instanceof Date || args.data.disabledAt === null ? args.data.disabledAt : users[index].disabledAt,
            updatedAt: date("2026-05-26T10:30:00.000Z")
          }
          return users[index]
        },
        async delete(args: StoreArgs) {
          const where = getWhere(args)
          const index = users.findIndex((user) => user.id === where.id)
          if (index < 0) throw new Error("missing")
          const [deleted] = users.splice(index, 1)
          return deleted
        }
      }
    }
  }
}

const admin: AppUser = {
  id: "admin_1",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
  status: "active",
  lastLoginAt: null,
  invitedAt: null,
  disabledAt: null,
  permissions: [],
  createdAt: date("2026-05-26T08:00:00.000Z"),
  updatedAt: date("2026-05-26T08:00:00.000Z")
}

describe("app user service", () => {
  it("creates active users through the central license limit check", async () => {
    const { store } = createStore([admin])
    const user = await createAppUser(
      { email: "  NEU@example.test ", name: "Neue Person" },
      {
        store,
        getLimitStatus: async () => ({
          activeUsers: 1,
          maxUsers: 5,
          remainingUsers: 4,
          limitReached: false,
          plan: "free",
          billingCycle: "free",
          status: "active",
          validUntil: null
        }),
        now: () => date("2026-05-26T09:00:00.000Z")
      }
    )

    assert.equal(user.email, "neu@example.test")
    assert.equal(user.role, "user")
    assert.equal(user.status, "active")
    assert.equal(user.invitedAt?.toISOString(), "2026-05-26T09:00:00.000Z")
  })

  it("blocks active user creation when the license limit is reached", async () => {
    const { store } = createStore([admin])

    await assert.rejects(
      createAppUser(
        { email: "blocked@example.test" },
        {
          store,
          getLimitStatus: async () => ({
            activeUsers: 5,
            maxUsers: 5,
            remainingUsers: 0,
            limitReached: true,
            plan: "free",
            billingCycle: "free",
            status: "active",
            validUntil: null
          })
        }
      ),
      /Benutzerlimit erreicht/
    )
  })

  it("rejects removed roles for new writes", async () => {
    const { store } = createStore([admin])

    await assert.rejects(
      createAppUser({ email: "accounting@example.test", role: "accountant", status: "inactive" }, { store }),
      (error: unknown) =>
        error instanceof UserServiceError && error.code === "invalid_role"
    )
  })

  it("blocks local users with the reserved Dream Invoice domain", async () => {
    const { store } = createStore([admin])

    await assert.rejects(
      createAppUser(
        { email: "owner@dream-invoice.com" },
        {
          store,
          getLimitStatus: async () => ({
            activeUsers: 1,
            maxUsers: 5,
            remainingUsers: 4,
            limitReached: false,
            plan: "free",
            billingCycle: "free",
            status: "active",
            validUntil: null
          })
        }
      ),
      (error: unknown) =>
        error instanceof UserServiceError && error.code === "reserved_email_domain"
    )

    await assert.rejects(
      createAppUser({ email: "owner@mail.dream-invoice.com", status: "inactive" }, { store }),
      (error: unknown) =>
        error instanceof UserServiceError && error.code === "reserved_email_domain"
    )
  })

  it("allows inactive invites without consuming an active user slot", async () => {
    const { store } = createStore([admin])
    const user = await createAppUser(
      { email: "invite@example.test", status: "inactive" },
      {
        store,
        getLimitStatus: async () => {
          throw new Error("limit should not be checked for inactive users")
        }
      }
    )

    assert.equal(user.status, "inactive")
  })

  it("checks the license before activating an inactive user", async () => {
    const invited = { ...admin, id: "user_2", email: "invite@example.test", role: "user" as const, status: "inactive" as const }
    const { store } = createStore([admin, invited])

    await assert.rejects(
      updateAppUser(
        { id: "user_2", status: "active" },
        {
          store,
          getLimitStatus: async () => ({
            activeUsers: 5,
            maxUsers: 5,
            remainingUsers: 0,
            limitReached: true,
            plan: "free",
            billingCycle: "free",
            status: "active",
            validUntil: null
          })
        }
      ),
      /Benutzerlimit erreicht/
    )
  })

  it("keeps at least one active admin", async () => {
    const { store } = createStore([admin])

    await assert.rejects(
      updateAppUser({ id: "admin_1", role: "user" }, { store }),
      (error: unknown) =>
        error instanceof UserServiceError && error.code === "last_admin"
    )
  })

  it("blocks deleting the last active admin", async () => {
    const { store } = createStore([admin])

    await assert.rejects(
      deleteAppUser({ id: "admin_1" }, { store }),
      (error: unknown) =>
        error instanceof UserServiceError && error.code === "last_admin"
    )
  })

  it("allows admin email updates", async () => {
    const secondAdmin = { ...admin, id: "admin_2", email: "second@example.test" }
    const { store } = createStore([admin, secondAdmin])
    const updated = await updateAppUser({ id: "admin_2", email: " Updated@Example.test " }, { store })

    assert.equal(updated.email, "updated@example.test")
  })

  it("serializes users without exposing password hashes", async () => {
    const { store } = createStore([admin])
    const [user] = await listAppUsers({ store })
    const serialized = serializeAppUser(user)

    assert.equal(serialized.createdAt, "2026-05-26T08:00:00.000Z")
    assert.equal("passwordHash" in serialized, false)
  })

  it("stores explicit permissions for regular users", async () => {
    const { store } = createStore([admin])
    const user = await createAppUser(
      {
        email: "permissions@example.test",
        status: "inactive",
        permissions: [
          { scope: "documents", action: "view", allowed: true },
          { scope: "archive", action: "use", allowed: true }
        ]
      },
      { store }
    )

    assert.deepEqual(user.permissions, [
      { scope: "documents", action: "view", allowed: true },
      { scope: "archive", action: "use", allowed: true }
    ])

    const updated = await updateAppUser(
      {
        id: user.id,
        permissions: [{ scope: "finance", action: "view", allowed: true }]
      },
      { store }
    )

    assert.deepEqual(updated.permissions, [
      { scope: "finance", action: "view", allowed: true }
    ])
  })
})
