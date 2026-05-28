import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
const TOTP_STEP_SECONDS = 30
const TOTP_DIGITS = 6

export function createTwoFactorSecret() {
  const bytes = randomBytes(20)
  let bits = ""
  let output = ""

  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0")
  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0")
    output += BASE32_ALPHABET[parseInt(chunk, 2)]
  }

  return output
}

function decodeBase32(value: string) {
  const normalized = value.replace(/=+$/g, "").replace(/\s+/g, "").toUpperCase()
  let bits = ""
  const bytes: number[] = []

  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char)
    if (index < 0) continue
    bits += index.toString(2).padStart(5, "0")
  }

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2))
  }

  return Buffer.from(bytes)
}

function hotp(secret: string, counter: number) {
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac("sha1", decodeBase32(secret)).update(buffer).digest()
  const offset = digest[digest.length - 1] & 0xf
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)

  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, "0")
}

export function verifyTotpCode(secret: string, code: unknown, now = new Date()) {
  const normalized = String(code ?? "").replace(/\s+/g, "")
  if (!/^\d{6}$/.test(normalized)) return false

  const currentCounter = Math.floor(now.getTime() / 1000 / TOTP_STEP_SECONDS)
  for (const drift of [-1, 0, 1]) {
    const expected = hotp(secret, currentCounter + drift)
    if (
      expected.length === normalized.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))
    ) {
      return true
    }
  }

  return false
}

export function createOtpAuthUri(input: { email: string; issuer?: string; secret: string }) {
  const issuer = input.issuer ?? "Dream Invoice"
  const label = `${issuer}:${input.email}`
  const params = new URLSearchParams({
    secret: input.secret,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS)
  })

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`
}

export function createBackupCodes() {
  return Array.from({ length: 8 }, () => randomBytes(5).toString("hex").toUpperCase().match(/.{1,5}/g)?.join("-") ?? "")
}
