export type EmailJobKind = "invoice" | "offer" | "reminder" | "test"

export type EmailJobPriority = "low" | "normal" | "high"

export type EmailRecipient = {
  email: string
  name?: string
}

export type EmailAttachment = {
  fileName: string
  contentType: string
  source: "generated-pdf" | "uploaded-file" | "external-url"
  referenceId: string
}

export type EmailDeliveryJob = {
  id: string
  kind: EmailJobKind
  recipients: EmailRecipient[]
  subject: string
  documentId?: string
  requestedBy?: string
  priority: EmailJobPriority
  locale: string
  attachments: EmailAttachment[]
  createdAt: string
}

export type EmailDeliveryResult = {
  jobId: string
  providerMessageId?: string
  deliveredAt: string
}
