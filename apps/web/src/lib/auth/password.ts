import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const PASSWORD_HASH_PREFIX = "scrypt:v1"

export class PasswordError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "PasswordError"
    this.code = code
  }
}

export function assertStrongPassword(password: unknown): string {
  const normalized = String(password ?? "")
  if (normalized.length < 8) {
    throw new PasswordError("weak_password", "Das Passwort muss mindestens 8 Zeichen haben.")
  }

  if (!/[a-z]/.test(normalized) || !/[A-Z]/.test(normalized) || !/[0-9]/.test(normalized)) {
    throw new PasswordError("weak_password", "Das Passwort braucht Grossbuchstaben, Kleinbuchstaben und Zahlen.")
  }

  return normalized
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("base64url")
  const key = await scrypt(password, salt, KEY_LENGTH) as Buffer

  return [PASSWORD_HASH_PREFIX, SCRYPT_N, SCRYPT_R, SCRYPT_P, salt, key.toString("base64url")].join(":")
}

export async function verifyPassword(password: string, passwordHash: string | null | undefined): Promise<boolean> {
  if (!passwordHash) return false

  const [algorithm, version, nValue, rValue, pValue, salt, expectedHash] = passwordHash.split(":")
  if (algorithm !== "scrypt" || version !== "v1" || !salt || !expectedHash) return false

  const n = Number(nValue)
  const r = Number(rValue)
  const p = Number(pValue)
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false

  const expected = Buffer.from(expectedHash, "base64url")
  const actual = await scrypt(password, salt, expected.length) as Buffer

  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
