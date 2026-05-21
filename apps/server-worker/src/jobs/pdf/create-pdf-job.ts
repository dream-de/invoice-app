import type { PdfJobFormat, PdfJobPriority, PdfRenderJob } from "./types"

type CreatePdfJobInput = {
  documentId: string
  format?: PdfJobFormat
  requestedBy?: string
  priority?: PdfJobPriority
  locale?: string
  now?: Date
}

export function createPdfRenderJob(input: CreatePdfJobInput): PdfRenderJob {
  const now = input.now ?? new Date()

  return {
    id: `pdf-${input.documentId}-${now.getTime()}`,
    format: input.format ?? "invoice",
    documentId: input.documentId,
    requestedBy: input.requestedBy,
    priority: input.priority ?? "normal",
    locale: input.locale ?? "de-DE",
    createdAt: now.toISOString()
  }
}
