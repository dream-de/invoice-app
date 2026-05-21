import type { EmailAttachment, EmailDeliveryJob, EmailJobKind, EmailJobPriority, EmailRecipient } from "./types"

type CreateEmailJobInput = {
  kind?: EmailJobKind
  recipients: EmailRecipient[]
  subject: string
  documentId?: string
  requestedBy?: string
  priority?: EmailJobPriority
  locale?: string
  attachments?: EmailAttachment[]
  now?: Date
}

export function createEmailDeliveryJob(input: CreateEmailJobInput): EmailDeliveryJob {
  const now = input.now ?? new Date()
  const jobSubject = input.subject.trim()

  return {
    id: `email-${input.documentId ?? "message"}-${now.getTime()}`,
    kind: input.kind ?? "invoice",
    recipients: input.recipients,
    subject: jobSubject,
    documentId: input.documentId,
    requestedBy: input.requestedBy,
    priority: input.priority ?? "normal",
    locale: input.locale ?? "de-DE",
    attachments: input.attachments ?? [],
    createdAt: now.toISOString()
  }
}
