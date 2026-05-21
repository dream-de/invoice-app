import { promises as fs } from "node:fs"
import path from "node:path"

const EMAIL_LOG_PATH = path.join(process.cwd(), "data", "email-delivery-log.local.json")
const MAX_LOG_ENTRIES = 250

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
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString()
  }

  await fs.mkdir(path.dirname(EMAIL_LOG_PATH), { recursive: true })
  await fs.writeFile(EMAIL_LOG_PATH, JSON.stringify([next, ...entries].slice(0, MAX_LOG_ENTRIES), null, 2))

  return next
}

export async function listEmailDeliveryLog(filter?: { documentId?: string; limit?: number }) {
  const entries = await readEntries()
  const filtered = filter?.documentId
    ? entries.filter((entry) => entry.documentId === filter.documentId)
    : entries

  return filtered.slice(0, filter?.limit ?? 50)
}
