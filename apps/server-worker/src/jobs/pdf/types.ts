export type PdfJobFormat = "invoice" | "offer" | "credit" | "delivery" | "order" | "receipt" | "reminder"

export type PdfJobPriority = "low" | "normal" | "high"

export type PdfRenderJob = {
  id: string
  format: PdfJobFormat
  documentId: string
  requestedBy?: string
  priority: PdfJobPriority
  locale: string
  createdAt: string
}

export type PdfRenderResult = {
  jobId: string
  documentId: string
  fileName: string
  contentType: "application/pdf"
  completedAt: string
}
