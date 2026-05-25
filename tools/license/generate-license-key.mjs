import { createSign, randomUUID } from "node:crypto"

const allowedPlans = new Map([
  ["free", 5],
  ["starter", 10],
  ["pro", 15],
  ["team", 25],
  ["business", 50],
  ["enterprise", 100],
  ["unlimited", 1000000]
])

const allowedBillingCycles = ["free", "monthly", "yearly", "custom"]
const allowedEditions = ["self-hosted", "desktop", "cloud"]

function readArg(name, fallback = null) {
  const prefix = `--${name}=`
  const arg = process.argv.find((value) => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : fallback
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

function base64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return "[" + value.map((item) => canonicalize(item)).join(",") + "]"
  }

  if (typeof value === "object" && value !== null) {
    return "{" + Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => JSON.stringify(key) + ":" + canonicalize(value[key]))
      .join(",") + "}"
  }

  return JSON.stringify(value)
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function parsePositiveInteger(value, fieldName) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.error(`${fieldName} muss eine positive Ganzzahl sein.`)
    process.exit(1)
  }
  return parsed
}

function parseFeatureOverrides(value) {
  if (!value) return undefined

  return Object.fromEntries(
    value
      .split(",")
      .map((feature) => feature.trim())
      .filter(Boolean)
      .map((feature) => [feature, true])
  )
}

function sign(input, privateKey) {
  const signer = createSign("RSA-SHA256")
  signer.update(input)
  signer.end()

  return signer.sign(privateKey).toString("base64")
}

if (hasFlag("help")) {
  console.log(`Dream Invoice Lizenz erzeugen

Beispiel:
  LICENSE_PRIVATE_KEY="$(cat private-license-key.pem)" node tools/license/generate-license-key.mjs --plan=pro --billing=yearly --days=365 --customer="Demo GmbH"

Optionen:
  --plan=free|starter|pro|team|business|enterprise|unlimited
  --billing=free|monthly|yearly|custom
  --edition=self-hosted|desktop|cloud
  --days=365
  --users=15
  --customer="Demo GmbH"
  --customer-id=cust_123
  --features=datevExport,apiAccess
  --format=json|compact
`)
  process.exit(0)
}

const privateKey = process.env.LICENSE_PRIVATE_KEY
const plan = readArg("plan", "starter")
const billingCycle = readArg("billing", plan === "free" ? "free" : "monthly")
const edition = readArg("edition", "self-hosted")
const customerName = readArg("customer", "Demo Kunde")
const customerId = readArg("customer-id")
const licenseId = readArg("license-id", randomUUID())
const days = readArg("days", billingCycle === "yearly" ? "365" : "30")
const users = readArg("users")
const format = readArg("format", "json")
const featureOverrides = parseFeatureOverrides(readArg("features"))

if (!privateKey) {
  console.error("LICENSE_PRIVATE_KEY fehlt. Private Key niemals ins Repo schreiben.")
  process.exit(1)
}

if (!allowedPlans.has(plan)) {
  console.error(`Plan ungueltig: ${plan}`)
  console.error(`Erlaubt: ${Array.from(allowedPlans.keys()).join(", ")}`)
  process.exit(1)
}

if (!allowedBillingCycles.includes(billingCycle)) {
  console.error(`Billing ungueltig. Erlaubt: ${allowedBillingCycles.join(", ")}`)
  process.exit(1)
}

if (!allowedEditions.includes(edition)) {
  console.error(`Edition ungueltig. Erlaubt: ${allowedEditions.join(", ")}`)
  process.exit(1)
}

if (!["json", "compact"].includes(format)) {
  console.error("Format ungueltig. Erlaubt: json, compact")
  process.exit(1)
}

const now = new Date()
const maxUsers = users ? parsePositiveInteger(users, "--users") : allowedPlans.get(plan)
const validUntil = plan === "unlimited" && billingCycle === "custom"
  ? null
  : addDays(now, parsePositiveInteger(days, "--days")).toISOString()

const payload = {
  version: 1,
  licenseId,
  plan,
  edition,
  billingCycle,
  customer: {
    id: customerId ?? undefined,
    name: customerName
  },
  customerName,
  maxUsers,
  limits: {
    users: maxUsers
  },
  features: featureOverrides,
  issuedAt: now.toISOString(),
  expiresAt: validUntil,
  validUntil,
  meta: {
    issuedBy: "dream-invoice-license-tool"
  }
}

if (format === "compact") {
  const payloadPart = base64Url(JSON.stringify(payload))
  const signaturePart = sign(payloadPart, privateKey)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")

  console.log(`INV1.${payloadPart}.${signaturePart}`)
  process.exit(0)
}

const envelope = {
  payload,
  signature: sign(canonicalize(payload), privateKey),
  algorithm: "RSA-SHA256"
}

console.log(JSON.stringify(envelope, null, 2))
