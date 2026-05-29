import { promises as fs } from "node:fs"
import path from "node:path"
import { isDemoMode } from "@/lib/demo-mode"
import { appendNotification } from "@/lib/notifications/store"

const EMAIL_LOG_PATH = path.join(process.cwd(), "data", "email-delivery-log.local.json")
const MAX_LOG_ENTRIES = 250
const MAX_LOG_FIELD_LENGTH = 500

function limitLogField(value: string | undefined) {
  if (!value) return value
  return value.length > MAX_LOG_FIELD_LENGTH
    ? value.slice(0, MAX_LOG_FIELD_LENGTH) + "..."
    : value
}

export function maskEmailAddress(value: string) {
  const email = String(value ?? "").trim()
  const at = email.lastIndexOf("@")
  if (at <= 0) return email ? "***" : ""

  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const visible = local.slice(0, Math.min(2, local.length))

  return visible + "***@" + domain
}

export type EmailDeliveryLogEntry = {
  id: string
  createdAt: string
  type: "test" | "invoice"
  status: "success" | "error"
  provider?: "smtp" | "resend" | "disabled" | "unknown"
  to: string
  subject: string
  documentId?: string
  documentNumber?: string
  messageId?: string | null
  error?: string
}

async function readEntries(): Promise<EmailDeliveryLogEntry[]> {
  if (isDemoMode()) return []

  try {
    const raw = await fs.readFile(EMAIL_LOG_PATH, "utf8")
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data as EmailDeliveryLogEntry[] : []
  } catch {
    return []
  }
}

export async function appendEmailDeliveryLog(entry: Omit<EmailDeliveryLogEntry, "id" | "createdAt">) {
  const entries = await readEntries()
  const next: EmailDeliveryLogEntry = {
    ...entry,
    to: limitLogField(maskEmailAddress(entry.to)) ?? "",
    subject: limitLogField(entry.subject) ?? "",
    error: limitLogField(entry.error),
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString()
  }

  if (isDemoMode()) {
    void entries
  } else {
    await fs.mkdir(path.dirname(EMAIL_LOG_PATH), { recursive: true })
    await fs.writeFile(EMAIL_LOG_PATH, JSON.stringify([next, ...entries].slice(0, MAX_LOG_ENTRIES), null, 2))
  }
  await appendNotification({
    category: "email",
    tone: next.status === "success" ? "success" : "warning",
    title: next.status === "success"
      ? (next.type === "test" ? "Test-E-Mail gesendet" : "Rechnung per E-Mail gesendet")
      : (next.type === "test" ? "Test-E-Mail fehlgeschlagen" : "E-Mail-Versand fehlgeschlagen"),
    message: next.status === "success"
      ? [next.subject, next.to].filter(Boolean).join(" · ")
      : next.error || [next.subject, next.to].filter(Boolean).join(" · "),
    href: next.documentId ? "/documents/" + next.documentId : "/settings/email",
    source: next.id
  }).catch(() => null)

  return next
}

export async function listEmailDeliveryLog(filter?: { documentId?: string; limit?: number }) {
  const entries = await readEntries()
  const filtered = filter?.documentId
    ? entries.filter((entry) => entry.documentId === filter.documentId)
    : entries

  return filtered.slice(0, filter?.limit ?? 50)
}
