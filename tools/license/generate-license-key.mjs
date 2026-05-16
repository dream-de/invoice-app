import { createSign } from "node:crypto"

const allowedPlans = new Map([
  ["free", 5],
  ["starter", 10],
  ["team", 25],
  ["business", 50],
  ["enterprise", 100],
  ["unlimited", null]
])

function readArg(name, fallback = null) {
  const prefix = `--${name}=`
  const arg = process.argv.find((value) => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : fallback
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const privateKey = process.env.LICENSE_PRIVATE_KEY
const plan = readArg("plan", "starter")
const billingCycle = readArg("billing", "monthly")
const customerName = readArg("customer", "Demo Kunde")
const days = Number(readArg("days", billingCycle === "yearly" ? "365" : "30"))

if (!privateKey) {
  console.error("LICENSE_PRIVATE_KEY fehlt. Private Key niemals ins Repo schreiben.")
  process.exit(1)
}

if (!allowedPlans.has(plan)) {
  console.error(`Plan ungueltig: ${plan}`)
  console.error(`Erlaubt: ${Array.from(allowedPlans.keys()).join(", ")}`)
  process.exit(1)
}

if (!["monthly", "yearly", "custom"].includes(billingCycle)) {
  console.error("Billing ungueltig. Erlaubt: monthly, yearly, custom")
  process.exit(1)
}

const now = new Date()
const validUntil = plan === "unlimited" && billingCycle === "custom"
  ? null
  : addDays(now, Number.isFinite(days) && days > 0 ? days : 30).toISOString()

const payload = {
  version: 1,
  licenseId: crypto.randomUUID(),
  plan,
  maxUsers: allowedPlans.get(plan),
  billingCycle,
  issuedAt: now.toISOString(),
  validUntil,
  customerName
}

const payloadPart = base64Url(JSON.stringify(payload))
const signer = createSign("RSA-SHA256")
signer.update(payloadPart)
signer.end()

const signaturePart = signer
  .sign(privateKey)
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/g, "")

console.log(`INV1.${payloadPart}.${signaturePart}`)
