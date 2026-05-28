import { promises as fs } from "node:fs"
import path from "node:path"
import { NextResponse } from "next/server"
import { appendNotification } from "@/lib/notifications/store"

export const dynamic = "force-dynamic"

const SETTINGS_PATH = path.join(process.cwd(), "data", "email-settings.local.json")
const providers = ["disabled", "smtp", "resend"] as const

type EmailProvider = (typeof providers)[number]

type StoredEmailSettings = {
  provider: EmailProvider
  fromName: string
  fromEmail: string
  replyTo: string
  smtpHost: string
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string
  smtpPassword?: string
  resendApiKey?: string
  updatedAt?: string
}

const defaultSettings: StoredEmailSettings = {
  provider: "disabled",
  fromName: "Dream Invoice",
  fromEmail: "",
  replyTo: "",
  smtpHost: "",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: ""
}

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback
}

function sanitize(settings: StoredEmailSettings) {
  return {
    ...settings,
    smtpPassword: "",
    resendApiKey: "",
    smtpPasswordSet: Boolean(settings.smtpPassword),
    resendApiKeySet: Boolean(settings.resendApiKey)
  }
}

async function readSettings(): Promise<StoredEmailSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8")
    const parsed = JSON.parse(raw) as Partial<StoredEmailSettings>
    const providerValue = String(parsed.provider ?? defaultSettings.provider)
    const provider = providers.includes(providerValue as EmailProvider) ? providerValue as EmailProvider : defaultSettings.provider

    return {
      ...defaultSettings,
      ...parsed,
      provider,
      smtpPort: Number(parsed.smtpPort ?? defaultSettings.smtpPort) || defaultSettings.smtpPort,
      smtpSecure: Boolean(parsed.smtpSecure)
    }
  } catch {
    return defaultSettings
  }
}

export async function GET() {
  const settings = await readSettings()
  return NextResponse.json({ ok: true, settings: sanitize(settings) })
}

export async function PUT(request: Request) {
  try {
    const current = await readSettings()
    const data = await request.json().catch(() => ({}))
    const providerValue = String(data.provider ?? current.provider)
    const provider = providers.includes(providerValue as EmailProvider) ? providerValue as EmailProvider : "disabled"
    const smtpPort = Number(data.smtpPort ?? current.smtpPort)

    if (!Number.isFinite(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      return NextResponse.json({ ok: false, error: "SMTP-Port ist ungueltig." }, { status: 400 })
    }

    const next: StoredEmailSettings = {
      provider,
      fromName: cleanString(data.fromName, current.fromName),
      fromEmail: cleanString(data.fromEmail, current.fromEmail),
      replyTo: cleanString(data.replyTo, current.replyTo),
      smtpHost: cleanString(data.smtpHost, current.smtpHost),
      smtpPort,
      smtpSecure: Boolean(data.smtpSecure),
      smtpUser: cleanString(data.smtpUser, current.smtpUser),
      smtpPassword: cleanString(data.smtpPassword) || current.smtpPassword,
      resendApiKey: cleanString(data.resendApiKey) || current.resendApiKey,
      updatedAt: new Date().toISOString()
    }

    if (next.provider === "disabled") {
      delete next.smtpPassword
      delete next.resendApiKey
    }

    if (next.provider !== "disabled" && !next.fromEmail) {
      return NextResponse.json({ ok: false, error: "Absender-E-Mail ist erforderlich." }, { status: 400 })
    }

    if (next.provider === "smtp" && !next.smtpHost) {
      return NextResponse.json({ ok: false, error: "SMTP-Host ist erforderlich." }, { status: 400 })
    }

    await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2))
    await appendNotification({
      category: "settings",
      tone: next.provider === "disabled" ? "warning" : "success",
      title: next.provider === "disabled" ? "E-Mail-Versand deaktiviert" : "E-Mail-Versand konfiguriert",
      message: next.provider === "disabled"
        ? "Rechnungen koennen erst wieder nach Aktivierung per E-Mail versendet werden."
        : "Provider: " + next.provider,
      href: "/settings/email",
      source: "settings:email:" + next.updatedAt
    }).catch(() => null)

    return NextResponse.json({ ok: true, settings: sanitize(next) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "E-Mail-Einstellungen konnten nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
