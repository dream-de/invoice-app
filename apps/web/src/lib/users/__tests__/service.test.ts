import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  createAppUser,
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
            role: typeof args.data.role === "string" ? args.data.role as StoredUser["role"] : users[index].role,
            status: typeof args.data.status === "string" ? args.data.status as StoredUser["status"] : users[index].status,
            disabledAt: args.data.disabledAt instanceof Date || args.data.disabledAt === null ? args.data.disabledAt : users[index].disabledAt,
            updatedAt: date("2026-05-26T10:30:00.000Z")
          }
          return users[index]
        }
      }
    }
  }
}

const owner: AppUser = {
  id: "owner_1",
  name: "Owner",
  email: "admin@example.com",
  role: "owner",
  status: "active",
  lastLoginAt: null,
  invitedAt: null,
  disabledAt: null,
  createdAt: date("2026-05-26T08:00:00.000Z"),
  updatedAt: date("2026-05-26T08:00:00.000Z")
}

describe("app user service", () => {
  it("creates active users through the central license limit check", async () => {
    const { store } = createStore([owner])
    const user = await createAppUser(
      { email: "  NEU@example.test ", name: "Neue Person", role: "accountant" },
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
    assert.equal(user.role, "accountant")
    assert.equal(user.status, "active")
    assert.equal(user.invitedAt?.toISOString(), "2026-05-26T09:00:00.000Z")
  })

  it("blocks active user creation when the license limit is reached", async () => {
    const { store } = createStore([owner])

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

  it("allows inactive invites without consuming an active user slot", async () => {
    const { store } = createStore([owner])
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
    const invited = { ...owner, id: "user_2", email: "invite@example.test", role: "user" as const, status: "inactive" as const }
    const { store } = createStore([owner, invited])

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

  it("keeps at least one active owner", async () => {
    const { store } = createStore([owner])

    await assert.rejects(
      updateAppUser({ id: "owner_1", role: "admin" }, { store }),
      (error: unknown) =>
        error instanceof UserServiceError && error.code === "last_owner"
    )
  })

  it("serializes users without exposing password hashes", async () => {
    const { store } = createStore([owner])
    const [user] = await listAppUsers({ store })
    const serialized = serializeAppUser(user)

    assert.equal(serialized.createdAt, "2026-05-26T08:00:00.000Z")
    assert.equal("passwordHash" in serialized, false)
  })
})
