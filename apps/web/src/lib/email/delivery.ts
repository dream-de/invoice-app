import { promises as fs } from "node:fs"
import path from "node:path"
import nodemailer from "nodemailer"

const EMAIL_SETTINGS_PATH = path.join(process.cwd(), "data", "email-settings.local.json")

type EmailProvider = "disabled" | "smtp" | "resend"

export type EmailSettings = {
  provider?: EmailProvider
  fromName?: string
  fromEmail?: string
  replyTo?: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string
  resendApiKey?: string
}

type EmailAttachment = {
  filename: string
  content: Buffer
  contentType?: string
}

type SendEmailInput = {
  to: string
  subject: string
  text: string
  attachments?: EmailAttachment[]
}

export function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function readEmailSettings(): Promise<EmailSettings> {
  try {
    const raw = await fs.readFile(EMAIL_SETTINGS_PATH, "utf8")
    return JSON.parse(raw) as EmailSettings
  } catch {
    return { provider: "disabled" }
  }
}

function formatFrom(settings: EmailSettings) {
  const email = cleanString(settings.fromEmail)
  const name = cleanString(settings.fromName).replaceAll("\"", "")

  return name ? `${name} <${email}>` : email
}

function validateBase(settings: EmailSettings, input: SendEmailInput) {
  if (!settings.provider || settings.provider === "disabled") {
    throw new Error("E-Mail-Versand ist deaktiviert. Bitte zuerst unter Einstellungen > E-Mail aktivieren.")
  }

  if (!isEmail(input.to)) {
    throw new Error("Bitte eine gueltige Empfaenger-E-Mail eintragen.")
  }

  if (!cleanString(input.subject)) {
    throw new Error("Bitte einen Betreff eintragen.")
  }

  if (!settings.fromEmail || !isEmail(settings.fromEmail)) {
    throw new Error("Absender-E-Mail fehlt in den E-Mail-Einstellungen.")
  }
}

async function sendWithSmtp(settings: EmailSettings, input: SendEmailInput) {
  const host = cleanString(settings.smtpHost)
  const port = Number(settings.smtpPort || 587)

  if (!host) {
    throw new Error("SMTP-Host fehlt in den E-Mail-Einstellungen.")
  }

  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error("SMTP-Port ist ungueltig.")
  }

  const smtpUser = cleanString(settings.smtpUser)
  const smtpPassword = cleanString(settings.smtpPassword)
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: Boolean(settings.smtpSecure),
    auth: smtpUser ? { user: smtpUser, pass: smtpPassword } : undefined,
    disableFileAccess: true,
    disableUrlAccess: true
  })

  const result = await transport.sendMail({
    from: formatFrom(settings),
    to: input.to,
    replyTo: cleanString(settings.replyTo) || undefined,
    subject: input.subject,
    text: input.text,
    attachments: input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType
    })),
    disableFileAccess: true,
    disableUrlAccess: true
  })

  return { provider: "smtp" as const, id: result.messageId || null }
}

async function sendWithResend(settings: EmailSettings, input: SendEmailInput) {
  if (!settings.resendApiKey) {
    throw new Error("Resend API-Key fehlt in den E-Mail-Einstellungen.")
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: formatFrom(settings),
      to: [input.to],
      reply_to: cleanString(settings.replyTo) || undefined,
      subject: input.subject,
      text: input.text,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString("base64"),
        content_type: attachment.contentType
      }))
    })
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(result?.message || "E-Mail konnte nicht ueber Resend gesendet werden.")
  }

  return { provider: "resend" as const, id: result?.id ?? null }
}

export async function sendEmail(input: SendEmailInput) {
  const settings = await readEmailSettings()
  validateBase(settings, input)

  if (settings.provider === "smtp") {
    return sendWithSmtp(settings, input)
  }

  return sendWithResend(settings, input)
}
