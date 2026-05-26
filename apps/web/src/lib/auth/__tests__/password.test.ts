import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { assertStrongPassword, hashPassword, verifyPassword } from "../password"

describe("password hashing", () => {
  it("hashes and verifies a password without storing the clear text", async () => {
    const password = "SecurePass123"
    const passwordHash = await hashPassword(password)

    assert.notEqual(passwordHash, password)
    assert.equal(await verifyPassword(password, passwordHash), true)
    assert.equal(await verifyPassword("wrong-password", passwordHash), false)
  })

  it("requires a strong setup password", () => {
    assert.throws(() => assertStrongPassword("short"), /mindestens 12/)
    assert.throws(() => assertStrongPassword("lowercaseonlypassword"), /Grossbuchstaben/)
    assert.equal(assertStrongPassword("SecurePass123"), "SecurePass123")
  })
})
