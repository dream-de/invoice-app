export type ImportJobKind = "articles" | "customers" | "recipient" | "finance-accounts" | "receipt"

export type ImportJobSource = "csv" | "xlsx" | "pdf" | "image" | "bank-statement" | "manual-upload"

export type ImportJobPriority = "low" | "normal" | "high"

export type ImportFileReference = {
  fileName: string
  contentType?: string
  source: ImportJobSource
  referenceId: string
}

export type ImportProcessingJob = {
  id: string
  kind: ImportJobKind
  file: ImportFileReference
  requestedBy?: string
  priority: ImportJobPriority
  locale: string
  createdAt: string
}

export type ImportProcessingResult = {
  jobId: string
  kind: ImportJobKind
  importedCount: number
  skippedCount: number
  warningCount: number
  completedAt: string
}
